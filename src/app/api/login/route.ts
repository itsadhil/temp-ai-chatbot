import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { connectToDatabase, User } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    await connectToDatabase();
    const user = await User.findOne({ email });
    if (!user) return Response.json({ success: false, error: "User not found" }, { status: 401 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });

    return Response.json({ success: true });
  } catch (e) {
    console.error("Login error:", e);
    return Response.json({ success: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}