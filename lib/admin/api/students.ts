import { adminFetch, IS_ADMIN_MOCK } from './client';
import { demoAdapter } from './mock/adapter';
import type { StudentSummary, StudentDetail, Paginated, ClassLevel } from '../types';

export const studentsApi = {
  getStudents: async (params?: {
    q?: string;
    classLevel?: ClassLevel;
    institution?: string;
    activeWithin?: 7 | 30;
    sort?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<StudentSummary>> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getStudents(params);
    return adminFetch<Paginated<StudentSummary>>('/api/admin/students', { query: params });
  },

  getStudentDetail: async (id: number): Promise<StudentDetail> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getStudentDetail(id);
    return adminFetch<StudentDetail>(`/api/admin/students/${id}`);
  },
};
