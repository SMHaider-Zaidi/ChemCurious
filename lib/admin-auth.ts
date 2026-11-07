import { cookies } from "next/headers";
import { verifyToken, ADMIN_SESSION_COOKIE } from "./auth";
import { User, ensureDbSynced } from "./db";
import type { CurrentUser, Role, AccountStatus } from "./admin/types";

export interface GetCurrentUserResult {
  user: CurrentUser | null;
  error?: "no_token" | "invalid_token" | "user_not_found" | "suspended" | "insufficient_role";
}

/**
 * Retrieves the currently authenticated admin user from the database.
 * Never trusts role or status from token claims; always fetches fresh data from MySQL.
 */
export async function getCurrentUser(): Promise<GetCurrentUserResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) {
      return { user: null, error: "no_token" };
    }

    const payload = verifyToken(token);
    if (!payload || !payload.id) {
      return { user: null, error: "invalid_token" };
    }

    await ensureDbSynced();

    const dbUser = await User.findByPk(payload.id, {
      attributes: ["id", "name", "email", "institution", "role", "status"],
    });

    if (!dbUser) {
      return { user: null, error: "user_not_found" };
    }

    if (dbUser.status === "suspended") {
      return {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          institution: dbUser.institution,
          role: dbUser.role as Role,
          status: "suspended",
        },
        error: "suspended",
      };
    }

    // Reject non-admin roles (strict backend enforcement)
    if (dbUser.role !== "admin" && dbUser.role !== "staff") {
      return {
        user: null,
        error: "insufficient_role",
      };
    }

    return {
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        institution: dbUser.institution,
        role: dbUser.role as Role,
        status: dbUser.status as AccountStatus,
      },
    };
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return { user: null, error: "invalid_token" };
  }
}
