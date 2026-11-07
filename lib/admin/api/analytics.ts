import { adminFetch, IS_ADMIN_MOCK } from './client';
import { demoAdapter } from './mock/adapter';
import type { QuizAnalytics, ClassLevel } from '../types';

export const analyticsApi = {
  getQuizAnalytics: async (params?: {
    classLevel?: ClassLevel;
    chapterId?: number;
    period?: '7d' | '30d' | 'all';
  }): Promise<QuizAnalytics> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getQuizAnalytics(params);
    return adminFetch<QuizAnalytics>('/api/admin/analytics/quizzes', { query: params });
  },
};
