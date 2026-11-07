import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, STUDENT_SESSION_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/auth-constants";

const STUDENT_PROTECTED_ROUTES = [
  "/periodic-table",
  "/quizzes",
  "/reactions",
  "/molecules",
  "/periodic",
  "/dashboard",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value?.trim();
  const studentSession =
    request.cookies.get(STUDENT_SESSION_COOKIE)?.value?.trim() ||
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value?.trim();

  // 1. Admin Routes (/admin, /admin/*)
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/forbidden") {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Protected admin routes: requires admin session
    if (!adminSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth";
      loginUrl.searchParams.set("portal", "admin");
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 2. Auth Page (/auth)
  if (pathname === "/auth") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 3. Protected Student Routes
  const isStudentProtected = STUDENT_PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isStudentProtected && !studentSession) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/auth"; 
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/auth",
    "/dashboard",
    "/dashboard/:path*",
    "/periodic-table",
    "/periodic-table/:path*",
    "/periodic",
    "/periodic/:path*",
    "/quizzes",
    "/quizzes/:path*",
    "/reactions",
    "/reactions/:path*",
    "/molecules",
    "/molecules/:path*",
  ],
};
