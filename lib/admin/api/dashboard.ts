import { adminFetch, IS_ADMIN_MOCK } from './client';
import { demoAdapter } from './mock/adapter';
import type { DashboardStats, CurrentUser } from '../types';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getDashboardStats();
    return adminFetch<DashboardStats>('/api/admin/dashboard');
  },
  getMe: async (): Promise<CurrentUser> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getMe();
    return adminFetch<CurrentUser>('/api/admin/me');
  },
};
