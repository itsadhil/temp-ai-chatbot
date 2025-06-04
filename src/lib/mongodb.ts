import mongoose from "mongoose";

<<<<<<< HEAD
const MONGODB_URI = process.env.MONGODB_URI!;
=======
const MONGODB_URI = process.env.MONGODB_URI;
>>>>>>> dfc731f40074afd9557e8b54b590c5d4c87ddefe

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
<<<<<<< HEAD
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
    }
=======

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
            return mongoose;
        });
    }

>>>>>>> dfc731f40074afd9557e8b54b590c5d4c87ddefe
    cached.conn = await cached.promise;
    return cached.conn;
}

<<<<<<< HEAD
// Define User schema/model ONCE here
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export { connectToDatabase, User };
=======
export default connectToDatabase;
>>>>>>> dfc731f40074afd9557e8b54b590c5d4c87ddefe
