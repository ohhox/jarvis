import * as readline from "readline";
import Anthropic from "@anthropic-ai/sdk";
import { chat } from "./agent.js";

// Interactive mode — คุยกับ agent ได้เลย
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const history: Anthropic.Messages.MessageParam[] = [];

console.log("=".repeat(50));
console.log("  AI Customer Service Agent");
console.log("  Type your message or 'quit' to exit");
console.log("=".repeat(50));
console.log();

function prompt() {
  rl.question("You: ", async (input) => {
    const trimmed = input.trim();
    if (!trimmed || trimmed === "quit") {
      console.log("Goodbye!");
      rl.close();
      return;
    }

    try {
      const reply = await chat(history, trimmed);
      console.log(`\nAgent: ${reply}\n`);
    } catch (err) {
      console.error("Error:", err);
    }

    prompt();
  });
}

prompt();
