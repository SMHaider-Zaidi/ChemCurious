import {
  initialChapters,
  initialQuestions,
  initialMolecules,
  initialReactions,
  initialUsers,
  initialAuditLogs,
  stamp,
} from './data';
import type {
  Role,
  CurrentUser,
  Chapter,
  ChapterInput,
  Question,
  QuestionInput,
  BulkImportRequest,
  BulkImportResult,
  Reaction,
  ReactionInput,
  Molecule,
  MoleculeInput,
  PubChemResult,
  AdminUser,
  AuditLogEntry,
  StudentSummary,
  StudentDetail,
  LeaderboardResponse,
  LeaderboardEntry,
  LeaderboardMetric,
  DashboardStats,
  QuizAnalytics,
  Paginated,
  ClassLevel,
  Difficulty,
} from '../../types';
import { htmlToPlainText } from '../../chemFormat';
import { AdminApiError } from '../client';

// In-memory mutable collections for demo session
let chapters: Chapter[] = structuredClone(initialChapters);
let questions: Question[] = structuredClone(initialQuestions);
let molecules: Molecule[] = structuredClone(initialMolecules);
let reactions: Reaction[] = structuredClone(initialReactions);
let users: AdminUser[] = structuredClone(initialUsers);
let auditLogs: AuditLogEntry[] = structuredClone(initialAuditLogs);

let currentDemoRole: Role = 'admin';

const delay = <T>(val: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(val)), ms));

const nextId = (items: { id: number }[]): number =>
  Math.max(0, ...items.map((i) => i.id)) + 1;

function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  oldVal: unknown = null,
  newVal: unknown = null
) {
  const currentActor =
    currentDemoRole === 'admin'
      ? { id: 1, name: 'System Admin', email: 'admin@chemcurious.org' }
      : { id: 2, name: 'Staff Member', email: 'staff@chemcurious.org' };

  auditLogs.unshift({
    id: nextId(auditLogs),
    action,
    actor: currentActor,
    entityType,
    entityId: String(entityId),
    timestamp: new Date().toISOString(),
    oldValue: oldVal,
    newValue: newVal,
    ipAddress: '127.0.0.1 (demo)',
  });
}

function paginate<T>(items: T[], page = 1, pageSize = 20): Paginated<T> {
  const p = Math.max(1, page);
  const size = Math.min(100, Math.max(1, pageSize));
  const start = (p - 1) * size;
  return {
    data: items.slice(start, start + size),
    page: p,
    pageSize: size,
    total: items.length,
  };
}

// Generate realistic simulated attempts for sample student records
interface RawAttempt {
  id: number;
  userId: number;
  chapterId: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  completedAt: string;
  hasAnswerDetail: boolean;
}

const mockStudentAttempts: RawAttempt[] = [];

// Seed deterministic attempts for the 25 sample users
(function seedAttempts() {
  let attemptId = 1;
  const studentUsers = users.filter((u) => u.role === 'student');

  studentUsers.forEach((student, sIdx) => {
    // Top students have more attempts and higher scores
    const attemptCount = Math.max(2, 28 - sIdx);
    const pubChapters = chapters.filter((c) => c.status === 'published');

    for (let i = 0; i < attemptCount; i++) {
      const ch = pubChapters[(sIdx + i) % pubChapters.length];
      if (!ch) continue;
      const totalQ = Math.max(3, ch.publishedQuestionCount || 4);
      // Generate scores between 55% and 100%
      const basePct = Math.min(100, Math.max(50, 95 - sIdx * 1.5 + (i % 3) * 4));
      const score = Math.round((basePct / 100) * totalQ);
      const pct = Math.round((score / totalQ) * 100);
      const daysAgo = Math.max(0, Math.floor((attemptCount - i) * 1.1));

      mockStudentAttempts.push({
        id: attemptId++,
        userId: student.id,
        chapterId: ch.id,
        score,
        totalQuestions: totalQ,
        percentage: pct,
        timeSpentSeconds: 60 + ((i * 37) % 180),
        completedAt: stamp(daysAgo, (i * 3) % 24),
        hasAnswerDetail: i < 5,
      });
    }
  });
})();

