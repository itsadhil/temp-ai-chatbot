import "dotenv/config";
import weaviate, { WeaviateClient, ApiKey } from "weaviate-ts-client";
import { geminiEmbed } from "../src/lib/gemini-embed";
import { v4 as uuidv4 } from "uuid";

const client: WeaviateClient = weaviate.client({
  scheme: "https",
  host: process.env.WEAVIATE_HOST!,
  apiKey: new ApiKey(process.env.WEAVIATE_API_KEY!),
});

const docs = [
  "Document chunk 1...",
  "Document chunk 2...",
  // Add your knowledge base chunks here
];

async function main() {
  for (let i = 0; i < docs.length; i++) {
    const embedding = await geminiEmbed(docs[i]);
    await client.data
      .creator()
      .withClassName("Document")
      .withId(uuidv4()) // Use a valid UUID
      .withProperties({ text: docs[i] })
      .withVector(embedding)
      .do();
  }
  console.log("Upserted docs!");
}

main();