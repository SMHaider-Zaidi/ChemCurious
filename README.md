<div align="center">

# 🧪 ChemCurious

**A High-Performance Interactive 3D Molecular Renderer, Chemical Reaction Engine & Comprehensive Educational Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-Sequelize_6-4479A1?logo=mysql)](https://sequelize.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black?logo=threedotjs)](https://threejs.org/)

</div>

---

## 📖 Overview

**ChemCurious** is an enterprise-grade interactive platform engineered for real-time spatial chemistry visualization, chemical reaction modeling, automated curricular evaluation, and comprehensive administrative oversight. Designed to bridge the gap between static chemical formulas and dynamic physical structures, the system translates spatial atomic coordinates, bond geometries, and reaction pathways into high-fidelity, interactive 3D WebGL models alongside a full-featured Learning Management System (LMS) and Admin Control Center.

---

## ✨ Core Modules & Feature Highlights

### 🧊 1. 3D Molecular Spatial Renderer
* **Precision Ball-and-Stick Modeling:** Renders dynamic 3D molecular structures using exact Ångström Cartesian spatial coordinates ($x, y, z$).
* **Structural & Bond Multiplicity:** Accurately visualizes single, double, and triple bonds, along with authentic VSEPR spatial geometries (tetrahedral, trigonal planar, bent, linear).
* **Interactive WebGL Viewport:** High-fps orbit, pan, zoom, and rotate controls with atom hover inspection, elemental color coding (CPK conventions), and automated camera framing.

### ⚛️ 2. Interactive Periodic Table Engine
* **Complete IUPAC Element Catalog:** Interactive access to all 118 elements with instant fuzzy search and category filtration (alkali metals, halogens, noble gases, lanthanides, actinides).
* **Deep Property Inspection:** Detailed physical, atomic, and thermodynamic properties per element (atomic mass, electron configuration, electronegativity, ionization energies, oxidation states).

### ⚗️ 3. Chemical Reaction Engine
* **Stoichiometric Transformation Pathways:** Comprehensive database of chemical reactions spanning inorganic, organic, synthesis, decomposition, redox, and substitution mechanisms.
* **Dynamic Reactant-to-Product Mapping:** Interactive inspection of reaction conditions (catalysts, temperature, pressure), balancing coefficients, and underlying molecular structures.

### 📝 4. Curated Quiz & Assessment Engine
* **Chapter-Wise Curriculum:** 41 structured chapters across secondary and higher-secondary chemistry with 15 verified, non-duplicate questions per chapter (615 total questions).
* **Chemical Formula & Math Formatting:** Seamless inline subscript/superscript support for complex chemical species (e.g., $\text{H}_2\text{SO}_4$, $\text{MnO}_4^-$, $\text{Fe}^{3+}$).
* **Instant Feedback & Scoring:** Real-time validation, per-question explanations, and time-tracking metrics.

### 📈 5. Student Performance Dashboard
* **Targeted Analytics:** Tracks quiz completion history, subject-level mastery points, average accuracy, and cohort standing.
* **Configurable Cohort Leaderboard:** Real-time student standings with optional administrative visibility toggles.

---

## 🛡️ Administrative Portal & System Governance

ChemCurious features a secure, role-guarded **Admin Portal (`/admin`)** designed for curriculum coordinators, content authors, and system administrators.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ADMIN CONTROL SUITE                             │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 📚 Curriculum     │ 🧪 Scientific DB  │ 👥 Users & Governance          │
│ • Chapter Order   │ • Molecule Editor │ • Role Assignment (Admin/Staff)│
│ • Question Author │ • Reaction Engine │ • Account Status (Active/Susp) │
│ • Bulk CSV Import │ • PubChem Sync    │ • Audit Logs & System Settings │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

* **Curriculum Management:** Author, edit, reorder, and publish/archive chapters and questions. Features a specialized chemical rich-text editor supporting subscripts, superscripts, formulas, and explanations.
* **Bulk Question Import:** Fast CSV/JSON import pipeline with schema validation and automated deduplication safeguards.
* **3D Molecule & Reaction Curation:** Add or edit 3D atomic coordinates, bond definitions, and PubChem REST integrations directly from the UI.
* **Users & Access Control:** Manage portal accounts with strict role-based access control (`student`, `staff`, `admin`), active/suspended status toggling, and last-active admin demotion protection.
* **Immutable Audit Trail:** Persistent audit log recording all mutations (timestamp, actor ID, action type, entity ID, before/after states, and IP address) in MySQL.
* **System Settings:** Real-time feature toggles (e.g., cohort leaderboard visibility on student profiles) backed by the `system_settings` database table.

---

## 🏛️ System Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | Server Components, Route Handlers, Turbopack, and Edge Middleware |
| **Frontend** | **React 19 & TypeScript 5** | Strict type safety, React hooks, Radix UI primitives, Lucide icons |
| **Styling** | **Tailwind CSS v4** | Dark/Light theme mode, responsive grid, bespoke scientific palettes |
| **State & Data** | **TanStack Query v5** | Optimistic UI mutations, automatic query cache invalidation |
| **3D Graphics** | **Three.js / React Three Fiber** | Hardware-accelerated WebGL molecular viewports |
| **ORM & DB** | **Sequelize 6 + MySQL (mysql2)** | Transactional ACID updates, connection pooling, automated migrations |
| **Auth & Security** | **Stateless HMAC-SHA256** | Isolated session cookies, PBKDF2 SHA-512 password hashing, CSRF guards |

---

## 🚀 Developer Quick-Start Guide

Follow these steps to set up and run ChemCurious locally on your development machine.

### Prerequisites
* **Node.js**: v18.17+ or v20+ installed
* **MySQL Server**: v8.0+ running locally (or via Docker/XAMPP)

---

### Step 1: Clone the Repository & Install Dependencies
```bash
git clone https://github.com/your-username/Chemistry-Playground.git
cd Chemistry-Playground

# Install project dependencies
npm install
```

---

### Step 2: Configure Environment Variables
Create a `.env.local` file in the root directory by copying the example file:

```bash
# On Windows PowerShell:
Copy-Item .env.example .env.local

# On macOS/Linux:
cp .env.example .env.local
```

Open `.env.local` and ensure your local MySQL credentials match:
```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=chemistry_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# Authentication Security
JWT_SECRET=super-secret-random-32-character-key-here-for-chemcurious-2026
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Modes
NEXT_PUBLIC_ADMIN_MOCK=false
```

---

### Step 3: Initialize MySQL Database & Run Seed
Open your MySQL client (or MySQL Workbench / terminal) and create the database:
```sql
CREATE DATABASE chemistry_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run the automated seed command to synchronize tables and import the 41 curriculum chapters, 615 unique MCQs, molecules, and reactions:
```bash
npm run seed
```
> **Idempotent Seeding:** `npm run seed` uses upsert/findOrCreate validation. Running it multiple times will safely update existing records without creating duplicate questions or chapters.

---

### Step 4: Default Administrator Accounts
The database includes auto-seeded administrator accounts configured during startup:

| Account | Email | Password | Role | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Collaborator Admin** | `haider321@gmail.com` | `haider123` | `admin` | Full Administrative Privileges |
| **Lead Admin** | `messum321@gmail.com` | *(Account active)* | `admin` | Full Administrative Privileges |

> **Need a new custom Admin?** You can also promote any registered user via CLI:
> ```bash
> npx tsx scripts/seed-admin.ts --email=your_email@example.com --confirm-db=chemistry_db
> ```
> Or elevate any user directly in the Admin Portal via **Users & Access Control** (`/admin/users`).

---

### Step 5: Start the Development Server
```bash
npm run dev
```

Open your browser and navigate to:
* **Student Portal & Home:** [http://localhost:3000](http://localhost:3000)
* **Authentication (Login/Signup):** [http://localhost:3000/auth](http://localhost:3000/auth)
* **Admin Control Center:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🧪 Testing & Code Quality

ChemCurious includes automated route contract checks and Vitest unit testing suites:

```bash
# Verify TypeScript compilation (0 errors)
npx tsc --noEmit

# Verify Admin API route contract integrity against specification
npx tsx scripts/check-routes.ts

# Run unit tests (chemical formatting & HTML sanitization suites)
npx vitest run
```

---

## 📂 Project Directory Structure

```text
Chemistry-Playground/
├── app/
│   ├── (student)/               # Public educational routes
│   │   ├── dashboard/           # Student learning metrics & rank
│   │   ├── quizzes/             # Step-by-step interactive quiz runner
│   │   ├── elements/            # 3D interactive periodic table
│   │   ├── reactions/           # Stoichiometric reaction engine
│   │   └── page.tsx             # Landing hero & 3D showcase
│   ├── admin/                   # Secure Admin Portal (/admin)
│   │   ├── quizzes/             # Curriculum, chapters & questions
│   │   ├── molecules/           # 3D molecular catalog curator
│   │   ├── reactions/           # Reaction mechanisms editor
│   │   ├── students/            # Student cohort progress inspector
│   │   ├── leaderboard/         # Real-time leaderboard control
│   │   ├── audit-logs/          # Immutable system mutation timeline
│   │   └── users/               # Staff & Admin role governance
│   └── api/
│       ├── auth/                # Login, signup, me, password recovery
│       ├── admin/               # Role-guarded admin endpoints
│       └── quizzes/             # Public student quiz evaluation endpoints
├── components/
│   ├── admin/                   # Admin UI: ChemRichEditor, AdminShell, DataTable
│   ├── ui/                      # Accessible Radix UI design primitives
│   └── MoleculeViewer3D.tsx     # Three.js / R3F Canvas renderer
├── lib/
│   ├── db.ts                    # Sequelize models, associations & auto-migrations
│   ├── auth.ts                  # PBKDF2 encryption & JWT session tokens
│   ├── admin-guard.ts           # Role-based middleware & CSRF guards
│   ├── audit.ts                 # Transactional audit logging helper
│   ├── seed.ts                  # Master data seeder (quizzes, molecules, reactions)
│   └── admin/                   # Admin API client, hooks, and types
├── src/data/                    # Standardized curriculum datasets (JSON)
│   ├── Quizzes.json             # 41 chapters, 615 unique questions
│   ├── Reactions.json           # Balanced reactions and conditions
│   └── Reactions3D_Details.json # 3D Cartesian atom coordinates
└── scripts/
    ├── check-routes.ts          # API contract verification script
    └── seed-admin.ts            # CLI administrator elevation tool
```

---

## 🔒 Security Best Practices Implemented

* **Multi-Tenant Session Cookie Isolation:** Distinct cookies for students (`chemistry-student-session`) and administrators (`chemistry-admin-session`) to prevent privilege leakage and session spoofing.
* **Server-Side Transaction Integrity:** Sensitive curriculum and user mutations are wrapped in Sequelize ACID transactions (`withAdminTx`).
* **CSRF & Origin Verification:** State-changing HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) require matched `Origin` and `Host` headers.
* **Sanitized Rich-Text:** Chemical inputs and question descriptions are sanitized via strict tag whitelisting to eliminate Stored Cross-Site Scripting (XSS).
* **Defensive Self-Account Protection:** Built-in safeguards prevent administrators from accidentally suspending their own account or revoking the last remaining active administrator role.

---

## 📄 License & Attribution

Distributed under the MIT License. See `LICENSE` for details. Engineered with precision for educators, students, and chemical researchers worldwide.
