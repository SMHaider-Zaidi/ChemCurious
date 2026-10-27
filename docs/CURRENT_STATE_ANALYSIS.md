# Comprehensive Current State Analysis: Chemistry Playground
**Target Objective:** Building an Integrated Admin Portal (`app/admin`, `app/api/admin`, Shared Database, Unified Auth)  
**Report Type:** Read-Only Technical Audit  
**Date:** October 29, 2026  
**Auditor:** Senior Full-Stack Systems Engineer  

---

## Executive Summary
*(Max 15 lines)*
1. **Core Architecture:** Next.js 16.2.4 (Turbopack, App Router, React 19), Tailwind CSS v4, MySQL via Sequelize 6.37.8, custom stateless HMAC-SHA256 cookie auth (`chemistry-session`).
2. **Current Database:** Local MySQL schema (`chemistry_db`, utf8mb4) contains 6 active tables: `chapters` (41 rows), `questions` (615), `molecules` (170), `reactions` (274), `quiz_attempts` (1), and `users` (2).
3. **Missing Admin Core:** Zero admin infrastructure exists. No `role` or `status` columns exist on `users`; no `audit_logs` or `quiz_attempt_answers` tables exist; no `/api/admin` endpoints exist.
4. **Critical Risk 1 (Database Alteration):** `lib/db.ts` automatically executes `sequelize.sync({ alter: true })` on module import, risking live database alteration or deadlocks during development.
5. **Critical Risk 2 (Quiz Security):** Student endpoint `GET /api/quizzes` directly leaks `correctAnswer` and `explanation` before quiz submission, and `POST /api/quizzes/submit` trusts client-calculated scores without server validation.
6. **Critical Risk 3 (XSS Vulnerability):** `components/quiz-system.tsx` renders raw HTML via `dangerouslySetInnerHTML` without DOMPurify or sanitize-html installed.
7. **Critical Risk 4 (Auth & Secrets):** Token generation in `lib/auth.ts` has a hardcoded secret fallback, lacks role claims, and `middleware.ts` only validates cookie presence without verifying signatures.
8. **External Portal Assets:** A standalone Vite/TanStack Router Lovable admin portal exists in sibling directory `../Chemistry-playground-portal/chemistry-playground-portal` expecting rich text HTML, Tiptap, and DOMPurify.
9. **Readiness:** **Conditioned on schema migration.** Database schema must be migrated (adding `role`, `status`, `quiz_attempt_answers`, and audit tables) and `sequelize.sync({ alter: true })` must be disabled before building admin features.

---

## 1. Stack, Versions, Scripts & UI Primitives

