import weaviate, { WeaviateClient, ApiKey } from "weaviate-ts-client";

const client: WeaviateClient = weaviate.client({
  scheme: "https",
  host: process.env.WEAVIATE_HOST!,
  apiKey: new ApiKey(process.env.WEAVIATE_API_KEY!),
});

export default client;