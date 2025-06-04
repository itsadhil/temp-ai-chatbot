import client from "./weaviate";

export async function queryWeaviate(queryEmbedding: number[], topK = 3) {
  try {
    const res = await client.graphql
      .get()
      .withClassName("Document")
      .withFields("text _additional {certainty}")
      .withNearVector({ vector: queryEmbedding })
      .withLimit(topK)
      .do();

    // Defensive: check for expected structure
    if (
      res?.data?.Get?.Document &&
      Array.isArray(res.data.Get.Document)
    ) {
      return res.data.Get.Document.map((doc: any) => doc.text);
    } else {
      console.error("Weaviate response missing expected structure:", res);
      return [];
    }
  } catch (e) {
    console.error("Weaviate query error:", e);
    return [];
  }
}