### 1.1 Core Runtime & Frameworks
*Verified in code: [package.json](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/package.json#L1-L82)*

| Package / Technology | Specified Version | Installed / Real Version | Status |
|---|---|---|---|
| **Next.js** | `^16.2.4` | `16.2.4` | Verified in code (`package.json:55`) |
| **React** | `^19` | `19.2.0` | Verified in code (`package.json:57`) |
| **React-DOM** | `^19` | `19.2.0` | Verified in code (`package.json:59`) |
| **TypeScript** | `^5` | `5.9.3` | Verified in code (`package.json:80`) |
| **Tailwind CSS** | `^4.1.9` | `4.1.9` (Tailwind v4 with `@tailwindcss/postcss`) | Verified in code (`package.json:78`) |
| **Sequelize** | `^6.37.8` | `6.37.8` | Verified in code (`package.json:63`) |
| **MySQL Driver (mysql2)** | `^3.22.5` | `3.22.5` | Verified in code (`package.json:54`) |
| **Three.js** | `0.180.0` | `0.180.0` (with `@react-three/fiber: 9.4.0`, `@react-three/drei: 10.7.6`) | Verified in code (`package.json:41-42,67`) |

### 1.2 Scripts Inventory
*Verified in code: [package.json](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/package.json#L5-L11)*

- `"dev": "next dev"` — Starts Next.js development server with Turbopack enabled by default.
- `"build": "next build"` — Produces Next.js production build.
- `"start": "next start"` — Runs production Next.js server.
- `"lint": "eslint ."` — Lints source files.
- `"seed": "tsx lib/seed.ts"` — **Defect Identified:** `tsx` is **not installed** in `dependencies` or `devDependencies` in `package.json`. Running `npm run seed` fails unless `tsx` is installed globally or added to devDependencies.

### 1.3 UI & Data Libraries Audit

| Library | Status | Package / Version | Notes |
|---|---|---|---|
| **zod** | Installed | `3.25.76` | Verified in code (`package.json:69`) |
| **react-hook-form** | Installed | `^7.60.0` | Verified in code (`package.json:60`) |
| **@hookform/resolvers** | Installed | `^3.10.0` | Verified in code (`package.json:13`) |
| **recharts** | Installed | `2.15.4` | Verified in code (`package.json:62`) |
| **sonner** | Installed | `^1.7.4` | Verified in code (`package.json:64`) |
| **@tanstack/react-query** | **Does not exist** | Not installed | Verified in code (`package.json`) |
| **sanitize-html** | **Does not exist** | Not installed | Verified in code (`package.json`) |
| **dompurify** / **isomorphic-dompurify** | **Does not exist** | Not installed | Verified in code (`package.json`) |
| **sharp** | **Does not exist** | Not installed | Verified in code (`package.json`). `next.config.mjs:7` sets `images: { unoptimized: true }` |
| **Test Runner** (Jest / Vitest / Playwright) | **Does not exist** | Not installed | Verified in code (`package.json`) |

### 1.4 Available `components/ui/*` Primitives (57 Primitives)
*Verified in code: [components/ui/](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/components/ui)*

The repository contains 56 Radix UI / Shadcn UI `.tsx` component primitives and 1 hook file:
`accordion.tsx`, `alert-dialog.tsx`, `alert.tsx`, `aspect-ratio.tsx`, `avatar.tsx`, `badge.tsx`, `breadcrumb.tsx`, `button-group.tsx`, `button.tsx`, `calendar.tsx`, `card.tsx`, `carousel.tsx`, `chart.tsx`, `checkbox.tsx`, `collapsible.tsx`, `command.tsx`, `context-menu.tsx`, `dialog.tsx`, `drawer.tsx`, `dropdown-menu.tsx`, `empty.tsx`, `field.tsx`, `form.tsx`, `hover-card.tsx`, `input-group.tsx`, `input-otp.tsx`, `input.tsx`, `item.tsx`, `kbd.tsx`, `label.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `resizable.tsx`, `scroll-area.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `sidebar.tsx`, `skeleton.tsx`, `slider.tsx`, `sonner.tsx`, `spinner.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `toast.tsx`, `toaster.tsx`, `toggle-group.tsx`, `toggle.tsx`, `tooltip.tsx`, `use-mobile.tsx`, and `use-toast.ts`.

---

## 2. Database Architecture & Schema Discrepancy Analysis

### 2.1 Database Connection Configuration
*Verified in code: [lib/db.ts](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/lib/db.ts#L1-L18)*

- **Host Parameter:** `process.env.DB_HOST || "127.0.0.1"`
- **Database Name Parameter:** `process.env.DB_NAME || "chemistry_db"` (Note: `.env.example` specifies `chemistry_playground`, creating a potential naming drift).
- **Username Parameter:** `process.env.DB_USER || "root"`
- **Password Parameter:** `process.env.DB_PASSWORD || ""`
- **Dialect:** `"mysql"`
- **Logging:** `false`
- **Env Loader:** `dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })` (`lib/db.ts:6`).

### 2.2 Live Local Database State
*Verified in DB via direct read-only MySQL queries on `127.0.0.1:3306`:*
- **Default Database:** `chemistry_db`
- **Character Set:** `utf8mb4`
- **Collation:** `utf8mb4_general_ci`
- **Total Tables:** 6 base tables

| Table Name | Row Count | Primary Key | Indexes in DB |
|---|---|---|---|
| `chapters` | **41** | `id` (INT Auto Increment) | `PRIMARY` (`id`), `unique_class_chapter` (`class`, `chapter_number`) |
| `molecules` | **170** | `id` (INT Auto Increment) | `PRIMARY` (`id`), `molecule` (`molecule` UNIQUE) |
| `questions` | **615** | `id` (INT Auto Increment) | `PRIMARY` (`id`), `idx_chapter` (`chapter_id`) |
| `reactions` | **274** | `id` (INT Auto Increment) | `PRIMARY` (`id`), `name` (`name` UNIQUE) |
| `quiz_attempts` | **1** *(Not empty!)* | `id` (INT Auto Increment) | `PRIMARY` (`id`), `user_id` (`user_id`) |
| `users` | **2** | `id` (INT Auto Increment) | `PRIMARY` (`id`), `email` (`email` UNIQUE) |

### 2.3 Comprehensive Schema Comparison Table

| Table | Sequelize Model Definition (`lib/db.ts`) | SQL Dump (`chemistrypg_updated.sql:4fdf8dc`) | Real Local MySQL Database | Mismatch & Risk Notes |
|---|---|---|---|---|
| **users** | `id` (INT, PK)<br>`email` (STRING 255, UNIQUE)<br>`passwordHash` (STRING 255, field `password_hash`)<br>`name` (STRING 255)<br>`institution` (STRING 255)<br>`resetToken` (STRING 255, field `reset_token`, NULL)<br>`resetTokenExpiry` (DATE, field `reset_token_expiry`, NULL)<br>`created_at`, `updated_at` | Identical column definitions and types. | `id`, `email`, `password_hash`, `name`, `institution`, `reset_token`, `reset_token_expiry`, `created_at`, `updated_at`. | **Matched.**<br>**Critical:** `role` and `status` **do not exist** anywhere. |
| **molecules** | `id` (INT, PK)<br>`molecule` (STRING 255, UNIQUE)<br>`formula` (STRING 100)<br>`category` (STRING 100, default `basic`)<br>`description` (TEXT, NULL)<br>`cid` (INT, NULL)<br>`iupacName` (TEXT, field `iupac_name`, NULL)<br>`molecularWeight` (STRING 100, field `molecular_weight`, NULL)<br>`sdf` (LONGTEXT, NULL)<br>`recordType` (STRING 20, field `record_type`, NULL)<br>`atoms` (JSON)<br>`bonds` (JSON)<br>`createdAt`, `updatedAt` (camelCase) | Missing `cid`, `iupac_name`, `molecular_weight`, `sdf`, `record_type`.<br>`formula` was `VARCHAR(50)`. | Matches Sequelize model schema exactly because `sync({ alter: true })` mutated the table. | **SQL Dump is Stale.** Real DB contains PubChem caching fields. `createdAt`/`updatedAt` are camelCase, while PubChem fields are snake_case. |
| **reactions** | `id` (INT, PK)<br>`name` (STRING 255, UNIQUE)<br>`description` (TEXT, NULL)<br>`category` (STRING 100, NULL)<br>`reactants` (JSON)<br>`products` (JSON)<br>`createdAt`, `updatedAt` (camelCase) | Missing `category` column.<br>`createdAt`/`updatedAt` default `CURRENT_TIMESTAMP`. | Matches Sequelize model (has `category VARCHAR(100)`). | **SQL Dump Missing `category`**. Real DB matches Sequelize model. |
| **chapters** | `id` (INT, PK)<br>`class` (INT, isIn `[9,10,11,12]`)<br>`chapterNumber` (INT, field `chapter_number`)<br>`chapterTitle` (STRING 255, field `chapter_title`)<br>`created_at` (`updatedAt: false`) | Has explicit constraint `CONSTRAINT unique_class_chapter UNIQUE (class, chapter_number)`. | Has `unique_class_chapter` index on `(class, chapter_number)`. | **Matched in DB.** Sequelize model did not declare index in `init()`, but index exists in DB. |
| **questions** | `id` (INT, PK)<br>`chapterId` (INT, field `chapter_id`)<br>`questionText` (TEXT, field `question_text`)<br>`optionA` .. `optionD` (STRING 255, field `option_a` .. `option_d`)<br>`correctOption` (ENUM 'A','B','C','D', field `correct_option`)<br>`explanation` (TEXT, NULL)<br>`difficulty` (ENUM 'easy','medium','hard', default `medium`)<br>`topic` (STRING 100, NULL)<br>`created_at` (`updatedAt: false`) | Identical except foreign key declaration `fk_questions_chapter`. | Columns match. Has index `idx_chapter` on `chapter_id`. | **Vulnerability:** `option_a` through `option_d` are `VARCHAR(255)`. Rich text/HTML from Question Builder will overflow this column unless altered to `TEXT`. |
| **quiz_attempts** | `id` (INT, PK)<br>`userId` (INT, field `user_id`)<br>`quizId` (INT, field `quiz_id`)<br>`chapterName` (STRING 255, field `chapter_name`)<br>`score` (INT)<br>`totalQuestions` (INT, field `total_questions`)<br>`percentage` (DECIMAL 5,2)<br>`created_at`, `updated_at` | `quiz_id` is `VARCHAR(100)`.<br>`completed_at TIMESTAMP`.<br>Missing `created_at`/`updated_at`. | `quiz_id` is `INT(11)`.<br>Has `created_at` and `updated_at`. Contains **1 active row**. | **Type Divergence:** SQL dump used `VARCHAR(100)` for `quiz_id`, but Sequelize and Real DB use `INT(11)`. |

### 2.4 Automatic Schema Mutation Analysis
*Verified in code: [lib/db.ts](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/lib/db.ts#L483-L500)*

```typescript
// lib/db.ts:483-500
export async function ensureDbSynced(): Promise<void> {
  if (!syncPromise) {
    syncPromise = sequelize
      .sync({ alter: true }) // CRITICAL RISK: Mutates live DB schema on startup
      ...
  }
  return syncPromise;
}