export const demoAdapter = {
  // Demo Role management for testing
  getRole(): Role {
    return currentDemoRole;
  },
  setRole(r: Role) {
    currentDemoRole = r;
  },

  async getMe(): Promise<CurrentUser> {
    const user =
      currentDemoRole === 'admin'
        ? users[0]
        : currentDemoRole === 'staff'
        ? users[1]
        : users[2];

    return delay({
      id: user!.id,
      name: user!.name,
      email: user!.email,
      institution: user!.institution,
      role: currentDemoRole,
      status: user!.status,
    });
  },

  // --- CHAPTERS ---
  async getChapters(filters?: { classLevel?: number; status?: string; q?: string }): Promise<{ data: Chapter[] }> {
    let list = chapters.map((c) => {
      const chQuestions = questions.filter((q) => q.chapterId === c.id);
      return {
        ...c,
        questionCount: chQuestions.length,
        publishedQuestionCount: chQuestions.filter((q) => q.status === 'published').length,
      };
    });

    if (filters?.classLevel) {
      list = list.filter((c) => c.classLevel === Number(filters.classLevel));
    }
    if (filters?.status) {
      list = list.filter((c) => c.status === filters.status);
    }
    if (filters?.q) {
      const query = filters.q.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(query));
    }

    list.sort((a, b) => a.classLevel - b.classLevel || a.order - b.order);
    return delay({ data: list });
  },

  async getChapter(id: number): Promise<Chapter> {
    const ch = chapters.find((c) => c.id === id);
    if (!ch) throw new AdminApiError('Chapter not found', 404);
    const chQuestions = questions.filter((q) => q.chapterId === ch.id);
    return delay({
      ...ch,
      questionCount: chQuestions.length,
      publishedQuestionCount: chQuestions.filter((q) => q.status === 'published').length,
    });
  },

  async createChapter(input: ChapterInput): Promise<Chapter> {
    const sameClass = chapters.filter((c) => c.classLevel === input.classLevel);
    const order = input.order ?? (sameClass.length ? Math.max(...sameClass.map((c) => c.order)) + 1 : 1);

    if (sameClass.some((c) => c.order === order)) {
      throw new AdminApiError(`Order ${order} already exists in Class ${input.classLevel}`, 409);
    }

    const newChapter: Chapter = {
      id: nextId(chapters),
      classLevel: input.classLevel,
      order,
      title: input.title.trim(),
      status: input.status,
      publishedAt: input.status === 'published' ? new Date().toISOString() : null,
      questionCount: 0,
      publishedQuestionCount: 0,
      createdAt: new Date().toISOString(),
    };
    chapters.push(newChapter);
    logAudit('create_chapter', 'chapter', String(newChapter.id), null, newChapter);
    return delay(newChapter);
  },

  async updateChapter(id: number, input: ChapterInput): Promise<Chapter> {
    const idx = chapters.findIndex((c) => c.id === id);
    if (idx === -1) throw new AdminApiError('Chapter not found', 404);

    const old = chapters[idx]!;
    const updated: Chapter = {
      ...old,
      classLevel: input.classLevel,
      title: input.title.trim(),
      order: input.order ?? old.order,
      status: input.status,
      publishedAt:
        input.status === 'published' && !old.publishedAt
          ? new Date().toISOString()
          : input.status === 'draft'
          ? null
          : old.publishedAt,
    };
    chapters[idx] = updated;
    logAudit('update_chapter', 'chapter', String(id), old, updated);
    return delay(updated);
  },

  async setChapterStatus(id: number, status: Chapter['status']): Promise<Chapter> {
    const idx = chapters.findIndex((c) => c.id === id);
    if (idx === -1) throw new AdminApiError('Chapter not found', 404);

    const ch = chapters[idx]!;
    if (status === 'published') {
      const pubCount = questions.filter((q) => q.chapterId === id && q.status === 'published').length;
      if (pubCount === 0) {
        throw new AdminApiError('Cannot publish chapter without at least 1 published question', 422);
      }
    }

    const updated: Chapter = {
      ...ch,
      status,
      publishedAt: status === 'published' ? new Date().toISOString() : null,
    };
    chapters[idx] = updated;
    logAudit('set_chapter_status', 'chapter', String(id), { status: ch.status }, { status });
    return delay(updated);
  },

  async reorderChapters(classLevel: ClassLevel, orderedIds: number[]): Promise<{ success: boolean }> {
    orderedIds.forEach((id, index) => {
      const ch = chapters.find((c) => c.id === id && c.classLevel === classLevel);
      if (ch) ch.order = index + 1;
    });
    logAudit('reorder_chapters', 'chapter', `class-${classLevel}`, null, { orderedIds });
    return delay({ success: true });
  },

  async deleteChapter(id: number): Promise<void> {
    const idx = chapters.findIndex((c) => c.id === id);
    if (idx === -1) throw new AdminApiError('Chapter not found', 404);

    const hasQuestions = questions.some((q) => q.chapterId === id);
    const hasAttempts = mockStudentAttempts.some((a) => a.chapterId === id);

    if (hasQuestions || hasAttempts) {
      throw new AdminApiError(
        'Cannot delete chapter with existing questions or student attempts. Consider archiving instead.',
        409
      );
    }

    const removed = chapters[idx];
    chapters.splice(idx, 1);
    logAudit('delete_chapter', 'chapter', String(id), removed, null);
    return delay(undefined);
  },

  // --- QUESTIONS ---
  async getQuestions(filters?: {
    chapterId?: number;
    status?: string;
    difficulty?: string;
    topic?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<Question>> {
    let list = [...questions];

    if (filters?.chapterId) {
      list = list.filter((q) => q.chapterId === Number(filters.chapterId));
    }
    if (filters?.status) {
      list = list.filter((q) => q.status === filters.status);
    }
    if (filters?.difficulty) {
      list = list.filter((q) => q.difficulty === filters.difficulty);
    }
    if (filters?.topic) {
      list = list.filter((q) => q.topic.toLowerCase().includes(filters.topic!.toLowerCase()));
    }
    if (filters?.q) {
      const query = filters.q.toLowerCase();
      list = list.filter(
        (q) =>
          q.textPlain.toLowerCase().includes(query) ||
          q.topic.toLowerCase().includes(query) ||
          q.chapterTitle.toLowerCase().includes(query)
      );
    }

    list.sort((a, b) => b.id - a.id);
    return delay(paginate(list, filters?.page, filters?.pageSize));
  },

  async getQuestion(id: number): Promise<Question> {
    const q = questions.find((item) => item.id === id);
    if (!q) throw new AdminApiError('Question not found', 404);
    return delay(q);
  },

  async createQuestion(input: QuestionInput): Promise<Question> {
    const ch = chapters.find((c) => c.id === input.chapterId);
    if (!ch) throw new AdminApiError('Target chapter not found', 404);

    const newQ: Question = {
      id: nextId(questions),
      chapterId: input.chapterId,
      classLevel: ch.classLevel,
      chapterTitle: ch.title,
      text: input.text,
      textPlain: htmlToPlainText(input.text),
      options: input.options,
      correct: input.correct,
      explanation: input.explanation,
      difficulty: input.difficulty,
      topic: input.topic,
      marks: input.marks,
      status: input.status,
      questionImageUrl: input.questionImageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    questions.unshift(newQ);
    logAudit('create_question', 'question', String(newQ.id), null, newQ);
    return delay(newQ);
  },

  async updateQuestion(id: number, input: QuestionInput): Promise<Question> {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx === -1) throw new AdminApiError('Question not found', 404);

    const old = questions[idx]!;
    const ch = chapters.find((c) => c.id === input.chapterId) ?? { classLevel: old.classLevel, title: old.chapterTitle };

    const updated: Question = {
      ...old,
      chapterId: input.chapterId,
      classLevel: ch.classLevel,
      chapterTitle: ch.title,
      text: input.text,
      textPlain: htmlToPlainText(input.text),
      options: input.options,
      correct: input.correct,
      explanation: input.explanation,
      difficulty: input.difficulty,
      topic: input.topic,
      marks: input.marks,
      status: input.status,
      questionImageUrl: input.questionImageUrl,
      updatedAt: new Date().toISOString(),
    };
    questions[idx] = updated;
    logAudit('update_question', 'question', String(id), old, updated);
    return delay(updated);
  },

  async setQuestionStatus(id: number, status: Question['status']): Promise<Question> {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx === -1) throw new AdminApiError('Question not found', 404);

    const old = questions[idx]!;
    const updated: Question = {
      ...old,
      status,
      updatedAt: new Date().toISOString(),
    };
    questions[idx] = updated;
    logAudit('set_question_status', 'question', String(id), { status: old.status }, { status });
    return delay(updated);
  },

  async deleteQuestion(id: number): Promise<{ archived: boolean }> {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx === -1) throw new AdminApiError('Question not found', 404);

    // If answers exist, archive instead of deleting
    const hasAnswers = idx % 2 === 0; // simulated answer history check
    if (hasAnswers) {
      questions[idx]!.status = 'archived';
      questions[idx]!.updatedAt = new Date().toISOString();
      logAudit('archive_question', 'question', String(id), null, { status: 'archived' });
      return delay({ archived: true });
    }

    const removed = questions[idx];
    questions.splice(idx, 1);
    logAudit('delete_question', 'question', String(id), removed, null);
    return delay({ archived: false });
  },

  async bulkImportQuestions(
    req: BulkImportRequest,
    dryRun = false
  ): Promise<BulkImportResult> {
    const ch = chapters.find((c) => c.id === req.chapterId);
    if (!ch) throw new AdminApiError('Target chapter not found', 404);

    const errors: { row: number; field: string; message: string }[] = [];
    const validRows: Question[] = [];

    req.rows.forEach((row, i) => {
      const rowNum = i + 1;
      if (!row.text || row.text.trim().length < 3) {
        errors.push({ row: rowNum, field: 'text', message: 'Question text too short' });
      }
      if (!row.options?.A || !row.options?.B || !row.options?.C || !row.options?.D) {
        errors.push({ row: rowNum, field: 'options', message: 'All four options (A, B, C, D) are required' });
      }
      if (!['A', 'B', 'C', 'D'].includes(row.correct)) {
        errors.push({ row: rowNum, field: 'correct', message: 'Correct answer must be A, B, C, or D' });
      }

      if (errors.filter((e) => e.row === rowNum).length === 0) {
        validRows.push({
          id: nextId(questions) + i,
          chapterId: ch.id,
          classLevel: ch.classLevel,
          chapterTitle: ch.title,
          text: row.text,
          textPlain: htmlToPlainText(row.text),
          options: row.options,
          correct: row.correct,
          explanation: row.explanation || '',
          difficulty: row.difficulty || 'easy',
          topic: row.topic || 'General',
          marks: row.marks || 1,
          status: 'draft',
          questionImageUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        });
      }
    });

    const invalid = errors.length > 0 ? new Set(errors.map((e) => e.row)).size : 0;
    const valid = req.rows.length - invalid;

    if (!dryRun && invalid === 0 && validRows.length > 0) {
      questions.push(...validRows);
      logAudit('bulk_import_questions', 'question', `chapter-${ch.id}`, null, { count: validRows.length });
    }

    return delay({
      dryRun,
      valid,
      invalid,
      inserted: !dryRun && invalid === 0 ? validRows.length : 0,
      errors,
    });
  },

  // --- REACTIONS ---
  async getReactions(filters?: {
    category?: 'organic' | 'inorganic';
    status?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<Reaction>> {
    let list = [...reactions];

    if (filters?.category) {
      list = list.filter((r) => r.category === filters.category);
    }
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters?.q) {
      const query = filters.q.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.conditions.toLowerCase().includes(query)
      );
    }

    list.sort((a, b) => b.id - a.id);
    return delay(paginate(list, filters?.page, filters?.pageSize));
  },

  async getReaction(id: number): Promise<Reaction> {
    const r = reactions.find((item) => item.id === id);
    if (!r) throw new AdminApiError('Reaction not found', 404);
    return delay(r);
  },

  async createReaction(input: ReactionInput): Promise<Reaction> {
    const resolveRef = (item: { moleculeId: number; coefficient: number }) => {
      const mol = molecules.find((m) => m.id === item.moleculeId);
      return {
        moleculeId: item.moleculeId,
        molecule: mol?.name || `Molecule #${item.moleculeId}`,
        coefficient: item.coefficient,
      };
    };

    const newR: Reaction = {
      id: nextId(reactions),
      name: input.name.trim(),
      category: input.category,
      description: input.description,
      conditions: input.conditions,
      reactants: input.reactants.map(resolveRef),
      products: input.products.map(resolveRef),
      status: input.status,
      reactantCount: input.reactants.length,
      productCount: input.products.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reactions.unshift(newR);
    logAudit('create_reaction', 'reaction', String(newR.id), null, newR);
    return delay(newR);
  },

  async updateReaction(id: number, input: ReactionInput): Promise<Reaction> {
    const idx = reactions.findIndex((r) => r.id === id);
    if (idx === -1) throw new AdminApiError('Reaction not found', 404);

    const old = reactions[idx]!;
    const resolveRef = (item: { moleculeId: number; coefficient: number }) => {
      const mol = molecules.find((m) => m.id === item.moleculeId);
      return {
        moleculeId: item.moleculeId,
        molecule: mol?.name || `Molecule #${item.moleculeId}`,
        coefficient: item.coefficient,
      };
    };

    const updated: Reaction = {
      ...old,
      name: input.name.trim(),
      category: input.category,
      description: input.description,
      conditions: input.conditions,
      reactants: input.reactants.map(resolveRef),
      products: input.products.map(resolveRef),
      status: input.status,
      reactantCount: input.reactants.length,
      productCount: input.products.length,
      updatedAt: new Date().toISOString(),
    };
    reactions[idx] = updated;
    logAudit('update_reaction', 'reaction', String(id), old, updated);
    return delay(updated);
  },

  async setReactionStatus(id: number, status: Reaction['status']): Promise<Reaction> {
    const idx = reactions.findIndex((r) => r.id === id);
    if (idx === -1) throw new AdminApiError('Reaction not found', 404);

    const old = reactions[idx]!;
    const updated: Reaction = {
      ...old,
      status,
      updatedAt: new Date().toISOString(),
    };
    reactions[idx] = updated;
    logAudit('set_reaction_status', 'reaction', String(id), { status: old.status }, { status });
    return delay(updated);
  },

  async deleteReaction(id: number): Promise<void> {
    const idx = reactions.findIndex((r) => r.id === id);
    if (idx === -1) throw new AdminApiError('Reaction not found', 404);

    const removed = reactions[idx];
    reactions.splice(idx, 1);
    logAudit('delete_reaction', 'reaction', String(id), removed, null);
    return delay(undefined);
  },

  // --- MOLECULES ---
  async getMolecules(filters?: {
    category?: string;
    status?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<Molecule>> {
    let list = [...molecules];

    if (filters?.category) {
      list = list.filter((m) => m.category.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters?.status) {
      list = list.filter((m) => m.status === filters.status);
    }
    if (filters?.q) {
      const query = filters.q.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.formula.toLowerCase().includes(query) ||
          m.category.toLowerCase().includes(query)
      );
    }

    list.sort((a, b) => b.id - a.id);
    return delay(paginate(list, filters?.page, filters?.pageSize));
  },

  async getMolecule(id: number): Promise<Molecule> {
    const m = molecules.find((item) => item.id === id);
    if (!m) throw new AdminApiError('Molecule not found', 404);
    return delay(m);
  },

  async createMolecule(input: MoleculeInput): Promise<Molecule> {
    const newM: Molecule = {
      id: nextId(molecules),
      name: input.name.trim(),
      formula: input.formula.trim(),
      category: input.category.trim(),
      description: input.description,
      atoms: input.atoms,
      bonds: input.bonds,
      atomCount: input.atoms.length,
      bondCount: input.bonds.length,
      status: input.status,
      origin: 'portal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    molecules.unshift(newM);
    logAudit('create_molecule', 'molecule', String(newM.id), null, newM);
    return delay(newM);
  },

  async updateMolecule(id: number, input: MoleculeInput): Promise<Molecule> {
    const idx = molecules.findIndex((m) => m.id === id);
    if (idx === -1) throw new AdminApiError('Molecule not found', 404);

    const old = molecules[idx]!;

    // Check if name changed and molecule is used in reactions
    if (old.name !== input.name.trim()) {
      const usedIn = reactions.filter(
        (r) =>
          r.reactants.some((ref) => ref.moleculeId === id) ||
          r.products.some((ref) => ref.moleculeId === id)
      );
      if (usedIn.length > 0) {
        throw new AdminApiError(
          `Cannot rename molecule: currently referenced by ${usedIn.length} reaction(s) (${usedIn.map((r) => r.name).join(', ')})`,
          409
        );
      }
    }

    const updated: Molecule = {
      ...old,
      name: input.name.trim(),
      formula: input.formula.trim(),
      category: input.category.trim(),
      description: input.description,
      atoms: input.atoms,
      bonds: input.bonds,
      atomCount: input.atoms.length,
      bondCount: input.bonds.length,
      status: input.status,
      updatedAt: new Date().toISOString(),
    };
    molecules[idx] = updated;
    logAudit('update_molecule', 'molecule', String(id), old, updated);
    return delay(updated);
  },

  async setMoleculeStatus(id: number, status: Molecule['status']): Promise<Molecule> {
    const idx = molecules.findIndex((m) => m.id === id);
    if (idx === -1) throw new AdminApiError('Molecule not found', 404);

    const old = molecules[idx]!;
    const updated: Molecule = {
      ...old,
      status,
      updatedAt: new Date().toISOString(),
    };
    molecules[idx] = updated;
    logAudit('set_molecule_status', 'molecule', String(id), { status: old.status }, { status });
    return delay(updated);
  },

  async deleteMolecule(id: number): Promise<void> {
    const idx = molecules.findIndex((m) => m.id === id);
    if (idx === -1) throw new AdminApiError('Molecule not found', 404);

    const usedIn = reactions.filter(
      (r) =>
        r.reactants.some((ref) => ref.moleculeId === id) ||
        r.products.some((ref) => ref.moleculeId === id)
    );
    if (usedIn.length > 0) {
      throw new AdminApiError(
        `Cannot delete molecule: actively used in reactions: ${usedIn.map((r) => `"${r.name}"`).join(', ')}`,
        409
      );
    }

    const removed = molecules[idx];
    molecules.splice(idx, 1);
    logAudit('delete_molecule', 'molecule', String(id), removed, null);
    return delay(undefined);
  },

  async fetchPubChem(query: string): Promise<PubChemResult> {
    await delay(null, 300);
    // Provide a sample result for common compounds in demo mode, or honest error
    const lower = query.toLowerCase().trim();
    if (lower === 'ethanol' || lower === '702') {
      return {
        name: 'Ethanol',
        formula: 'C2H5OH',
        description: 'Primary alcohol commonly used as a solvent and fuel component.',
        cid: 702,
        iupacName: 'ethanol',
        molecularWeight: '46.07 g/mol',
        atoms: [
          { element: 'C', x: 0, y: 0, z: 0 },
          { element: 'C', x: 1.5, y: 0, z: 0 },
          { element: 'O', x: 2.1, y: 1.2, z: 0 },
          { element: 'H', x: 3.0, y: 1.1, z: 0 },
          { element: 'H', x: -0.4, y: 0.9, z: 0.5 },
          { element: 'H', x: -0.4, y: -0.9, z: 0.5 },
          { element: 'H', x: -0.4, y: 0, z: -1.0 },
          { element: 'H', x: 1.9, y: -0.5, z: 0.8 },
          { element: 'H', x: 1.9, y: -0.5, z: -0.8 },
        ],
        bonds: [
          { source: 0, target: 1, order: 1 },
          { source: 1, target: 2, order: 1 },
          { source: 2, target: 3, order: 1 },
          { source: 0, target: 4, order: 1 },
          { source: 0, target: 5, order: 1 },
          { source: 0, target: 6, order: 1 },
          { source: 1, target: 7, order: 1 },
          { source: 1, target: 8, order: 1 },
        ],
      };
    }

    throw new AdminApiError(
      `PubChem compound "${query}" not cached in demo mode. Try "ethanol" or "702" for testing.`,
      404
    );
  },

  // --- STUDENTS ---
  async getStudents(filters?: {
    q?: string;
    classLevel?: number;
    institution?: string;
    activeWithin?: number;
    sort?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<StudentSummary>> {
    const studentUsers = users.filter((u) => u.role === 'student');

    let summaries: StudentSummary[] = studentUsers.map((s) => {
      const userAttempts = mockStudentAttempts.filter((a) => a.userId === s.id);
      const uniqueChapters = new Set(userAttempts.map((a) => a.chapterId));

      // Calculate points according to contract definition:
      // sum of best percentage across attempted chapters
      const bestPerChapter = new Map<number, number>();
      userAttempts.forEach((a) => {
        const existing = bestPerChapter.get(a.chapterId) ?? 0;
        if (a.percentage > existing) bestPerChapter.set(a.chapterId, a.percentage);
      });
      const points = Array.from(bestPerChapter.values()).reduce((sum, v) => sum + v, 0);

      const avgPercentage =
        userAttempts.length > 0
          ? Math.round((userAttempts.reduce((sum, a) => sum + a.percentage, 0) / userAttempts.length) * 10) / 10
          : 0;

      const bestPercentage =
        userAttempts.length > 0 ? Math.max(...userAttempts.map((a) => a.percentage)) : 0;

      const latestCompleted =
        userAttempts.length > 0
          ? userAttempts.map((a) => a.completedAt).sort().reverse()[0] ?? s.lastLoginAt
          : s.lastLoginAt;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        institution: s.institution,
        status: s.status,
        attempts: userAttempts.length,
        chaptersAttempted: uniqueChapters.size,
        avgPercentage,
        bestPercentage,
        points: Math.round(points * 100) / 100,
        lastActiveAt: latestCompleted,
      };
    });

    if (filters?.q) {
      const q = filters.q.toLowerCase();
      summaries = summaries.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.institution.toLowerCase().includes(q)
      );
    }

    if (filters?.institution) {
      summaries = summaries.filter((s) => s.institution === filters.institution);
    }

    if (filters?.activeWithin) {
      const cutoff = new Date(Date.now() - filters.activeWithin * 86400_000).toISOString();
      summaries = summaries.filter((s) => s.lastActiveAt && s.lastActiveAt >= cutoff);
    }

    // Sort order
    if (filters?.sort === 'points_desc') {
      summaries.sort((a, b) => b.points - a.points);
    } else if (filters?.sort === 'avg_desc') {
      summaries.sort((a, b) => b.avgPercentage - a.avgPercentage);
    } else if (filters?.sort === 'attempts_desc') {
      summaries.sort((a, b) => b.attempts - a.attempts);
    } else {
      summaries.sort((a, b) => b.points - a.points || b.attempts - a.attempts);
    }

    return delay(paginate(summaries, filters?.page, filters?.pageSize));
  },

  async getStudentDetail(id: number): Promise<StudentDetail> {
    const student = users.find((u) => u.id === id);
    if (!student) throw new AdminApiError('Student profile not found', 404);

    const userAttempts = mockStudentAttempts
      .filter((a) => a.userId === id)
      .map((a) => {
        const ch = chapters.find((c) => c.id === a.chapterId);
        return {
          id: a.id,
          chapterId: a.chapterId,
          chapterTitle: ch?.title || `Chapter #${a.chapterId}`,
          classLevel: ch?.classLevel || null,
          score: a.score,
          totalQuestions: a.totalQuestions,
          percentage: a.percentage,
          timeSpentSeconds: a.timeSpentSeconds,
          completedAt: a.completedAt,
          hasAnswerDetail: a.hasAnswerDetail,
        };
      })
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    // Best and average per chapter
    const chapterMap = new Map<number, { scores: number[]; classLevel: ClassLevel | null; title: string; latest: string }>();
    userAttempts.forEach((a) => {
      if (!a.chapterId) return;
      if (!chapterMap.has(a.chapterId)) {
        chapterMap.set(a.chapterId, {
          scores: [],
          classLevel: a.classLevel,
          title: a.chapterTitle,
          latest: a.completedAt,
        });
      }
      const item = chapterMap.get(a.chapterId)!;
      item.scores.push(a.percentage);
      if (new Date(a.completedAt).getTime() > new Date(item.latest).getTime()) {
        item.latest = a.completedAt;
      }
    });

    const chapterPerformance = Array.from(chapterMap.entries()).map(([chId, val]) => ({
      chapterId: chId,
      title: val.title,
      classLevel: val.classLevel,
      attempts: val.scores.length,
      bestPercentage: Math.max(...val.scores),
      avgPercentage: Math.round((val.scores.reduce((sum, n) => sum + n, 0) / val.scores.length) * 10) / 10,
      lastAttemptAt: val.latest,
    }));

    // Points calculation: sum of best percentage across attempted chapters
    const points = chapterPerformance.reduce((acc, c) => acc + c.bestPercentage, 0);

    const avgPercentage =
      userAttempts.length > 0
        ? Math.round((userAttempts.reduce((sum, a) => sum + a.percentage, 0) / userAttempts.length) * 10) / 10
        : 0;

    const bestPercentage =
      userAttempts.length > 0 ? Math.max(...userAttempts.map((a) => a.percentage)) : 0;

    // Topic accuracy simulation
    const topicAccuracy = [
      { topic: 'States of Matter', correct: 18, total: 20, accuracy: 90 },
      { topic: 'Balancing Equations', correct: 15, total: 18, accuracy: 83.3 },
      { topic: 'Reaction Types', correct: 10, total: 14, accuracy: 71.4 },
      { topic: 'Sublimation', correct: 8, total: 10, accuracy: 80 },
      { topic: 'Redox Reactions', correct: 3, total: 8, accuracy: 37.5 },
      { topic: 'Rancidity & Corrosion', correct: 2, total: 5, accuracy: 40 },
    ];

    const weakTopics = topicAccuracy.filter((t) => t.accuracy < 60 && t.total >= 3);

    // Activity by day (last 30 days)
    const activityMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().split('T')[0]!;
      activityMap.set(d, 0);
    }
    userAttempts.forEach((a) => {
      const day = a.completedAt.split('T')[0]!;
      if (activityMap.has(day)) {
        activityMap.set(day, (activityMap.get(day) || 0) + 1);
      }
    });

    const activityByDay = Array.from(activityMap.entries()).map(([date, count]) => ({
      date,
      attempts: count,
    }));

    return delay({
      profile: {
        id: student.id,
        name: student.name,
        email: student.email,
        institution: student.institution,
        status: student.status,
        createdAt: student.createdAt,
        lastLoginAt: student.lastLoginAt,
      },
      totals: {
        attempts: userAttempts.length,
        chaptersAttempted: chapterPerformance.length,
        avgPercentage,
        bestPercentage,
        points: Math.round(points * 100) / 100,
        lastActiveAt: userAttempts[0]?.completedAt || student.lastLoginAt,
      },
      attempts: userAttempts,
      chapterPerformance,
      topicAccuracy,
      weakTopics,
      activityByDay,
    });
  },

  // --- LEADERBOARD ---
  async getLeaderboard(params?: {
    metric?: LeaderboardMetric;
    classLevel?: number;
    chapterId?: number;
    period?: '7d' | '30d' | 'all';
    institution?: string;
    limit?: number;
  }): Promise<LeaderboardResponse> {
    const metric: LeaderboardMetric = params?.metric || 'points';
    const period = params?.period || 'all';
    const limit = Math.min(200, params?.limit || 50);

    const now = Date.now();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 9999;
    const cutoff = new Date(now - periodDays * 86400_000).toISOString();

    const studentUsers = users.filter((u) => u.role === 'student');

    let entries: LeaderboardEntry[] = studentUsers.map((student) => {
      let userAttempts = mockStudentAttempts.filter(
        (a) => a.userId === student.id && (period === 'all' || a.completedAt >= cutoff)
      );

      if (params?.chapterId) {
        userAttempts = userAttempts.filter((a) => a.chapterId === Number(params.chapterId));
      }

      if (params?.classLevel) {
        userAttempts = userAttempts.filter((a) => {
          const ch = chapters.find((c) => c.id === a.chapterId);
          return ch?.classLevel === Number(params.classLevel);
        });
      }

      // Best percentage per chapter in period
      const bestMap = new Map<number, { pct: number; completedAt: string }>();
      userAttempts.forEach((a) => {
        const cur = bestMap.get(a.chapterId);
        if (!cur || a.percentage > cur.pct || (a.percentage === cur.pct && a.completedAt > cur.completedAt)) {
          bestMap.set(a.chapterId, { pct: a.percentage, completedAt: a.completedAt });
        }
      });

      const points = Array.from(bestMap.values()).reduce((sum, item) => sum + item.pct, 0);

      const avgPercentage =
        userAttempts.length > 0
          ? Math.round((userAttempts.reduce((sum, a) => sum + a.percentage, 0) / userAttempts.length) * 10) / 10
          : 0;

      const bestPercentage =
        userAttempts.length > 0 ? Math.max(...userAttempts.map((a) => a.percentage)) : 0;

      const lastActiveAt =
        userAttempts.length > 0
          ? userAttempts.map((a) => a.completedAt).sort().reverse()[0]!
          : student.lastLoginAt;

      return {
        rank: 0,
        userId: student.id,
        name: student.name,
        institution: student.institution,
        points: Math.round(points * 100) / 100,
        avgPercentage,
        bestPercentage,
        attempts: userAttempts.length,
        chaptersAttempted: bestMap.size,
        lastActiveAt,
      };
    });

    if (params?.institution) {
      entries = entries.filter((e) => e.institution === params.institution);
    }

    // Rank sorting according to metric descending, tie-breaks
    entries.sort((a, b) => {
      let primary = 0;
      if (metric === 'points') primary = b.points - a.points;
      else if (metric === 'average') primary = b.avgPercentage - a.avgPercentage;
      else if (metric === 'attempts') primary = b.attempts - a.attempts;

      if (primary !== 0) return primary;
      if (b.points !== a.points) return b.points - a.points;
      if (b.avgPercentage !== a.avgPercentage) return b.avgPercentage - a.avgPercentage;
      return a.name.localeCompare(b.name);
    });

    // Assign dense/standard shared ranks
    let currentRank = 1;
    entries.forEach((entry, idx) => {
      if (idx > 0) {
        const prev = entries[idx - 1]!;
        const same =
          metric === 'points'
            ? entry.points === prev.points
            : metric === 'average'
            ? entry.avgPercentage === prev.avgPercentage
            : entry.attempts === prev.attempts;

        if (same) {
          entry.rank = prev.rank;
        } else {
          entry.rank = idx + 1;
        }
      } else {
        entry.rank = 1;
      }
    });

    return delay({
      metric,
      period,
      generatedAt: new Date().toISOString(),
      data: entries.slice(0, limit),
    });
  },

  // --- ANALYTICS ---
  async getQuizAnalytics(params?: {
    classLevel?: number;
    chapterId?: number;
    period?: '7d' | '30d' | 'all';
  }): Promise<QuizAnalytics> {
    const period = params?.period || '30d';
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 9999;
    const cutoff = new Date(Date.now() - periodDays * 86400_000).toISOString();

    let attempts = mockStudentAttempts.filter(
      (a) => period === 'all' || a.completedAt >= cutoff
    );

    if (params?.chapterId) {
      attempts = attempts.filter((a) => a.chapterId === Number(params.chapterId));
    }
    if (params?.classLevel) {
      attempts = attempts.filter((a) => {
        const ch = chapters.find((c) => c.id === a.chapterId);
        return ch?.classLevel === Number(params.classLevel);
      });
    }

    const uniqueStudents = new Set(attempts.map((a) => a.userId)).size;
    const avgPercentage =
      attempts.length > 0
        ? Math.round((attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length) * 10) / 10
        : 0;

    // Score distribution buckets
    const scoreDistribution = [
      { bucket: '0-39' as const, count: attempts.filter((a) => a.percentage < 40).length },
      { bucket: '40-59' as const, count: attempts.filter((a) => a.percentage >= 40 && a.percentage < 60).length },
      { bucket: '60-79' as const, count: attempts.filter((a) => a.percentage >= 60 && a.percentage < 80).length },
      { bucket: '80-100' as const, count: attempts.filter((a) => a.percentage >= 80).length },
    ];

    // Per chapter analytics
    const perChapter = chapters.map((ch) => {
      const chAttempts = attempts.filter((a) => a.chapterId === ch.id);
      const chAvg =
        chAttempts.length > 0
          ? Math.round((chAttempts.reduce((sum, a) => sum + a.percentage, 0) / chAttempts.length) * 10) / 10
          : 0;
      return {
        chapterId: ch.id,
        title: ch.title,
        classLevel: ch.classLevel,
        attempts: chAttempts.length,
        uniqueStudents: new Set(chAttempts.map((a) => a.userId)).size,
        avgPercentage: chAvg,
      };
    });

    // Accuracy by difficulty
    const difficultyAccuracy = [
      { difficulty: 'easy' as Difficulty, answers: 240, accuracy: 88.5 },
      { difficulty: 'medium' as Difficulty, answers: 185, accuracy: 72.1 },
      { difficulty: 'hard' as Difficulty, answers: 94, accuracy: 48.7 },
    ];

    // Accuracy by topic
    const topicAccuracy = [
      { topic: 'States of Matter', answers: 98, accuracy: 89 },
      { topic: 'Balancing Equations', answers: 112, accuracy: 81 },
      { topic: 'Reaction Types', answers: 84, accuracy: 74 },
      { topic: 'Sublimation', answers: 42, accuracy: 85 },
      { topic: 'Temperature Scales', answers: 56, accuracy: 92 },
      { topic: 'Redox Reactions', answers: 72, accuracy: 46 },
      { topic: 'Rancidity & Corrosion', answers: 45, accuracy: 52 },
    ];

    // Top missed questions
    const mostMissedQuestions = [
      {
        questionId: 8,
        text: 'Which substance is oxidized in the following redox couple: CuO + H2 -> Cu + H2O?',
        chapterTitle: 'Chemical Reactions and Equations',
        answers: 72,
        missRate: 54,
      },
      {
        questionId: 9,
        text: 'Fatty and oily foods develop an unpleasant taste and odor when left exposed to air due to:',
        chapterTitle: 'Chemical Reactions and Equations',
        answers: 45,
        missRate: 48,
      },
      {
        questionId: 6,
        text: 'The thermal decomposition of limestone produces quicklime and gas: CaCO3(s) -> CaO(s) + CO2(g)...',
        chapterTitle: 'Chemical Reactions and Equations',
        answers: 84,
        missRate: 36,
      },
    ];

    // Activity by day (last 30 days)
    const attemptsMap = new Map<string, { count: number; totalPct: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().split('T')[0]!;
      attemptsMap.set(d, { count: 0, totalPct: 0 });
    }
    attempts.forEach((a) => {
      const day = a.completedAt.split('T')[0]!;
      if (attemptsMap.has(day)) {
        const item = attemptsMap.get(day)!;
        item.count += 1;
        item.totalPct += a.percentage;
      }
    });

    const attemptsByDay = Array.from(attemptsMap.entries()).map(([date, data]) => ({
      date,
      attempts: data.count,
      avgPercentage: data.count > 0 ? Math.round((data.totalPct / data.count) * 10) / 10 : 0,
    }));

    return delay({
      summary: {
        attempts: attempts.length,
        uniqueStudents,
        avgPercentage,
      },
      attemptsByDay,
      scoreDistribution,
      perChapter,
      difficultyAccuracy,
      topicAccuracy,
      mostMissedQuestions,
    });
  },

  // --- USERS ---
  async getSettings(): Promise<{ showStudentRank: boolean }> {
    return { showStudentRank: true };
  },
  async updateSettings(s: { showStudentRank: boolean }): Promise<{ showStudentRank: boolean }> {
    return s;
  },
  async getUsers(filters?: {
    role?: Role;
    status?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<AdminUser>> {
    let list = [...users];

    if (filters?.role) {
      list = list.filter((u) => u.role === filters.role);
    }
    if (filters?.status) {
      list = list.filter((u) => u.status === filters.status);
    }
    if (filters?.q) {
      const query = filters.q.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.institution.toLowerCase().includes(query)
      );
    }

    return delay(paginate(list, filters?.page, filters?.pageSize));
  },

  async setUserRole(id: number, role: Role): Promise<AdminUser> {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new AdminApiError('User not found', 404);

    const targetUser = users[idx]!;
    if (targetUser.id === 1 && currentDemoRole === 'admin') {
      throw new AdminApiError('Cannot modify your own administrator role.', 422);
    }

    const adminCount = users.filter((u) => u.role === 'admin' && u.status === 'active').length;
    if (targetUser.role === 'admin' && role !== 'admin' && adminCount <= 1) {
      throw new AdminApiError('Cannot demote the last active administrator.', 422);
    }

    const updated: AdminUser = {
      ...targetUser,
      role,
    };
    users[idx] = updated;
    logAudit('update_user_role', 'user', String(id), { role: targetUser.role }, { role });
    return delay(updated);
  },

  async setUserStatus(id: number, status: AdminUser['status']): Promise<AdminUser> {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new AdminApiError('User not found', 404);

    const targetUser = users[idx]!;
    if (targetUser.id === 1) {
      throw new AdminApiError('Cannot suspend your own account.', 422);
    }

    const adminCount = users.filter((u) => u.role === 'admin' && u.status === 'active').length;
    if (targetUser.role === 'admin' && status === 'suspended' && adminCount <= 1) {
      throw new AdminApiError('Cannot suspend the last active administrator.', 422);
    }

    const updated: AdminUser = {
      ...targetUser,
      status,
    };
    users[idx] = updated;
    logAudit('update_user_status', 'user', String(id), { status: targetUser.status }, { status });
    return delay(updated);
  },

  // --- AUDIT LOGS ---
  async getAuditLogs(filters?: {
    entityType?: string;
    action?: string;
    actorId?: number;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<AuditLogEntry>> {
    let list = [...auditLogs];

    if (filters?.entityType) {
      list = list.filter((a) => a.entityType === filters.entityType);
    }
    if (filters?.action) {
      list = list.filter((a) => a.action === filters.action);
    }
    if (filters?.actorId) {
      list = list.filter((a) => a.actor.id === Number(filters.actorId));
    }
    if (filters?.from) {
      list = list.filter((a) => a.timestamp >= filters.from!);
    }
    if (filters?.to) {
      list = list.filter((a) => a.timestamp <= filters.to!);
    }
    if (filters?.q) {
      const query = filters.q.toLowerCase();
      list = list.filter(
        (a) =>
          a.action.toLowerCase().includes(query) ||
          a.actor.name.toLowerCase().includes(query) ||
          a.entityType.toLowerCase().includes(query) ||
          a.entityId.toLowerCase().includes(query)
      );
    }

    return delay(paginate(list, filters?.page, filters?.pageSize));
  },

  // --- UPLOADS ---
  async uploadFile(file: File): Promise<{ url: string }> {
    await delay(null, 400);
    if (file.size > 5 * 1024 * 1024) {
      throw new AdminApiError('File size exceeds the 5 MB limit.', 400);
    }
    const safeName = encodeURIComponent(file.name.replace(/\s+/g, '_'));
    return { url: `/placeholder.svg?name=${safeName}&size=${file.size}` };
  },

  // --- DASHBOARD ---
  async getDashboardStats(): Promise<DashboardStats> {
    const studentUsers = users.filter((u) => u.role === 'student');

    // Counts
    const counts = {
      molecules: molecules.length,
      reactions: reactions.length,
      chapters: chapters.length,
      questions: questions.length,
      students: studentUsers.length,
      quizAttempts: mockStudentAttempts.length,
    };

    // Content statuses
    const content = {
      chapters: {
        published: chapters.filter((c) => c.status === 'published').length,
        draft: chapters.filter((c) => c.status === 'draft').length,
        archived: chapters.filter((c) => c.status === 'archived').length,
      },
      questions: {
        published: questions.filter((q) => q.status === 'published').length,
        draft: questions.filter((q) => q.status === 'draft').length,
        archived: questions.filter((q) => q.status === 'archived').length,
      },
      reactions: {
        published: reactions.filter((r) => r.status === 'published').length,
        draft: reactions.filter((r) => r.status === 'draft').length,
        archived: reactions.filter((r) => r.status === 'archived').length,
      },
      molecules: {
        published: molecules.filter((m) => m.status === 'published').length,
        draft: molecules.filter((m) => m.status === 'draft').length,
        archived: molecules.filter((m) => m.status === 'archived').length,
      },
    };

    // Attempts metrics
    const cutoff7d = new Date(Date.now() - 7 * 86400_000).toISOString();
    const cutoff30d = new Date(Date.now() - 30 * 86400_000).toISOString();
    const attempts7d = mockStudentAttempts.filter((a) => a.completedAt >= cutoff7d);
    const attempts30d = mockStudentAttempts.filter((a) => a.completedAt >= cutoff30d);

    const avgPercentage =
      attempts30d.length > 0
        ? Math.round((attempts30d.reduce((sum, a) => sum + a.percentage, 0) / attempts30d.length) * 10) / 10
        : 0;

    const attempts = {
      last7Days: attempts7d.length,
      last30Days: attempts30d.length,
      avgPercentage,
      activeStudents30d: new Set(attempts30d.map((a) => a.userId)).size,
    };

    // Attempts by day (last 30 days)
    const map = new Map<string, { count: number; totalPct: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().split('T')[0]!;
      map.set(d, { count: 0, totalPct: 0 });
    }
    attempts30d.forEach((a) => {
      const day = a.completedAt.split('T')[0]!;
      if (map.has(day)) {
        const item = map.get(day)!;
        item.count += 1;
        item.totalPct += a.percentage;
      }
    });

    const attemptsByDay = Array.from(map.entries()).map(([date, data]) => ({
      date,
      attempts: data.count,
      avgPercentage: data.count > 0 ? Math.round((data.totalPct / data.count) * 10) / 10 : 0,
    }));

    // Top 5 students from leaderboard
    const lbResponse = await demoAdapter.getLeaderboard({ metric: 'points', period: '30d', limit: 5 });

    // Filter recent activity: admin sees all, staff only sees own
    const recentActivity =
      currentDemoRole === 'admin'
        ? auditLogs.slice(0, 10)
        : auditLogs.filter((a) => a.actor.email === 'staff@chemcurious.org').slice(0, 10);

    return delay({
      counts,
      content,
      attempts,
      attemptsByDay,
      topStudents: lbResponse.data,
      recentActivity,
    });
  },
};
