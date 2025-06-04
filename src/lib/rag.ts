import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

export async function retrieveRelevantMsgs(query: string, limit = 3) {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("messages");

    const docs = await collection
        .find({ $text: { $search: query } })
        .limit(limit)
        .toArray();

    await client.close();
    return docs.map(doc => doc.content_text);
}