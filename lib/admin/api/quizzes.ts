import { adminFetch, IS_ADMIN_MOCK } from './client';
import { demoAdapter } from './mock/adapter';
import type {
  Chapter,
  ChapterInput,
  Question,
  QuestionInput,
  BulkImportRequest,
  BulkImportResult,
  Paginated,
  ClassLevel,
  ContentStatus,
  Difficulty,
} from '../types';

export const quizzesApi = {
  // Chapters
  getChapters: async (params?: { classLevel?: ClassLevel; status?: ContentStatus; q?: string }): Promise<{ data: Chapter[] }> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getChapters(params);
    return adminFetch<{ data: Chapter[] }>('/api/admin/quizzes/chapters', { query: params });
  },

  getChapter: async (id: number): Promise<Chapter> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getChapter(id);
    return adminFetch<Chapter>(`/api/admin/quizzes/chapters/${id}`);
  },

  createChapter: async (input: ChapterInput): Promise<Chapter> => {
    if (IS_ADMIN_MOCK) return demoAdapter.createChapter(input);
    return adminFetch<Chapter>('/api/admin/quizzes/chapters', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateChapter: async (id: number, input: ChapterInput): Promise<Chapter> => {
    if (IS_ADMIN_MOCK) return demoAdapter.updateChapter(id, input);
    return adminFetch<Chapter>(`/api/admin/quizzes/chapters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  setChapterStatus: async (id: number, status: ContentStatus): Promise<Chapter> => {
    if (IS_ADMIN_MOCK) return demoAdapter.setChapterStatus(id, status);
    return adminFetch<Chapter>(`/api/admin/quizzes/chapters/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  reorderChapters: async (classLevel: ClassLevel, orderedIds: number[]): Promise<{ success: boolean }> => {
    if (IS_ADMIN_MOCK) return demoAdapter.reorderChapters(classLevel, orderedIds);
    return adminFetch<{ success: boolean }>('/api/admin/quizzes/chapters/reorder', {
      method: 'POST',
      body: JSON.stringify({ classLevel, orderedIds }),
    });
  },

  deleteChapter: async (id: number): Promise<void> => {
    if (IS_ADMIN_MOCK) return demoAdapter.deleteChapter(id);
    return adminFetch<void>(`/api/admin/quizzes/chapters/${id}`, { method: 'DELETE' });
  },

  // Questions
  getQuestions: async (params?: {
    chapterId?: number;
    status?: ContentStatus;
    difficulty?: Difficulty;
    topic?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<Question>> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getQuestions(params);
    return adminFetch<Paginated<Question>>('/api/admin/quizzes/questions', { query: params });
  },

  getQuestion: async (id: number): Promise<Question> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getQuestion(id);
    return adminFetch<Question>(`/api/admin/quizzes/questions/${id}`);
  },

  createQuestion: async (input: QuestionInput): Promise<Question> => {
    if (IS_ADMIN_MOCK) return demoAdapter.createQuestion(input);
    return adminFetch<Question>('/api/admin/quizzes/questions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateQuestion: async (id: number, input: QuestionInput): Promise<Question> => {
    if (IS_ADMIN_MOCK) return demoAdapter.updateQuestion(id, input);
    return adminFetch<Question>(`/api/admin/quizzes/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  setQuestionStatus: async (id: number, status: ContentStatus): Promise<Question> => {
    if (IS_ADMIN_MOCK) return demoAdapter.setQuestionStatus(id, status);
    return adminFetch<Question>(`/api/admin/quizzes/questions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  deleteQuestion: async (id: number): Promise<{ archived: boolean }> => {
    if (IS_ADMIN_MOCK) return demoAdapter.deleteQuestion(id);
    return adminFetch<{ archived: boolean }>(`/api/admin/quizzes/questions/${id}`, { method: 'DELETE' });
  },

  bulkImportQuestions: async (req: BulkImportRequest, dryRun = false): Promise<BulkImportResult> => {
    if (IS_ADMIN_MOCK) return demoAdapter.bulkImportQuestions(req, dryRun);
    return adminFetch<BulkImportResult>(`/api/admin/quizzes/questions/bulk-import?dryRun=${dryRun}`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },
};
