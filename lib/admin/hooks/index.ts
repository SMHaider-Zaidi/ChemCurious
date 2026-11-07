'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminKeys } from './keys';
import { dashboardApi } from '../api/dashboard';
import { quizzesApi } from '../api/quizzes';
import { reactionsApi } from '../api/reactions';
import { moleculesApi } from '../api/molecules';
import { studentsApi } from '../api/students';
import { leaderboardApi } from '../api/leaderboard';
import { analyticsApi } from '../api/analytics';
import { usersApi } from '../api/users';
import { auditApi } from '../api/audit';
import type {
  ChapterInput,
  QuestionInput,
  ReactionInput,
  MoleculeInput,
  BulkImportRequest,
  ContentStatus,
  ClassLevel,
  Difficulty,
  Role,
  AccountStatus,
  LeaderboardMetric,
} from '../types';

export * from './keys';

// --- AUTH & ME ---
export function useAdminMe() {
  return useQuery({
    queryKey: adminKeys.me,
    queryFn: dashboardApi.getMe,
    staleTime: 5 * 60 * 1000,
  });
}

// --- DASHBOARD ---
export function useDashboardStats() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: dashboardApi.getStats,
    staleTime: 60 * 1000,
  });
}

// --- CHAPTERS ---
export function useChapters(filters?: { classLevel?: ClassLevel; status?: ContentStatus; q?: string }) {
  return useQuery({
    queryKey: adminKeys.chapters(filters),
    queryFn: () => quizzesApi.getChapters(filters),
    staleTime: 30 * 1000,
  });
}

export function useChapter(id: number) {
  return useQuery({
    queryKey: adminKeys.chapter(id),
    queryFn: () => quizzesApi.getChapter(id),
    enabled: id > 0,
    staleTime: 30 * 1000,
  });
}

export function useChapterMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: ChapterInput) => quizzesApi.createChapter(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'chapters'] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success(`Chapter "${data.title}" created successfully`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create chapter');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: ChapterInput }) =>
      quizzesApi.updateChapter(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'chapters'] });
      qc.invalidateQueries({ queryKey: adminKeys.chapter(data.id) });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success(`Chapter "${data.title}" updated`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update chapter');
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContentStatus }) =>
      quizzesApi.setChapterStatus(id, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'chapters'] });
      qc.invalidateQueries({ queryKey: adminKeys.chapter(data.id) });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success(`Chapter status updated to ${data.status}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to change chapter status');
    },
  });

  const reorder = useMutation({
    mutationFn: ({ classLevel, orderedIds }: { classLevel: ClassLevel; orderedIds: number[] }) =>
      quizzesApi.reorderChapters(classLevel, orderedIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'chapters'] });
      toast.success('Chapter order updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to reorder chapters');
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => quizzesApi.deleteChapter(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'chapters'] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success('Chapter deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete chapter');
    },
  });

  return { create, update, setStatus, reorder, remove };
}

// --- QUESTIONS ---
export function useQuestions(filters?: {
  chapterId?: number;
  status?: ContentStatus;
  difficulty?: Difficulty;
  topic?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: adminKeys.questions(filters),
    queryFn: () => quizzesApi.getQuestions(filters),
    staleTime: 30 * 1000,
  });
}

export function useQuestion(id: number) {
  return useQuery({
    queryKey: adminKeys.question(id),
    queryFn: () => quizzesApi.getQuestion(id),
    enabled: id > 0,
    staleTime: 30 * 1000,
  });
}

export function useQuestionMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: QuestionInput) => quizzesApi.createQuestion(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
      qc.invalidateQueries({ queryKey: ['admin', 'chapters'] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success('Question created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create question');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: QuestionInput }) =>
      quizzesApi.updateQuestion(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
      qc.invalidateQueries({ queryKey: adminKeys.question(data.id) });
      qc.invalidateQueries({ queryKey: ['admin', 'chapters'] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success('Question updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update question');
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContentStatus }) =>
      quizzesApi.setQuestionStatus(id, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
      qc.invalidateQueries({ queryKey: adminKeys.question(data.id) });
      qc.invalidateQueries({ queryKey: ['admin', 'chapters'] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success(`Question status changed to ${data.status}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update question status');
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => quizzesApi.deleteQuestion(id),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
      qc.invalidateQueries({ queryKey: ['admin', 'chapters'] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      if (result.archived) {
        toast.info('Question has prior attempts, archived instead of deleted');
      } else {
        toast.success('Question deleted');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete question');
    },
  });

  const bulkImport = useMutation({
    mutationFn: ({ req, dryRun }: { req: BulkImportRequest; dryRun?: boolean }) =>
      quizzesApi.bulkImportQuestions(req, dryRun),
    onSuccess: (res) => {
      if (!res.dryRun && res.inserted > 0) {
        qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
        qc.invalidateQueries({ queryKey: ['admin', 'chapters'] });
        qc.invalidateQueries({ queryKey: adminKeys.dashboard });
        toast.success(`Imported ${res.inserted} question(s) as drafts`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Bulk import failed');
    },
  });

  return { create, update, setStatus, remove, bulkImport };
}

// --- REACTIONS ---
export function useReactions(filters?: {
  q?: string;
  category?: 'organic' | 'inorganic';
  status?: ContentStatus;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: adminKeys.reactions(filters),
    queryFn: () => reactionsApi.getReactions(filters),
    staleTime: 30 * 1000,
  });
}

export function useReaction(id: number) {
  return useQuery({
    queryKey: adminKeys.reaction(id),
    queryFn: () => reactionsApi.getReaction(id),
    enabled: id > 0,
    staleTime: 30 * 1000,
  });
}

export function useReactionMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: ReactionInput) => reactionsApi.createReaction(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'reactions'] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success(`Reaction "${data.name}" created`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create reaction');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: ReactionInput }) =>
      reactionsApi.updateReaction(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'reactions'] });
      qc.invalidateQueries({ queryKey: adminKeys.reaction(data.id) });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success(`Reaction "${data.name}" updated`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update reaction');
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContentStatus }) =>
      reactionsApi.setReactionStatus(id, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'reactions'] });
      qc.invalidateQueries({ queryKey: adminKeys.reaction(data.id) });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success(`Reaction status changed to ${data.status}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update reaction status');
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => reactionsApi.deleteReaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reactions'] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success('Reaction deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete reaction');
    },
  });

  return { create, update, setStatus, remove };
}

// --- MOLECULES ---
export function useMolecules(filters?: {
  q?: string;
  category?: string;
  status?: ContentStatus;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: adminKeys.molecules(filters),
    queryFn: () => moleculesApi.getMolecules(filters),
    staleTime: 30 * 1000,
  });
}

export function useMolecule(id: number) {
  return useQuery({
    queryKey: adminKeys.molecule(id),
    queryFn: () => moleculesApi.getMolecule(id),
    enabled: id > 0,
    staleTime: 30 * 1000,
  });
}

export function useMoleculeMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: MoleculeInput) => moleculesApi.createMolecule(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'molecules'] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success(`Molecule "${data.name}" added`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create molecule');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: MoleculeInput }) =>
      moleculesApi.updateMolecule(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'molecules'] });
      qc.invalidateQueries({ queryKey: adminKeys.molecule(data.id) });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success(`Molecule "${data.name}" updated`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update molecule');
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContentStatus }) =>
      moleculesApi.setMoleculeStatus(id, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'molecules'] });
      qc.invalidateQueries({ queryKey: adminKeys.molecule(data.id) });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success(`Molecule status updated to ${data.status}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update molecule status');
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => moleculesApi.deleteMolecule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'molecules'] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success('Molecule deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete molecule');
    },
  });

  return { create, update, setStatus, remove };
}

