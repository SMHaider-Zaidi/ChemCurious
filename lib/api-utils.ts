import { NextResponse } from "next/server";
import { z, ZodError, type ZodTypeAny } from "zod";

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Standardized error response factory.
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: Record<string, string | string[]>
) {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

/**
 * Parses and sanitizes URL search pagination parameters.
 */
export function parsePagination(searchParams: URLSearchParams, defaultPageSize = 20): {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
} {
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawPageSize = parseInt(searchParams.get("pageSize") || String(defaultPageSize), 10);

  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = isNaN(rawPageSize) || rawPageSize < 1 ? defaultPageSize : Math.min(100, rawPageSize);

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}

/**
 * Validates request data with a Zod schema, returning parsed data or a 400 NextResponse with field details.
 */
export async function validateBody<S extends ZodTypeAny>(
  req: Request,
  schema: S
): Promise<{ data: z.infer<S> | null; response: NextResponse | null }> {
  try {
    const raw = await req.json();
    const parsed = schema.parse(raw);
    return { data: parsed, response: null };
  } catch (err: any) {
    if (err instanceof ZodError) {
      const details: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const path = issue.path.join(".") || "root";
        if (!details[path]) details[path] = [];
        details[path].push(issue.message);
      }
      return { data: null, response: errorResponse("Validation failed", 400, details) };
    }
    return { data: null, response: errorResponse(err.message || "Invalid JSON payload", 400) };
  }
}

/**
 * Safely formats any date/string to ISO string without throwing RangeError.
 */
export function safeIsoDate(val: any, fallback: string | null = null): string | null {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? fallback : d.toISOString();
  } catch {
    return fallback;
  }
}
