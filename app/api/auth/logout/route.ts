import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { STUDENT_SESSION_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/auth";

// Student logout API route handler

export async function POST() {
  try {
    const cookieStore = await cookies();
    // Clear student session cookies
    cookieStore.set(STUDENT_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    });

    cookieStore.set(LEGACY_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