// --- STUDENTS ---
export function useStudents(filters?: {
  q?: string;
  classLevel?: ClassLevel;
  institution?: string;
  activeWithin?: 7 | 30;
  sort?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: adminKeys.students(filters),
    queryFn: () => studentsApi.getStudents(filters),
    staleTime: 30 * 1000,
  });
}

export function useStudentDetail(id: number) {
  return useQuery({
    queryKey: adminKeys.student(id),
    queryFn: () => studentsApi.getStudentDetail(id),
    enabled: id > 0,
    staleTime: 30 * 1000,
  });
}

// --- LEADERBOARD ---
export function useLeaderboard(params?: {
  metric?: LeaderboardMetric;
  classLevel?: ClassLevel;
  chapterId?: number;
  period?: '7d' | '30d' | 'all';
  institution?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminKeys.leaderboard(params),
    queryFn: () => leaderboardApi.getLeaderboard(params),
    staleTime: 30 * 1000,
  });
}

// --- ANALYTICS ---
export function useQuizAnalytics(params?: {
  classLevel?: ClassLevel;
  chapterId?: number;
  period?: '7d' | '30d' | 'all';
}) {
  return useQuery({
    queryKey: adminKeys.analytics(params),
    queryFn: () => analyticsApi.getQuizAnalytics(params),
    staleTime: 30 * 1000,
  });
}

// --- USERS & ACCESS ---
export function useAdminUsers(filters?: {
  q?: string;
  role?: Role;
  status?: AccountStatus;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: () => usersApi.getUsers(filters),
    staleTime: 30 * 1000,
  });
}

export function useUserMutations() {
  const qc = useQueryClient();

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => usersApi.setUserRole(id, role),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`Role for ${data.name} updated to ${data.role}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to change role');
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AccountStatus }) =>
      usersApi.setUserStatus(id, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`Account for ${data.name} is now ${data.status}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to change account status');
    },
  });

  return { setRole, setStatus };
}

// --- AUDIT LOGS ---
export function useAuditLogs(filters?: {
  entityType?: string;
  action?: string;
  actorId?: number;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: adminKeys.auditLogs(filters),
    queryFn: () => auditApi.getAuditLogs(filters),
    staleTime: 15 * 1000,
  });
}
