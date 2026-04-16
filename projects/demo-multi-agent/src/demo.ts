import { runContentPipeline } from "./orchestrator.js";

async function runDemo() {
  console.log("=".repeat(60));
  console.log("  Multi-Agent Content Production System");
  console.log("  Powered by Jarvis AI Solutions");
  console.log("=".repeat(60));
  console.log();
  console.log("Agents in this pipeline:");
  console.log("  1. Researcher — gathers key insights");
  console.log("  2. Writer — produces the draft");
  console.log("  3. Editor — reviews and suggests improvements");
  console.log("  4. Publisher — finalizes and adds SEO metadata");
  console.log();

  const topic = "How AI Agents Are Transforming Small Business Operations in 2026";

  console.log(`Topic: "${topic}"`);
  console.log("=".repeat(60));

  const result = await runContentPipeline(topic);

  // Show each stage
  console.log("\n" + "=".repeat(60));
  console.log("  RESEARCH OUTPUT");
  console.log("=".repeat(60));
  console.log(result.research);

  console.log("\n" + "=".repeat(60));
  console.log("  FIRST DRAFT");
  console.log("=".repeat(60));
  console.log(result.draft);

  console.log("\n" + "=".repeat(60));
  console.log("  EDITOR REVIEW");
  console.log("=".repeat(60));
  console.log(result.review);

  console.log("\n" + "=".repeat(60));
  console.log("  FINAL PUBLISHED VERSION");
  console.log("=".repeat(60));
  console.log(result.final);

  console.log("\n" + "=".repeat(60));
  console.log("  PIPELINE COMPLETE");
  console.log(`  4 agents collaborated to produce this content`);
  console.log("=".repeat(60));
}

runDemo().catch(console.error);
