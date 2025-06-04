import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

// Define User schema/model ONCE here
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export { connectToDatabase, User };