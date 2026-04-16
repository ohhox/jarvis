import { researcher, writer, editor, publisher } from "./agents.js";

export interface PipelineResult {
  topic: string;
  research: string;
  draft: string;
  review: string;
  final: string;
}

export async function runContentPipeline(
  topic: string
): Promise<PipelineResult> {
  console.log("\n--- Stage 1: Research ---");
  const researchResult = await researcher(topic);

  console.log("\n--- Stage 2: Write ---");
  const writerResult = await writer(topic, researchResult.output);

  console.log("\n--- Stage 3: Review ---");
  const editorResult = await editor(writerResult.output);

  console.log("\n--- Stage 4: Publish ---");
  const publisherResult = await publisher(
    writerResult.output,
    editorResult.output
  );

  return {
    topic,
    research: researchResult.output,
    draft: writerResult.output,
    review: editorResult.output,
    final: publisherResult.output,
  };
}
