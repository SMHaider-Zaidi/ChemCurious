import { NextResponse } from "next/server";
import { getCurrentUser } from "./admin-auth";
import type { CurrentUser, Role } from "./admin/types";

export type AdminHandler<TContext = any> = (
  req: Request,
  user: CurrentUser,
  context: TContext
) => Promise<Response> | Response;

export interface WithAdminOptions {
  roles?: Role[];
}

/**
 * Higher-order guard function for Admin API routes.
 * Enforces session validation, fresh database status/role checks,
 * role authorization, and CSRF/origin safety on mutating requests.
 */
export function withAdmin<TContext = any>(
  handler: AdminHandler<TContext>,
  options: WithAdminOptions = {}
) {
  const allowedRoles = options.roles || ["staff", "admin"];

  return async (req: Request, context: TContext): Promise<Response> => {
    try {
      const { user, error } = await getCurrentUser();

      if (error === "insufficient_role") {
        return NextResponse.json(
          { error: "Forbidden: Insufficient privileges. Administrator or staff account required." },
          { status: 403 }
        );
      }

      if (!user || error === "no_token" || error === "invalid_token" || error === "user_not_found") {
        return NextResponse.json(
          { error: "Unauthorized: Active session required" },
          { status: 401 }
        );
      }

      if (user.status === "suspended") {
        return NextResponse.json(
          { error: "Forbidden: Account is suspended" },
          { status: 403 }
        );
      }

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient privileges" },
          { status: 403 }
        );
      }

      // CSRF / Same-Origin Check on mutating requests
      const method = req.method.toUpperCase();
      if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
        const originHeader = req.headers.get("origin");
        const hostHeader = req.headers.get("host");

        if (originHeader && hostHeader) {
          try {
            const originHost = new URL(originHeader).host;
            if (originHost !== hostHeader) {
              return NextResponse.json(
                { error: "Forbidden: Cross-site request rejected" },
                { status: 403 }
              );
            }
          } catch {
            return NextResponse.json(
              { error: "Forbidden: Malformed Origin header" },
              { status: 403 }
            );
          }
        }

        // Payload body parsing and validation is handled downstream by validateBody
      }

      return await handler(req, user, context);
    } catch (err: any) {
      console.error("Admin Route Handler Error:", err);

      // Check if it's a unique constraint violation (from Sequelize, MySQL, or anywhere)
      if (
        err.name === "SequelizeUniqueConstraintError" ||
        err.name === "UniqueConstraintError" ||
        err.original?.code === "ER_DUP_ENTRY" ||
        err.parent?.code === "ER_DUP_ENTRY"
      ) {
        const field = err.errors?.[0]?.path || (err.fields ? Object.keys(err.fields)[0] : "name");
        const val = err.errors?.[0]?.value || "";
        const valStr = val ? ` "${val}"` : "";
        const cleanMsg = err.original?.sqlMessage || err.parent?.sqlMessage || "";
        return NextResponse.json(
          {
            error: `Duplicate entry: A record with ${field}${valStr} already exists. Please choose a different ${field}.${cleanMsg ? ` (${cleanMsg})` : ""}`,
            details: err.errors?.reduce((acc: any, e: any) => ({ ...acc, [e.path]: e.message }), {}),
          },
          { status: 409 }
        );
      }

      // Check if it's a validation error
      if (
        err.name === "SequelizeValidationError" ||
        err.name === "ValidationError" ||
        err.name?.includes("Validation")
      ) {
        const detailedMessages = err.errors?.map((e: any) => `${e.path || "field"}: ${e.message}`).join(", ");
        const message = detailedMessages || err.original?.sqlMessage || err.parent?.sqlMessage || err.message;
        return NextResponse.json(
          {
            error: `Validation failed: ${message}`,
            details: err.errors?.reduce((acc: any, e: any) => ({ ...acc, [e.path || "unknown"]: e.message }), {}),
          },
          { status: 400 }
        );
      }

      // Database error (SequelizeDatabaseError or raw MySQL error)
      if (err.name === "SequelizeDatabaseError" || err.original?.sqlMessage || err.parent?.sqlMessage) {
        const sqlMsg = err.original?.sqlMessage || err.parent?.sqlMessage || err.message;
        return NextResponse.json(
          { error: `Database error: ${sqlMsg}` },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: err.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
