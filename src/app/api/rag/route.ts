import { geminiEmbed } from "@/lib/gemini-embed";
import { queryWeaviate } from "@/lib/weaviate-query";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question) {
      return Response.json({ context: [], error: "No question provided" }, { status: 400 });
    }
    const embedding = await geminiEmbed(question);
    const contextChunks = await queryWeaviate(embedding, 3);
    return Response.json({ context: contextChunks });
  } catch (e) {
    console.error("RAG API error:", e);
    return Response.json({ context: [], error: e?.message || "Unknown error" }, { status: 500 });
  }
}