void ensureDbSynced(); // Executes immediately on import!
```
- **Hazard:** Every API route that imports `lib/db.ts` triggers `ensureDbSynced()`. With `{ alter: true }`, Sequelize inspects every table on every boot/worker start and runs `ALTER TABLE` statements.
- **Consequence:** In MySQL, `ALTER TABLE` takes an exclusive metadata lock, causing request timeouts, connection pool exhaustion, or index truncation in multi-worker production environments.

### 2.5 Portal-Specific Columns & Tables Verification
*Verified in code, DB, and SQL dump:*
- `role` column on `users`: **Does not exist.**
- `status` column on `users`: **Does not exist.**
- `status` / `published` column on `chapters`, `questions`, `reactions`, `molecules`: **Does not exist.**
- `audit_logs` table: **Does not exist.**
- `quiz_attempt_answers` table: **Does not exist.**
- Migrations folder (`migrations/`): **Does not exist.**

---

## 3. Authentication & Authorization Deep Dive

### 3.1 Authentication Flows
*Verified in code: [app/api/auth/](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/app/api/auth)*

```
[Student / User] 
       │
       ├── POST /api/auth/login ──────────► Verifies PBKDF2 hash ──► Signs JWT ──► Sets 'chemistry-session' Cookie
       ├── POST /api/auth/signup ─────────► Hashes with PBKDF2 ──► Creates User ──► Returns 201 (No cookie set)
       ├── GET  /api/auth/me ─────────────► Reads Cookie ──► Verifies JWT ──► User.findByPk(id) ──► Returns User JSON
       ├── POST /api/auth/logout ─────────► Sets 'chemistry-session' cookie with Max-Age 0
       ├── POST /api/auth/forgot-password ► Generates 32-byte hex token ──► Saves to DB ──► console.log (NO email sent!)
       └── POST /api/auth/reset-password ─► Validates reset_token & expiry ──► Updates password_hash ──► Clears token
