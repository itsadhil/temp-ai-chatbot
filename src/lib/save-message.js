const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/rag";
const dbName = "rag";

async function saveMessage(content, role = "user") {
    console.log("saveMessage called with:", content, role);
    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("messages");
        await collection.insertOne({ content, role, createdAt: new Date() });
        await client.close();
        console.log("Message saved!");
    } catch (err) {
        console.error("Error saving message:", err);
    }
}

saveMessage("test message", "user");