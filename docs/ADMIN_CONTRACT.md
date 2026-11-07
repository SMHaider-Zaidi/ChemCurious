# Admin Portal API Contract (Source of Truth)

Conventions: JSON, camelCase, numeric ids, ISO-8601 date strings.
Errors: `{ "error": string, "details"?: Record<string, string | string[]> }` with 400 validation, 401, 403, 404, 409 conflict, 422 business rule.
Paginated lists: `{ data: T[], page, pageSize, total }` (`page` from 1, `pageSize` default 20, max 100).
All rich-text fields are **sanitized HTML strings** (stored in the existing DB columns).

## Types

```ts
export type Role = 'student' | 'staff' | 'admin';
export type AccountStatus = 'active' | 'suspended';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type ClassLevel = 9 | 10 | 11 | 12;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type OptionKey = 'A' | 'B' | 'C' | 'D';
export interface Paginated<T> { data: T[]; page: number; pageSize: number; total: number }

export interface CurrentUser { id: number; name: string; email: string; institution: string; role: Role; status: AccountStatus }

export interface Chapter { id: number; classLevel: ClassLevel; order: number; title: string; status: ContentStatus;
  publishedAt: string | null; questionCount: number; publishedQuestionCount: number; createdAt: string }
export interface ChapterInput { classLevel: ClassLevel; title: string; order?: number; status: ContentStatus }

export interface Question { id: number; chapterId: number; classLevel: ClassLevel; chapterTitle: string;
  text: string; options: Record<OptionKey, string>; correct: OptionKey; explanation: string;
  difficulty: Difficulty; topic: string; marks: number; status: ContentStatus;
  questionImageUrl: string | null; textPlain: string; createdAt: string; updatedAt: string | null }
export interface QuestionInput { chapterId: number; text: string; options: Record<OptionKey, string>; correct: OptionKey;
  explanation: string; difficulty: Difficulty; topic: string; marks: number; status: ContentStatus; questionImageUrl: string | null }
export interface BulkImportRow { text: string; options: Record<OptionKey, string>; correct: OptionKey;
  explanation?: string; difficulty?: Difficulty; topic?: string; marks?: number }
export interface BulkImportRequest { chapterId: number; rows: BulkImportRow[] }               // max 500 rows
export interface BulkImportResult { dryRun: boolean; valid: number; invalid: number; inserted: number;
  errors: { row: number; field: string; message: string }[] }                                  // all-or-nothing insert, as drafts

export interface MoleculeRef { moleculeId: number; molecule: string; coefficient: number }
export interface Reaction { id: number; name: string; category: 'organic' | 'inorganic'; description: string; conditions: string;
  reactants: MoleculeRef[]; products: MoleculeRef[]; status: ContentStatus; reactantCount: number; productCount: number;
  createdAt: string; updatedAt: string }
export interface ReactionInput { name: string; category: 'organic' | 'inorganic'; description: string; conditions: string;
  reactants: { moleculeId: number; coefficient: number }[]; products: { moleculeId: number; coefficient: number }[]; status: ContentStatus }

export interface Atom { element: string; x: number; y: number; z: number }
export interface Bond { source: number; target: number; order: 1 | 2 | 3 }
export interface Molecule { id: number; name: string; formula: string; category: string; description: string;
  atoms: Atom[]; bonds: Bond[]; atomCount: number; bondCount: number; status: ContentStatus;
  origin: 'portal' | 'cache'; createdAt: string; updatedAt: string }
export interface MoleculeInput { name: string; formula: string; category: string; description: string; atoms: Atom[]; bonds: Bond[]; status: ContentStatus }
export interface PubChemResult { name: string; formula: string; description: string | null; cid: number | null;
  iupacName: string | null; molecularWeight: string | null; atoms: Atom[]; bonds: Bond[] }

export interface AdminUser { id: number; name: string; email: string; institution: string; role: Role; status: AccountStatus;
  createdAt: string; lastLoginAt: string | null; attemptCount: number }
export interface AuditLogEntry { id: number; action: string; actor: { id: number | null; name: string; email: string };
  entityType: string; entityId: string; timestamp: string; oldValue: unknown | null; newValue: unknown | null; ipAddress: string | null }

export interface StudentSummary { id: number; name: string; email: string; institution: string; status: AccountStatus;
  attempts: number; chaptersAttempted: number; avgPercentage: number; bestPercentage: number; points: number; lastActiveAt: string | null }
export interface StudentDetail { profile: { id: number; name: string; email: string; institution: string; status: AccountStatus; createdAt: string; lastLoginAt: string | null };
  totals: { attempts: number; chaptersAttempted: number; avgPercentage: number; bestPercentage: number; points: number; lastActiveAt: string | null };
  attempts: { id: number; chapterId: number | null; chapterTitle: string; classLevel: ClassLevel | null; score: number; totalQuestions: number;
    percentage: number; timeSpentSeconds: number | null; completedAt: string; hasAnswerDetail: boolean }[];
  chapterPerformance: { chapterId: number | null; title: string; classLevel: ClassLevel | null; attempts: number; bestPercentage: number; avgPercentage: number; lastAttemptAt: string }[];
  topicAccuracy: { topic: string; correct: number; total: number; accuracy: number }[];
  weakTopics: { topic: string; correct: number; total: number; accuracy: number }[];            // accuracy < 60 and total >= 3
  activityByDay: { date: string; attempts: number }[] }                                        // last 30 days

export type LeaderboardMetric = 'points' | 'average' | 'attempts';
export interface LeaderboardEntry { rank: number; userId: number; name: string; institution: string; points: number;
  avgPercentage: number; bestPercentage: number; attempts: number; chaptersAttempted: number; lastActiveAt: string | null }
export interface LeaderboardResponse { metric: LeaderboardMetric; period: '7d' | '30d' | 'all'; generatedAt: string; data: LeaderboardEntry[] }

export interface DashboardStats { counts: { molecules: number; reactions: number; chapters: number; questions: number; students: number; quizAttempts: number };
  content: Record<'chapters' | 'questions' | 'reactions' | 'molecules', { published: number; draft: number; archived: number }>;
  attempts: { last7Days: number; last30Days: number; avgPercentage: number; activeStudents30d: number };
  attemptsByDay: { date: string; attempts: number; avgPercentage: number }[];
  topStudents: LeaderboardEntry[]; recentActivity: AuditLogEntry[] }                          // recentActivity: admin sees all, staff only own

export interface QuizAnalytics { summary: { attempts: number; uniqueStudents: number; avgPercentage: number };
  attemptsByDay: { date: string; attempts: number; avgPercentage: number }[];
  scoreDistribution: { bucket: '0-39' | '40-59' | '60-79' | '80-100'; count: number }[];
  perChapter: { chapterId: number; title: string; classLevel: ClassLevel; attempts: number; uniqueStudents: number; avgPercentage: number }[];
  difficultyAccuracy: { difficulty: Difficulty; answers: number; accuracy: number }[];
  topicAccuracy: { topic: string; answers: number; accuracy: number }[];
  mostMissedQuestions: { questionId: number; text: string; chapterTitle: string; answers: number; missRate: number }[] }
```

