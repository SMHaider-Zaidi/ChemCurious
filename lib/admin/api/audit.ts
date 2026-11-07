import { adminFetch, IS_ADMIN_MOCK } from './client';
import { demoAdapter } from './mock/adapter';
import type { AuditLogEntry, Paginated } from '../types';

export const auditApi = {
  getAuditLogs: async (params?: {
    entityType?: string;
    action?: string;
    actorId?: number;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<AuditLogEntry>> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getAuditLogs(params);
    return adminFetch<Paginated<AuditLogEntry>>('/api/admin/audit-logs', { query: params });
  },
};
