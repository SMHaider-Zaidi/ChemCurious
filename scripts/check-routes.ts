/**
 * check-routes.ts – verifies that every admin endpoint in docs/ADMIN_CONTRACT.md
 * has a matching route file and that no extra (undocumented) route files exist.
 *
 * Exit 0  → 0 problems
 * Exit 1  → problems found (lists them)
 */
import { existsSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

const root = process.cwd();

// ---------------------------------------------------------------------------
// Expected routes derived directly from docs/ADMIN_CONTRACT.md
// Each entry: { file: path relative to root, methods: HTTP verbs exported }
// ---------------------------------------------------------------------------
const CONTRACT_ROUTES: { file: string; methods: string[] }[] = [
  { file: "app/api/admin/me/route.ts",                                   methods: ["GET"] },
  { file: "app/api/admin/dashboard/route.ts",                            methods: ["GET"] },
  { file: "app/api/admin/quizzes/chapters/route.ts",                     methods: ["GET", "POST"] },
  { file: "app/api/admin/quizzes/chapters/[id]/route.ts",                methods: ["GET", "PUT", "DELETE"] },
  { file: "app/api/admin/quizzes/chapters/[id]/status/route.ts",         methods: ["PATCH"] },
  { file: "app/api/admin/quizzes/chapters/reorder/route.ts",             methods: ["POST"] },
  { file: "app/api/admin/quizzes/questions/route.ts",                    methods: ["GET", "POST"] },
  { file: "app/api/admin/quizzes/questions/[id]/route.ts",               methods: ["GET", "PUT", "DELETE"] },
  { file: "app/api/admin/quizzes/questions/[id]/status/route.ts",        methods: ["PATCH"] },
  { file: "app/api/admin/quizzes/questions/bulk-import/route.ts",        methods: ["POST"] },
  { file: "app/api/admin/uploads/route.ts",                              methods: ["POST"] },
  { file: "app/api/admin/reactions/route.ts",                            methods: ["GET", "POST"] },
  { file: "app/api/admin/reactions/[id]/route.ts",                       methods: ["GET", "PUT", "DELETE"] },
  { file: "app/api/admin/reactions/[id]/status/route.ts",                methods: ["PATCH"] },
  { file: "app/api/admin/molecules/route.ts",                            methods: ["GET", "POST"] },
  { file: "app/api/admin/molecules/[id]/route.ts",                       methods: ["GET", "PUT", "DELETE"] },
  { file: "app/api/admin/molecules/[id]/status/route.ts",                methods: ["PATCH"] },
  { file: "app/api/admin/molecules/fetch-pubchem/route.ts",              methods: ["POST"] },
  { file: "app/api/admin/students/route.ts",                             methods: ["GET"] },
  { file: "app/api/admin/students/[id]/route.ts",                        methods: ["GET"] },
  { file: "app/api/admin/leaderboard/route.ts",                          methods: ["GET"] },
  { file: "app/api/admin/analytics/quizzes/route.ts",                    methods: ["GET"] },
  { file: "app/api/admin/users/route.ts",                                methods: ["GET", "PATCH"] },
  { file: "app/api/admin/users/settings/route.ts",                       methods: ["GET", "PUT"] },
  { file: "app/api/admin/users/[id]/role/route.ts",                      methods: ["PATCH"] },
  { file: "app/api/admin/users/[id]/status/route.ts",                    methods: ["PATCH"] },
  { file: "app/api/admin/audit-logs/route.ts",                           methods: ["GET"] },
  { file: "app/uploads/[file]/route.ts",                                 methods: ["GET"] },
];

const CONTRACT_FILES = new Set(CONTRACT_ROUTES.map((r) => r.file.replace(/\//g, "/")));

// ---------------------------------------------------------------------------
// Collect every route.ts that actually exists under app/api/admin + app/uploads/[file]
// ---------------------------------------------------------------------------
function walkDir(dir: string, base: string, acc: string[]): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel  = join(base, entry).replace(/\\/g, "/");
    if (statSync(full).isDirectory()) {
      walkDir(full, rel, acc);
    } else if (entry === "route.ts") {
      acc.push(rel);
    }
  }
}

const existing: string[] = [];
walkDir(join(root, "app/api/admin"), "app/api/admin", existing);

// Also check the public uploads route
const uploadsRouteFile = "app/uploads/[file]/route.ts";
if (existsSync(join(root, uploadsRouteFile))) {
  existing.push(uploadsRouteFile);
}

const existingSet = new Set(existing.map((f) => f.replace(/\\/g, "/")));

// ---------------------------------------------------------------------------
// Check 1: Missing routes (in contract but not on disk)
// ---------------------------------------------------------------------------
const problems: string[] = [];

for (const entry of CONTRACT_ROUTES) {
  const filePath = entry.file.replace(/\//g, "/");
  if (!existingSet.has(filePath)) {
    problems.push(`MISSING file: ${filePath}   (expected methods: ${entry.methods.join(", ")})`);
  }
}

// ---------------------------------------------------------------------------
// Check 2: Extra / undocumented routes
// ---------------------------------------------------------------------------
for (const f of existing) {
  const normalized = f.replace(/\\/g, "/");
  if (!CONTRACT_FILES.has(normalized)) {
    problems.push(`EXTRA (not in contract): ${normalized}`);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
if (problems.length === 0) {
  console.log("0 problems");
  process.exit(0);
} else {
  console.error(`${problems.length} problem(s) found:\n`);
  for (const p of problems) console.error("  ✗ " + p);
  process.exit(1);
}
