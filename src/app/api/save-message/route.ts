import { NextRequest } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = "rag";

export async function POST(req: NextRequest) {
    try {
        const { content, role } = await req.json();
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("messages");
        await collection.insertOne({ content, role, createdAt: new Date() });
        await client.close();
        return Response.json({ success: true });
    } catch (err) {
        console.error("Error saving message:", err);
        return Response.json({ success: false, error: err?.message || "Unknown error" }, { status: 500 });
    }
}