## Endpoints

Roles: **S** = staff + admin, **A** = admin only.

| Method & path | Role | Notes |
|---|---|---|
| `GET /api/admin/me` | S | → `CurrentUser` |
| `GET /api/admin/dashboard` | S | → `DashboardStats` |
| `GET /api/admin/quizzes/chapters?classLevel=&status=&q=` | S | → `{ data: Chapter[] }` (no pagination) |
| `POST /api/admin/quizzes/chapters` | S | `ChapterInput` → `Chapter`; 409 on duplicate (class, order) |
| `GET/PUT /api/admin/quizzes/chapters/:id` | S | |
| `PATCH /api/admin/quizzes/chapters/:id/status` | S | `{ status }`; publishing needs ≥ 1 published question → 422 |
| `POST /api/admin/quizzes/chapters/reorder` | S | `{ classLevel, orderedIds: number[] }` |
| `DELETE /api/admin/quizzes/chapters/:id` | A | 409 if it has questions or attempts → suggest archive |
| `GET /api/admin/quizzes/questions?chapterId=&status=&difficulty=&topic=&q=&page=&pageSize=` | S | → `Paginated<Question>` |
| `POST /api/admin/quizzes/questions` | S | `QuestionInput` → `Question` |
| `GET/PUT /api/admin/quizzes/questions/:id` | S | |
| `PATCH /api/admin/quizzes/questions/:id/status` | S | `{ status }` |
| `DELETE /api/admin/quizzes/questions/:id` | A | archives instead if answers exist → `{ archived: true }` |
| `POST /api/admin/quizzes/questions/bulk-import?dryRun=true\|false` | S | `BulkImportRequest` → `BulkImportResult` |
| `POST /api/admin/uploads` | S | multipart `file` (≤ 5 MB image) → `{ url }` |
| `GET /api/admin/reactions?q=&category=&status=&page=&pageSize=` | S | → `Paginated<Reaction>` |
| `POST /api/admin/reactions`, `GET/PUT /:id`, `PATCH /:id/status` | S | `ReactionInput` (moleculeId in, names stored in DB) |
| `DELETE /api/admin/reactions/:id` | A | |
| `GET /api/admin/molecules?q=&category=&status=&page=&pageSize=` | S | → `Paginated<Molecule>` |
| `POST /api/admin/molecules`, `GET/PUT /:id`, `PATCH /:id/status` | S | `MoleculeInput`; rename blocked (409) if used by reactions |
| `DELETE /api/admin/molecules/:id` | A | 409 listing reactions that use it |
| `POST /api/admin/molecules/fetch-pubchem` | S | `{ query }` → `PubChemResult`; saves nothing |
| `GET /api/admin/students?q=&classLevel=&institution=&activeWithin=7\|30&sort=&page=&pageSize=` | S | → `Paginated<StudentSummary>` |
| `GET /api/admin/students/:id` | S | → `StudentDetail` |
| `GET /api/admin/leaderboard?metric=&classLevel=&chapterId=&period=&institution=&limit=` | S | → `LeaderboardResponse` (default metric `points`, period `all`, limit 50, max 200) |
| `GET /api/admin/analytics/quizzes?classLevel=&chapterId=&period=` | S | → `QuizAnalytics` |
| `GET /api/admin/users?q=&role=&status=&page=&pageSize=` | A | → `Paginated<AdminUser>` |
| `PATCH /api/admin/users` | A | `{ settings: { showStudentRank: boolean } }` updates learner portal settings |
| `PATCH /api/admin/users/:id/role` | A | `{ role }`; cannot change own role; last active admin protected (422) |
| `PATCH /api/admin/users/:id/status` | A | `{ status }`; cannot suspend self/last admin |
| `GET /api/admin/audit-logs?entityType=&action=&actorId=&from=&to=&q=&page=&pageSize=` | A | → `Paginated<AuditLogEntry>` |

## Leaderboard Calculation Definition

For each student and chapter within the selected period/filters:
1. Take the student's **best attempt** (highest percentage; tie → latest completed).
2. `points` = sum of those best percentages across attempted chapters (0–100 per chapter, 2 decimals) — rewards breadth and mastery, prevents farming by repeating one quiz.
3. `avgPercentage` = average of all attempts in range.
4. `attempts` = count of attempts in range.
5. Rank by the selected metric descending; equal values share a rank (1, 2, 2, 4); tie-break order: points, avgPercentage, earliest lastActiveAt, name.
