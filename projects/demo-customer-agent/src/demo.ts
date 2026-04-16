import Anthropic from "@anthropic-ai/sdk";
import { chat } from "./agent.js";

// Demo — จำลองบทสนทนาลูกค้า
const demoQuestions = [
  "Hi, how much does it cost?",
  "What integrations do you support? I need LINE and Salesforce.",
  "สมัครยังไงครับ ใช้เวลานานไหม",
  "I want a refund, this isn't working for me",
  "Can I talk to a real person?",
];

async function runDemo() {
  console.log("=".repeat(60));
  console.log("  AI Customer Service Agent — Demo");
  console.log("  Powered by Jarvis AI Solutions");
  console.log("=".repeat(60));
  console.log();

  const history: Anthropic.Messages.MessageParam[] = [];

  for (const question of demoQuestions) {
    console.log(`👤 Customer: ${question}`);
    console.log();

    const reply = await chat(history, question);
    console.log(`🤖 Agent: ${reply}`);
    console.log();
    console.log("-".repeat(60));
    console.log();
  }

  console.log("=".repeat(60));
  console.log("  Demo complete — 5 conversations handled");
  console.log("=".repeat(60));
}

runDemo().catch(console.error);
