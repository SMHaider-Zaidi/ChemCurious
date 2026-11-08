import { NextResponse } from "next/server";
import { User, ensureDbSynced } from "@/lib/db";
import { verifyPassword, signToken, ADMIN_SESSION_COOKIE, STUDENT_SESSION_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    await ensureDbSynced();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const clientIp = getClientIp(request) || "127.0.0.1";
    const rateLimitKey = `admin-login:${clientIp}:${normalizedEmail}`;
    const rateLimit = checkRateLimit(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 10 });

    if (!rateLimit.success) {
      const waitMinutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many failed login attempts. Please try again in ${waitMinutes} minute(s).` },
        { status: 429 }
      );
    }

    // Fetch user from MySQL
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check account status
    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Forbidden: Account has been suspended. Please contact administrator." },
        { status: 403 }
      );
    }

    // Strict role check: Only admin and staff are allowed to sign in here
    if (user.role !== "admin" && user.role !== "staff") {
      return NextResponse.json(
        { error: "Access denied. Student accounts must sign in using the Student portal." },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Reset rate limiter on successful authentication
    resetRateLimit(rateLimitKey);

    // Update last_login_at
    user.lastLoginAt = new Date();
    await user.save();

    // Create session token
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";

    // Set isolated admin session cookie
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    // Clear any leftover student cookies
    cookieStore.delete(STUDENT_SESSION_COOKIE);
    cookieStore.delete(LEGACY_SESSION_COOKIE);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      institution: user.institution || "",
      role: user.role,
      status: user.status,
    });
  } catch (error: any) {
    console.error("Admin Login API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
