import { adminFetch, IS_ADMIN_MOCK } from './client';
import { demoAdapter } from './mock/adapter';
import type { LeaderboardResponse, LeaderboardMetric, ClassLevel } from '../types';

export const leaderboardApi = {
  getLeaderboard: async (params?: {
    metric?: LeaderboardMetric;
    classLevel?: ClassLevel;
    chapterId?: number;
    period?: '7d' | '30d' | 'all';
    institution?: string;
    limit?: number;
  }): Promise<LeaderboardResponse> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getLeaderboard(params);
    return adminFetch<LeaderboardResponse>('/api/admin/leaderboard', { query: params });
  },
};
