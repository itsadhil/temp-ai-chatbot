import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { connectToDatabase, User } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);

    await connectToDatabase();
    await User.create({ email, password: hashedPassword });

    return Response.json({ success: true });
  } catch (e) {
    console.error("Registration error:", e);
    return Response.json({ success: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}