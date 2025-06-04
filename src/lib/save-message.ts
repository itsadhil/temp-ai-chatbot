import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

export async function saveMessage(content: string) {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("messages");
    await collection.insertOne({ content_text: content, createdAt: new Date() });
    await client.close();
}