```

### 3.2 Password Hashing & Security Parameters
*Verified in code: [lib/auth.ts](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/lib/auth.ts#L8-L27)*
- **Algorithm:** Node.js native `crypto.pbkdf2Sync`.
- **Iterations:** `10,000` (Lower than OWASP recommended 600,000 iterations for PBKDF2-HMAC-SHA512).
- **Key Length:** `64` bytes.
- **Digest:** `"sha512"`.
- **Salt:** 16 random bytes (`crypto.randomBytes(16).toString("hex")`).
- **Storage Format:** `${salt}:${hash}` in `users.password_hash`.

### 3.3 Token Format, Claims & Secrets
*Verified in code: [lib/auth.ts](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/lib/auth.ts#L3-L74)*
- **Implementation:** Custom HMAC-SHA256 signature formatting conforming to standard JWT structure (`base64url(header).base64url(payload).signature`).
- **Claims Stored in Token (`app/api/auth/login/route.ts:31-35`):**
  - `id`: integer (User ID).
  - `email`: string.
  - `name`: string.
  - `exp`: unix epoch timestamp (default 24 hours).
  - **Missing Claims:** `role`, `status`, `institution` are **not included** in token claims.
- **Hardcoded Secret Fallback ([lib/auth.ts:3](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/lib/auth.ts#L3)):**
  `const JWT_SECRET = process.env.JWT_SECRET || "chemistry-playground-fallback-secret-2026-very-secure-key";`
  **High Security Risk:** If `JWT_SECRET` is omitted from deployment environment variables, tokens signed with this fallback are universally valid.

### 3.4 Session Cookie Attributes
*Verified in code: [app/api/auth/login/route.ts:39-45](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/app/api/auth/login/route.ts#L39-L45)*
- **Name:** `"chemistry-session"`
- **HttpOnly:** `true`
- **Secure:** `process.env.NODE_ENV === "production"`
- **SameSite:** `"strict"`
- **MaxAge:** `86400` seconds (24 hours)
- **Path:** `"/"`

### 3.5 Middleware & Route Guard Behavior
*Verified in code: [middleware.ts](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/middleware.ts#L1-L49)*
- **Deprecated Convention:** Next.js 16 issues warning `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead`.
- **Protected Matcher:** Covers `/periodic-table`, `/periodic`, `/quizzes`, `/reactions`, `/molecules` and subpaths.
- **Critical Flaw 1:** `/dashboard` is **not in the matcher**! (Protected only by client-side redirect in `app/dashboard/page.tsx:47`).
- **Critical Flaw 2:** `/admin` and `/api/admin` are **not in the matcher**!
- **Critical Flaw 3 (`hasValidSession`):**
  ```typescript
  function hasValidSession(request: NextRequest): boolean {
    const sessionCookie = request.cookies.get("chemistry-session");
    const value = sessionCookie?.value?.trim();
    return Boolean(value); // ONLY CHECKS STRING EXISTENCE!
  }
  ```
  Middleware **does not verify token cryptographic signature or expiration**. Any arbitrary non-empty cookie string passes through middleware!

### 3.6 Auth Context Shape & Client Redirection Defect
*Verified in code: [contexts/auth-context.tsx](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/contexts/auth-context.tsx#L6-L20) and [components/auth-forms.tsx](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/components/auth-forms.tsx#L34-L45)*
- **Context Shape:** `{ user: User | null, login: (...), signup: (...), logout: (), isLoading: boolean }`
- **Type Shape:** `User` has `{ id: string, email: string, name: string, institution: string, createdAt?: string }`. (No `role`).
- **Entry Points:** `app/auth/page.tsx`, `app/sign-in/page.tsx`, `app/sign-up/page.tsx`.
- **Broken Return-URL / Redirect Parameter:**
  `middleware.ts:29` appends `?redirect=${pathname}` when bouncing unauthenticated users to `/auth`. However, `components/auth-forms.tsx:43` executes:
  `router.push("/")`
  The login form **hardcodes redirection to root `/`** and completely ignores `searchParams.get("redirect")`.

---

## 4. Complete API Routes Inventory (`app/api/**`)

*Verified in code across all 12 route handlers:*

| Method | Endpoint Path | Auth Required? | Tables Touched | Response Shape | Known Defects & Security Vulnerabilities |
|---|---|---|---|---|---|
| `POST` | `/api/auth/login` | None (Public) | `users` (SELECT) | `{ id: number, email, name }` | Sets cookie. Returns `id` as integer, but frontend type expects string. |
| `POST` | `/api/auth/signup` | None (Public) | `users` (INSERT) | `{ id, email, name, institution }` (201) | Does not set session cookie; frontend must redirect to login tab. |
| `POST` | `/api/auth/logout` | None (Public) | None | `{ success: true }` | Clears cookie with `expires: new Date(0)`. |
| `GET` | `/api/auth/me` | Cookie Token | `users` (SELECT) | `{ user: { id, email, name, createdAt } }` | Does not return `institution` or `role`. |
| `POST` | `/api/auth/forgot-password` | None (Public) | `users` (UPDATE) | `{ message: string }` | **No email sent.** Logs reset token to server stdout. |
| `POST` | `/api/auth/reset-password` | None (Token body) | `users` (UPDATE) | `{ message: string }` | Validates token expiration (1 hour) and updates hash. |
| `GET` | `/api/quizzes` | None (Public) | `chapters` (SELECT), `questions` (SELECT) | `{ chapters: [...] }` OR `{ questions: [...] }` | **CRITICAL DEFECT:** When queried with `?chapter_id=X`, response includes `correctAnswer` (0-3 index) and `explanation`. Students can inspect network responses to view all answers prior to taking quiz. |
| `GET` | `/api/quizzes/attempts` | Cookie Token | `users` (SELECT), `quiz_attempts` (SELECT) | `{ user: {...}, attempts: [...] }` | Ordered by `createdAt DESC`. |
| `POST` | `/api/quizzes/submit` | Cookie Token | `quiz_attempts` (INSERT) | `{ success: true, attemptId: number }` | **CRITICAL DEFECT:** Server accepts raw `score` and `totalQuestions` from client request body. Does not grade questions on server. No individual answers saved. |
| `GET` | `/api/molecules` | None (Public) | `molecules` (SELECT, UPSERT) | `{ molecule: {...} }` | Query via `?name=` or `?query=`. Duplicates logic of `/api/molecules/[name]`. If not cached, performs live PubChem HTTP calls and writes to MySQL on GET request. |
| `GET` | `/api/molecules/[name]` | None (Public) | `molecules` (SELECT, UPSERT) | `{ cid, name, formula, iupacName, atoms, bonds, geometry, ... }` | Unprotected. If missing in DB, queries PubChem API and auto-persists to MySQL (`Molecule.upsert`). |
| `GET` | `/api/reactions` | None (Public) | `reactions` (SELECT), `molecules` (SELECT, UPSERT) | `{ reactions: [...] }` | Unprotected. If molecules in reactants/products are not cached, executes concurrent PubChem fetches and writes them to DB on a GET request. |

---

## 5. Student Learning Flows & UI Architecture

### 5.1 Quiz System Flow
*Verified in code: [components/quiz-system.tsx](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/components/quiz-system.tsx)*
- **Data Fetching:** Component loads questions from `/api/quizzes?chapter_id=${chapter.id}` (`components/quiz-system.tsx:123`).
- **Rendering Mechanism:**
  - Questions are rendered with `dangerouslySetInnerHTML={{ __html: question.question }}` (`line 61`).
  - Options are rendered with `dangerouslySetInnerHTML={{ __html: option }}` (`line 83`).
  - Explanations are rendered with `dangerouslySetInnerHTML={{ __html: question.explanation }}` (`line 99`).
  - **Security Hazard:** Allows arbitrary HTML and script execution. No sanitization library exists.
- **Feedback Timing:** **Immediate per-question feedback**. Clicking "Check Answer" activates `handleCheckAnswer()`, compares `answers[currentQuestion.id] === currentQuestion.correctAnswer`, increments score, and shows explanation immediately.
- **Scoring & Storage:** Score is tracked purely in React component state `score`. When the final question is answered, `handleNext()` sends `{ userId, quizId, chapterName, score, totalQuestions }` to `/api/quizzes/submit`. Attempt is stored in `quiz_attempts`. Individual question answers are discarded.

### 5.2 Reaction Simulator Data Flow
*Verified in code: [app/reactions/page.tsx](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/app/reactions/page.tsx)*
- Client fetches `GET /api/reactions`.
- Reactants and products contain embedded 3D atomic coordinates (`atoms: [{ element, x, y, z }]`, `bonds: [{ source, target, order }]`).
- In the browser, 3D conformers are rendered dynamically using external library `3Dmol.js` loaded via CDN script tag (`https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.5.3/3Dmol-min.js`).

### 5.3 3D Molecule Viewer Data Flow
*Verified in code: [components/molecular-viewer.tsx](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/components/molecular-viewer.tsx) and [lib/pubchem.ts](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/lib/pubchem.ts)*
- Client calls `fetchMoleculeData(query)` from `lib/pubchem.ts:251`.
- Calls internal API `/api/molecules/${encodeURIComponent(query)}`.
- If server returns 404 or fails, browser falls back to calling PubChem PUG REST API directly from client side (`lib/pubchem.ts:287`).
- Renders with `3Dmol.js` with support for styles: `ball_and_stick`, `spacefill`, `stick`, `wireframe`.

### 5.4 Progress Dashboard Sources
*Verified in code: [app/dashboard/page.tsx](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/app/dashboard/page.tsx) and [components/progress-dashboard.tsx](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/components/progress-dashboard.tsx)*
- **Live Active Route:** `app/dashboard/page.tsx` is the real student dashboard. Fetches `GET /api/quizzes/attempts` on mount, displaying total attempts, average percentage, highest chapter score, and historical attempts table.
- **Orphaned Dead Component:** `components/progress-dashboard.tsx` loads demo data and saves to `localStorage.getItem("progress-${user.id}")`. It is **not imported anywhere** in `app/`.

---

## 6. Layout, Theme Mechanism & Design Tokens

### 6.1 Student Header & Navigation Application
*Verified in code: [app/layout.tsx](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/app/layout.tsx) and page files*
- **Root Layout (`app/layout.tsx`):** Only provides `<html>`, `<body>`, font CSS variables, and `<AuthProvider>`. **It does not render `<Navigation />` or `<Footer />`.**
- **Page-Level Application:** Every student page individually imports and places `<Navigation />`:
  - `app/page.tsx:8`
  - `app/molecules/page.tsx:9`
  - `app/reactions/page.tsx:7`
  - `app/periodic-table/page.tsx:7`
  - `app/quizzes/page.tsx:6`
  - `app/dashboard/page.tsx:6`
- **Least Invasive Way to Hide Student Nav on `/admin/*`:**
  Because the student navigation is **not** in `app/layout.tsx`, creating an Admin Layout at `app/admin/layout.tsx` will have **zero student navigation headers or footers by default**. No complex route path checks or URL conditionals are required.

### 6.2 Theme Mechanism & Color Tokens
*Verified in code: [app/globals.css](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/app/globals.css) and [components/theme-provider.tsx](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/components/theme-provider.tsx)*
- **Tailwind Version:** Tailwind CSS v4 using `@import "tailwindcss";` and `@import "tw-animate-css";`.
- **Dark Mode Variant:** Defined via `@custom-variant dark (&:is(.dark *));`.
- **Theme Provider:** `components/theme-provider.tsx` exists (using `next-themes`), but is **not mounted in `app/layout.tsx`**. The student app runs in default light theme unless `.dark` class is set manually.
- **Color Format:** Modern OKLCH color space (`--background: oklch(1 0 0);`, `--primary: oklch(0.55 0.15 200);` [Cyan/Teal], `--secondary: oklch(0.75 0.15 85);` [Amber]).
- **Typography Tokens:**
  - `--font-open-sans`: Body font ("Open Sans", sans-serif).
  - `--font-montserrat`: Headings and brand font ("Montserrat", serif).

---

## 7. Hosting, Deployment & Environment Variables

### 7.1 Server Architecture & Deployment Profile
*Verified in code: [next.config.mjs](file:///c:/Users/Mesam/Desktop/learning/Chemistry-Playground/next.config.mjs)*
- **Server Runtime:** Node.js server runtime (`serverExternalPackages: ["sequelize"]`).
- **Connection Model:** Persistent TCP connection pool to MySQL via `mysql2` and `sequelize`.
- **Serverless Compatibility Warning:** The codebase is designed for a persistent Node.js server container (Docker, VPS, AWS EC2, Railway) rather than pure ephemeral serverless functions (like Vercel Lambdas) because of:
  1. Module-level execution of `void ensureDbSynced()` on import (`lib/db.ts:500`).
  2. Persistent Sequelize connection pools.
  3. Direct filesystem reads in `src/data/` if seed utilities run.

### 7.2 Environment Variables Audit
*Verified in code across all files:*

| Variable Name | Used In Files | Purpose | Required / Fallback |
|---|---|---|---|
| `DB_HOST` | `lib/db.ts:14` | MySQL host address | Optional (defaults to `"127.0.0.1"`) |
| `DB_NAME` | `lib/db.ts:10` | MySQL database name | Optional (defaults to `"chemistry_db"`) |
| `DB_USER` | `lib/db.ts:11` | MySQL username | Optional (defaults to `"root"`) |
| `DB_PASSWORD` | `lib/db.ts:12` | MySQL password | Optional (defaults to `""`) |
| `JWT_SECRET` | `lib/auth.ts:3` | Secret for HMAC-SHA256 signing | **Critical:** Has hardcoded fallback string |
| `NEXT_PUBLIC_APP_URL` | `app/api/auth/forgot-password/route.ts:28` | Origin URL for reset password links | Optional (defaults to `"http://localhost:3000"`) |
| `NODE_ENV` | `app/api/auth/login/route.ts:41` | Cookie secure flag | System variable |

### 7.3 Git Repository Status
*Verified via git CLI:*
- **Active Branch:** `mesum/my-changes`
- **Remote Tracking:** `origin/mesum/my-changes` (up to date).
- **Working Tree:** Clean (0 uncommitted changes).
- **Recent Relevant Commits:**
  - `4baddbf` Apply my Chemistry Playground changes
  - `7c8c29f` feat(pwa): configure progressive web app manifest and service worker integration
  - `d50f5ce` feat(periodic-table): add interactive atomic structure modal with animated electron orbits
  - `f786d04` feat(brand): rebrand application to ChemCurious and integrate official SVG logo
  - `5748440` refactor(molecules): clean up UI layout and optimize 3D WebGL viewer performance
  - `a391948` feat(api): implement robust PubChem 3D/2D fallback resolver service

---

## 8. Checklist Audit: `PORTAL_BACKEND_TODO.md` Verification

*Verified against git commit `4fdf8dc:docs/PORTAL_BACKEND_TODO.md` and actual repository code:*

| Checklist Item | Task Description | Status | Evidence & Code Location |
|---|---|---|---|
| **1.1** | Database Backup (`backup_pre_portal.sql`) | **Not Done** | No backup SQL file exists in repository. |
| **1.2** | Add `role` and `status` to `users` | **Not Done** | Verified in DB and code: `User` model (`lib/db.ts:133`) has no `role` or `status`. |
| **1.3** | Add `status` to chapters, questions, reactions, molecules | **Not Done** | Verified in DB and code: No `status` or `published` column on any table. |
| **1.4** | Add `category` to reactions & change options to `TEXT` | **Partly Done** | `Reaction.category` exists in `lib/db.ts:218` and DB; but `questions.option_*` are still `VARCHAR(255)`. |
| **1.5** | Create `quiz_attempts` & `quiz_attempt_answers` | **Partly Done** | `quiz_attempts` exists in DB (`lib/db.ts:260`); `quiz_attempt_answers` **does not exist**. |
| **1.6** | Create `audit_logs` table | **Not Done** | Verified in DB and code: Table does not exist. |
| **1.7** | Update Sequelize models & disable `sync()` | **Partly Done** | Models for `Reaction` and `QuizAttempt` exist, but `sync({ alter: true })` still runs automatically (`lib/db.ts:500`). |
| **2.1** | Implement `lib/admin-auth.ts` RBAC utility | **Not Done** | File does not exist. |
| **2.2** | Create `scripts/seed-admin.ts` | **Not Done** | File does not exist. |
| **2.3** | Create `lib/audit.ts` audit logger | **Not Done** | File does not exist. |
| **3.1** | Fix molecule lookup (`app/api/molecules/[name]/route.ts`) | **Done** | Implemented in commit `a391948` using PubChem SDF resolver and local caching. |
| **3.2** | Secure `GET /api/quizzes` (hide answers) | **Not Done** | `app/api/quizzes/route.ts:33-34` still exposes `correctAnswer` and `explanation`. |
| **3.3** | Server-side quiz grading (`/api/quizzes/submit`) | **Partly Done** | Route exists (`app/api/quizzes/submit/route.ts`), but accepts client score without grading. |
| **3.4** | Wire student frontend to submit endpoint | **Partly Done** | `components/quiz-system.tsx:173` calls submit endpoint, but `progress-dashboard.tsx` is dead code. |
| **4.1 - 4.7** | Core Admin Endpoints (`/api/admin/*`) | **Not Done** | No `/api/admin/*` routes exist. |
| **5.1 - 5.2** | Image uploads & rich content (`/api/admin/uploads`) | **Not Done** | Neither `sanitize-html`/`sharp` installed, nor upload endpoint created. |
| **6.1 - 6.3** | Analytics & Audit Trail APIs | **Not Done** | No `/api/admin/analytics/*` or `/api/admin/audit-logs` routes exist. |
| **7.1 - 7.3** | Regressions, API contract & security verification | **Not Done** | Pending implementation. |

---

## 9. External Sibling Project: Lovable Admin Portal Inventory

*(Note: Folder `_import/lovable-admin` **does not exist** inside `Chemistry-Playground`. However, the exact Lovable Admin portal was verified in sibling directory `../Chemistry-playground-portal/chemistry-playground-portal`)*.

### 9.1 Framework, Routing & Dependencies
- **Build System:** Vite 8.1.5 + TanStack Start (`@tanstack/react-start: 1.168.60`, Nitro).
- **Client Routing:** File-based `@tanstack/react-router: 1.170.41`.
- **Data Fetching:** `@tanstack/react-query: ^5.101.1`.
- **Rich Text Editor:** TipTap suite (`@tiptap/react: ^2`, `@tiptap/starter-kit`, `@tiptap/extension-subscript`, `@tiptap/extension-superscript`, `@tiptap/extension-image`).
- **Sanitization:** `dompurify: ^3.4.17` with custom `<SafeHtml />` component.
- **CSV Parser:** `papaparse: ^5.7.0` for question bulk import.

### 9.2 Route & Page Inventory
1. `src/routes/__root.tsx` — Root application wrapper with TanStack Query provider.
2. `src/routes/admin.tsx` — Admin Layout with responsive sidebar, navigation links, and theme toggle.
3. `src/routes/admin.index.tsx` — Admin Dashboard Overview with stat cards (`DashboardStats`) and recent activity.
4. `src/routes/admin.quizzes.index.tsx` — Chapters listing with question counts, class filters, and order management.
5. `src/routes/admin.quizzes.chapters.$id.tsx` — Questions table for a specific chapter with difficulty, topic, and status filters.
6. `src/routes/admin.quizzes.questions.new.tsx` & `...questions.$id.tsx` — Tiptap-powered Question Builder form.
7. `src/routes/admin.reactions.index.tsx`, `...new.tsx`, `...$id.tsx` — Reactions management and stoichiometry builder.
8. `src/routes/admin.molecules.index.tsx`, `...new.tsx`, `...$id.tsx` — 3D Molecule catalog with live PubChem preview card.
9. `src/routes/admin.users.tsx` — User management table with Role change and Status (active/suspended) actions.
10. `src/routes/admin.audit-logs.tsx` — System audit log table with JSON diff viewer for before/after states.

### 9.3 Expected Backend API Contract & Field Schema
*Verified in portal code: `src/lib/api/services.ts` and `src/lib/api/types.ts`:*

| Feature Area | Endpoint Expected | HTTP Method | Expected Request / Response Fields |
|---|---|---|---|
| **Admin Auth** | `/api/admin/me` | `GET` | Returns `CurrentUser: { id: number, name, email, role: 'staff'\|'admin' }`. |
| **Dashboard** | `/api/admin/dashboard` | `GET` | Returns `{ molecules, reactions, questions, quizAttempts, published, drafts, recentActivity: AuditLogEntry[] }`. |
| **Chapters** | `/api/admin/quizzes/chapters` | `GET`, `POST` | Input: `{ classLevel: 9-12, title: string, order: number, status: 'draft'\|'published' }`. |
| **Chapter Detail**| `/api/admin/quizzes/chapters/:id` | `GET`, `PUT`, `DELETE` | Returns Chapter with `questionCount`. |
| **Questions** | `/api/admin/quizzes/questions` | `GET`, `POST` | Input: `{ classLevel, chapterId, text, textHtml, options: {A,B,C,D}, optionHtml, correct, explanation, explanationHtml, questionImageUrl, difficulty, topic, marks, status }`. |
| **Question Detail**| `/api/admin/quizzes/questions/:id`| `GET`, `PUT`, `DELETE` | Single Question CRUD. |
| **Reactions** | `/api/admin/reactions` | `GET`, `POST` | Input: `{ name, category, description, conditions, reactants: [{moleculeId, coefficient}], products: [{moleculeId, coefficient}], status }`. |
| **Reaction Detail**| `/api/admin/reactions/:id` | `GET`, `PUT`, `DELETE` | Single Reaction CRUD. |
| **Molecules** | `/api/admin/molecules` | `GET`, `POST` | Input: `{ name, formula, category, description, atoms: Atom[], bonds: Bond[] }`. |
| **PubChem Search**| `/api/admin/molecules/fetch-pubchem` | `POST` | Body `{ query: string }`. Returns `{ name, formula, atoms, bonds }`. |
| **Users** | `/api/admin/users` | `GET` | Returns `AdminUser[]: [{ id, name, email, institution, role, status }]`. |
| **User Role** | `/api/admin/users/:id/role` | `PATCH` | Body `{ role: 'student'\|'staff'\|'admin' }`. |
| **User Status** | `/api/admin/users/:id/status` | `PATCH` | Body `{ status: 'active'\|'suspended' }`. |
| **Audit Logs** | `/api/admin/audit-logs` | `GET` | Returns `AuditLogEntry[]: [{ id, action, actor, entityType, entityId, timestamp, oldValue, newValue }]`. |
| **Uploads** | `/api/admin/uploads` | `POST` | `multipart/form-data` with `file`. Returns `{ url: string }`. |

### 9.4 Architectural Conflicts & Conversion Requirements for Next.js

1. **Routing Incompatibility:**
   - Portal uses `@tanstack/react-router` (`createRoute`, `<Outlet />`, `useParams`).
   - Must be rewritten into Next.js App Router conventions (`app/admin/quizzes/page.tsx`, `app/admin/quizzes/[id]/page.tsx`, `app/admin/layout.tsx`).
2. **Missing Frontend Dependencies:**
   - To render the portal's Question Builder and Data Tables, the Next.js project must install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*`, `dompurify`, `papaparse`, and `@tanstack/react-query` (or adapt data fetching to Next.js server/client hooks).
3. **Question Schema & Data Types Conflict:**
   - Portal requires structured HTML and plain-text mirrors (`textHtml`, `optionHtml`). Real DB only has single `question_text`, `option_a` through `option_d`, and `explanation`.
   - Real DB options are `VARCHAR(255)`. Inserting rich text or images will fail without altering to `TEXT`.
4. **Stoichiometry Model Conflict:**
   - Portal expects `reactants: [{ moleculeId: number, coefficient: number }]`. Real DB and student app store `reactants: [{ molecule: "methane", coefficient: 1 }]` (string names, not numeric foreign keys).
5. **Endpoint Naming Discrepancies:**
   - Portal calls `/api/admin/dashboard`, while TODO document specified `/api/admin/analytics/overview`.
   - Portal calls `POST /api/admin/molecules/fetch-pubchem`, while TODO specified `GET /api/admin/molecules/pubchem?name=...`.
   - Portal calls `/api/admin/quizzes/chapters`, while TODO specified `/api/admin/chapters`.

---

## 10. Risk Assessment, Blockers & Pre-Implementation Decisions

### 10.1 Ranked Risk Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│ CRITICAL RISKS (Must resolve before or during Phase 1)                  │
├────────────────────────────────────────────────────────────────────────┤
│ 1. lib/db.ts:500 auto-runs sequelize.sync({ alter: true }) on boot     │
│ 2. GET /api/quizzes:33 leaks correctAnswer and explanation to students │
│ 3. components/quiz-system.tsx renders unsanitized HTML (Stored XSS)    │
│ 4. No role/status exists in DB; any logged-in student has full access │
│ 5. lib/auth.ts:3 has hardcoded JWT secret fallback in source code      │
├────────────────────────────────────────────────────────────────────────┤
│ HIGH RISKS (Architectural & Functional Mismatches)                     │
├────────────────────────────────────────────────────────────────────────┤
│ 6. questions.option_* are VARCHAR(255) (will overflow on HTML/images)  │
│ 7. Reaction model stores molecule strings; Portal expects molecule IDs │
│ 8. Missing dependencies in package.json (Tiptap, DOMPurify, TanStack) │
│ 9. GET endpoints execute side-effect DB writes and PubChem API calls   │
├────────────────────────────────────────────────────────────────────────┤
│ MEDIUM RISKS (Workflow & Quality of Life)                              │
├────────────────────────────────────────────────────────────────────────┤
│ 10. Login form ignores ?redirect= query param and hardcodes router("/") │
│ 11. Password reset flow does not send emails (only console.log)        │
│ 12. Middleware convention deprecated in Next.js 16 (middleware vs proxy)│
│ 13. package.json script "seed" references uninstalled package 'tsx'    │
├────────────────────────────────────────────────────────────────────────┤
│ LOW RISKS                                                              │
├────────────────────────────────────────────────────────────────────────┤
│ 14. Orphaned components (progress-dashboard.tsx, footer.tsx)           │
│ 15. Zero automated test suites in Next.js codebase                     │
└────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Blockers
1. **Database Schema Mutator:** `ensureDbSynced()` in `lib/db.ts` must be converted from `{ alter: true }` to `{ alter: false }` or pure connection validation (`sequelize.authenticate()`). If left as `{ alter: true }`, any new model definitions will uncontrollably mutate the production MySQL database.
2. **Missing Role Support in Auth:** Admin pages cannot be secured until `role` is added to the `users` table, included in the JWT payload, and validated by server route guards.

### 10.3 Required Architectural Decisions
1. **Admin UI Integration Pattern:**
   - *Option A (Recommended):* Recreate pages natively in Next.js App Router under `app/admin/...` using existing Shadcn primitives and installing only necessary form dependencies (`@tiptap/*`, `dompurify`, `papaparse`).
   - *Option B:* Host the Lovable portal as a separate Vite SPA or iframe (creates multi-domain CORS and cookie sharing complexities).
2. **Question Rich-Text Schema:**
   - *Option A (Additive Mirror Columns):* Add `question_html`, `option_a_html` .. `option_d_html`, `explanation_html` as `TEXT NULL` to the `questions` table, leaving `question_text` and `option_a` as plain-text fallbacks.
   - *Option B (In-Place Alteration):* Alter existing `option_a` .. `option_d` from `VARCHAR(255)` to `TEXT` and store sanitized HTML directly in existing columns.
3. **Reaction Stoichiometry Storage:**
   - Retain string molecule names `{ molecule: "water", coefficient: 2 }` in `reactions.reactants` to maintain 100% backward compatibility with student 3D simulator, and adapt the Admin Portal service adapter to map between molecule objects and names.
4. **Admin Endpoint Naming Standard:**
   - Standardize whether to match the Lovable Portal (`/api/admin/quizzes/chapters`, `/api/admin/dashboard`) or the TODO spec (`/api/admin/chapters`, `/api/admin/analytics/overview`). Matching the Lovable Portal paths minimizes frontend refactoring.
