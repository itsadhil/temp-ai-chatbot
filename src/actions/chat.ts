"use server";

import { streamText } from "ai";
import { gemini } from "@/lib/gemini";
import { geminiEmbed } from "@/lib/gemini-embed";
import { createStreamableValue } from "ai/rsc";
import { Message } from "@/components/chat-box";

// Helper to call your RAG API
async function getRagContext(question: string): Promise<string[]> {
    const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
        "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/rag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        console.error("Failed to parse /api/rag response as JSON:", e);
        return [];
    }
    return data.context || [];
}

// Cosine similarity function
function cosineSimilarity(a: number[], b: number[]) {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
}

// Extract user facts (simple example, expand as needed)
function extractFacts(history: Message[]): string[] {
    const facts: string[] = [];
    for (const msg of history) {
        if (msg.role === "user") {
            // Example: extract name
            const nameMatch = msg.content.match(/my name is ([\w\s]+)/i);
            if (nameMatch) facts.push(`User's name is ${nameMatch[1].trim()}.`);
            const locationMatch = msg.content.match(/i live in ([\w\s]+)/i);
            if (locationMatch) facts.push(`User lives in ${locationMatch[1].trim()}.`);
            // Add more patterns as needed
        }
    }
    return facts;
}

export const chat = async (history: Message[]) => {
    const lastUserMsg = history.filter(m => m.role === "user").pop();
    let context = "";

    // 1. Use your RAG API to get relevant docs
    let docs: string[] = [];
    if (lastUserMsg) {
        docs = await getRagContext(lastUserMsg.content);
        if (docs.length) {
            context = docs.join("\n---\n");
        }
    }

    // 2. Extract memory facts from user history
    const memoryFacts = extractFacts(history);

    // 3. Embed the last question and all memory facts
    let relevantFacts: string[] = [];
    if (lastUserMsg && memoryFacts.length) {
        const [questionEmbedding, ...factEmbeddings] = await Promise.all([
            geminiEmbed(lastUserMsg.content),
            ...memoryFacts.map(fact => geminiEmbed(fact)),
        ]);
        // Compute similarity for each fact
        const scoredFacts = memoryFacts.map((fact, i) => ({
            fact,
            score: cosineSimilarity(questionEmbedding, factEmbeddings[i]),
        }));
        // Sort by similarity and take top 2 (or all above a threshold)
        relevantFacts = scoredFacts
            .sort((a, b) => b.score - a.score)
            .filter(f => f.score > 0.7) // adjust threshold as needed
            .map(f => f.fact);
    }

    // 4. Print debug info
    console.log("RAG DEBUG:");
    if (lastUserMsg) {
        console.log("Question:", lastUserMsg.content);
    }
    console.log("RAG Context:", context);
    console.log("Extracted Memory Facts:", memoryFacts);
    console.log("Relevant Memory Used:", relevantFacts);

    // 5. Build the prompt for Gemini
    const userMemory = history
        .filter(m => m.role === "user")
        .map(m => m.content)
        .join("\n");

    const augmentedMessages = lastUserMsg
        ? [
            ...history.slice(0, -1),
            {
                ...lastUserMsg,
                content: `You are a helpful assistant. Use the following context, memory, and conversation history to answer the user's question.

Conversation history:
${userMemory}

Relevant memory facts:
${relevantFacts.join("\n")}

Knowledge base context:
${context}

User: ${lastUserMsg.content}
Assistant:`,
            },
        ]
        : history;

    const stream = createStreamableValue();

    (async () => {
        const { textStream } = streamText({
            model: gemini("gemini-1.5-flash"),
            messages: augmentedMessages,
        });

        for await (const text of textStream) {
            stream.update(text);
        }

        stream.done();
    })();

    return { newMessage: stream.value };
};
