import Anthropic from "@anthropic-ai/sdk";
import { searchKnowledge, type KBArticle } from "./knowledge-base.js";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a friendly and helpful customer service agent.

RULES:
- Answer ONLY based on the knowledge base articles provided
- If the answer is not in the knowledge base, say "I don't have that information, let me connect you with a human agent"
- Be concise but complete
- Use a warm, professional tone
- If the customer seems frustrated, acknowledge their feelings first
- Support both Thai and English — respond in the language the customer uses`;

// Tool definition สำหรับ Claude — ให้ agent ค้นหา knowledge base เอง
const tools: Anthropic.Messages.Tool[] = [
  {
    name: "search_knowledge_base",
    description:
      "Search the company knowledge base for articles relevant to the customer's question. Use this to find accurate information before answering.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query based on the customer's question",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Escalate the conversation to a human agent when you cannot help the customer or they explicitly request it.",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: {
          type: "string",
          description: "Why this needs human attention",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Urgency level",
        },
      },
      required: ["reason", "priority"],
    },
  },
];

function handleToolCall(
  name: string,
  input: Record<string, string>
): string {
  if (name === "search_knowledge_base") {
    const results = searchKnowledge(input.query);
    if (results.length === 0) {
      return "No relevant articles found in the knowledge base.";
    }
    return results
      .map((a: KBArticle) => `## ${a.title}\n${a.content}`)
      .join("\n\n---\n\n");
  }

  if (name === "escalate_to_human") {
    return `[ESCALATED] Reason: ${input.reason} | Priority: ${input.priority} — A human agent will follow up shortly.`;
  }

  return "Unknown tool";
}

export async function chat(
  conversationHistory: Anthropic.Messages.MessageParam[],
  userMessage: string
): Promise<string> {
  conversationHistory.push({ role: "user", content: userMessage });

  let response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools,
    messages: conversationHistory,
  });

  // Agentic loop — ให้ agent ใช้ tools จนกว่าจะตอบได้
  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
    );

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] =
      toolUseBlocks.map((block) => ({
        type: "tool_result" as const,
        tool_use_id: block.id,
        content: handleToolCall(
          block.name,
          block.input as Record<string, string>
        ),
      }));

    conversationHistory.push({ role: "assistant", content: response.content });
    conversationHistory.push({ role: "user", content: toolResults });

    response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages: conversationHistory,
    });
  }

  const textBlock = response.content.find(
    (b): b is Anthropic.Messages.TextBlock => b.type === "text"
  );
  const reply = textBlock?.text ?? "I'm sorry, I couldn't process that.";

  conversationHistory.push({ role: "assistant", content: reply });
  return reply;
}
