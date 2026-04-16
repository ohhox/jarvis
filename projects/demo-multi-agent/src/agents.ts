import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Each agent has a specific role and personality

export interface AgentResult {
  agent: string;
  output: string;
}

async function callAgent(
  role: string,
  systemPrompt: string,
  task: string
): Promise<AgentResult> {
  console.log(`  [${role}] Working...`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: task }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  console.log(`  [${role}] Done.`);
  return { agent: role, output: text };
}

// Agent 1: Researcher
export async function researcher(topic: string): Promise<AgentResult> {
  return callAgent(
    "Researcher",
    `You are a research specialist. Your job is to analyze a topic and provide:
- 3-5 key points about the topic
- Target audience insights
- Trending angles that would make good content
- Key statistics or data points (you can estimate realistic ones)
Be concise and structured. Output in bullet points.`,
    `Research this topic for a blog post: "${topic}"`
  );
}

// Agent 2: Writer
export async function writer(
  topic: string,
  research: string
): Promise<AgentResult> {
  return callAgent(
    "Writer",
    `You are a professional content writer. Write engaging, clear, and well-structured blog posts.
Use a conversational but authoritative tone. Include headers, short paragraphs, and actionable takeaways.
Keep the post around 400-600 words.`,
    `Write a blog post about: "${topic}"

Use this research as your foundation:
${research}`
  );
}

// Agent 3: Editor / Reviewer
export async function editor(draft: string): Promise<AgentResult> {
  return callAgent(
    "Editor",
    `You are a senior editor. Review the draft and provide:
1. Overall quality score (1-10)
2. What works well (2-3 points)
3. What needs improvement (2-3 points)
4. Specific edits (show before/after for 2-3 sentences)
5. SEO suggestions (title, meta description, keywords)
Be constructive and specific.`,
    `Review this blog post draft:\n\n${draft}`
  );
}

// Agent 4: Final Publisher
export async function publisher(
  draft: string,
  editorFeedback: string
): Promise<AgentResult> {
  return callAgent(
    "Publisher",
    `You are the final publisher. Take the draft and editor's feedback, then produce the final version.
Apply the editor's suggestions where appropriate. Add:
- Final optimized title
- Meta description (under 160 chars)
- 5 SEO keywords
- Social media caption (for Twitter/LinkedIn)
Output the complete final article with metadata at the top.`,
    `Original draft:
${draft}

Editor's feedback:
${editorFeedback}

Produce the final published version.`
  );
}
