import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// logout API route handler

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("chemistry-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0), // Immediately expire the session cookie
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
