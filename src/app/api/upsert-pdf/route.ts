import { NextRequest } from "next/server";
import client from "@/lib/weaviate";
import { geminiEmbed } from "@/lib/gemini-embed";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const { chunks } = await req.json();
        for (const chunk of chunks) {
            const embedding = await geminiEmbed(chunk);
            await client.data
                .creator()
                .withClassName("Document")
                .withId(uuidv4())
                .withProperties({ text: chunk })
                .withVector(embedding)
                .do();
        }
        return Response.json({ success: true });
    } catch (e) {
        console.error("PDF upsert error:", e);
        return Response.json({ success: false, error: e?.message || "Unknown error" }, { status: 500 });
    }
}