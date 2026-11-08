import { getCurrentUser } from '@/lib/admin-auth';
import type { Role } from './types';

export interface AdminAccessResult {
  hasAccess: boolean;
  role: Role;
  userId?: number;
  userName?: string;
  userEmail?: string;
  reason?: 'not_logged_in' | 'insufficient_role' | 'suspended';
}

/**
 * Server-side guard function to verify administrative permissions.
 * Queries the active session and fresh MySQL user record on every call.
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
      userEmail: user.email,
      reason: 'suspended',
    };
  }

  // Strict role check: Only admin and staff have administrative access
  if (user.role !== 'admin' && user.role !== 'staff') {
    return {
      hasAccess: false,
      role: 'student',
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      reason: 'insufficient_role',
    };
  }

  return {
    hasAccess: true,
    role: user.role,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
  };
}
