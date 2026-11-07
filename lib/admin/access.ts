import { getCurrentUser } from '@/lib/admin-auth';
import { IS_ADMIN_MOCK } from './api/client';
import type { Role } from './types';

export interface AdminAccessResult {
  hasAccess: boolean;
  role: Role;
  userId?: number;
  userName?: string;
  reason?: 'not_logged_in' | 'insufficient_role' | 'suspended';
}

/**
 * Server-side guard function to verify administrative permissions.
 * In Phase 2, queries the active session and fresh MySQL user record on every call.
 */
export async function getAdminAccess(): Promise<AdminAccessResult> {
  const { user, error } = await getCurrentUser();

  if (!user || error === 'no_token' || error === 'invalid_token' || error === 'user_not_found') {
    return {
      hasAccess: false,
      role: 'student',
      reason: 'not_logged_in',
    };
  }

  if (user.status === 'suspended') {
    return {
      hasAccess: false,
      role: user.role,
      userId: user.id,
      userName: user.name,
      reason: 'suspended',
    };
  }

  // When demo mock mode is enabled on the client side, provide access for evaluation
  if (IS_ADMIN_MOCK) {
    return {
      hasAccess: true,
      role: user.role === 'student' ? 'admin' : user.role,
      userId: user.id,
      userName: user.name,
    };
  }

  // Real backend role check
  if (user.role === 'student') {
    return {
      hasAccess: false,
      role: 'student',
      userId: user.id,
      userName: user.name,
      reason: 'insufficient_role',
    };
  }

  return {
    hasAccess: true,
    role: user.role,
    userId: user.id,
    userName: user.name,
  };
}
