import { adminFetch, IS_ADMIN_MOCK } from './client';
import { demoAdapter } from './mock/adapter';
import type { AdminUser, Role, AccountStatus, Paginated } from '../types';

export const usersApi = {
  getUsers: async (params?: {
    q?: string;
    role?: Role;
    status?: AccountStatus;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<AdminUser>> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getUsers(params);
    return adminFetch<Paginated<AdminUser>>('/api/admin/users', { query: params });
  },

  setUserRole: async (id: number, role: Role): Promise<AdminUser> => {
    if (IS_ADMIN_MOCK) return demoAdapter.setUserRole(id, role);
    return adminFetch<AdminUser>(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  getSettings: async (): Promise<{ showStudentRank: boolean }> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getSettings();
    return adminFetch<{ showStudentRank: boolean }>("/api/admin/users/settings");
  },
  updateSettings: async (settings: { showStudentRank: boolean }): Promise<{ showStudentRank: boolean }> => {
    if (IS_ADMIN_MOCK) return demoAdapter.updateSettings(settings);
    return adminFetch<{ showStudentRank: boolean }>("/api/admin/users/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },
  setUserStatus: async (id: number, status: AccountStatus): Promise<AdminUser> => {
    if (IS_ADMIN_MOCK) return demoAdapter.setUserStatus(id, status);
    return adminFetch<AdminUser>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
