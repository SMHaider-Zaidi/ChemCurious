import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, STUDENT_SESSION_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/auth";
import { User, ensureDbSynced } from "@/lib/db";

export async function GET() {
  try {
    await ensureDbSynced();

    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(STUDENT_SESSION_COOKIE) || cookieStore.get(LEGACY_SESSION_COOKIE);

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = verifyToken(tokenCookie.value);
    if (!payload || !payload.id) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Fetch user details from MySQL to verify they exist and are current
    const dbUser = await User.findByPk(payload.id);
    if (!dbUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Safely extract properties to avoid undefined errors
    const userId = dbUser.get("id");
    const userEmail = dbUser.get("email");
    const userName = dbUser.get("name");
    const userCreatedAt = dbUser.get("createdAt");

    // Strict Role Policy: Only student accounts are valid for the Student Website
    if (dbUser.role !== "student") {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: userId ? userId.toString() : "",
        email: userEmail || "",
        name: userName || "",
        createdAt: userCreatedAt ? new Date(userCreatedAt).toISOString() : new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error("Me API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
