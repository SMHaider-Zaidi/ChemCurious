import {
  LayoutDashboard,
  ClipboardList,
  FlaskConical,
  Atom,
  GraduationCap,
  Trophy,
  BarChart3,
  Users,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  exact?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    title: 'Overview',
    url: '/admin/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: 'Quiz & Curriculum',
    url: '/admin/quizzes',
    icon: ClipboardList,
  },
  {
    title: 'Reactions',
    url: '/admin/reactions',
    icon: FlaskConical,
  },
  {
    title: 'Molecules',
    url: '/admin/molecules',
    icon: Atom,
  },
  {
    title: 'Students',
    url: '/admin/students',
    icon: GraduationCap,
  },
  {
    title: 'Leaderboard',
    url: '/admin/leaderboard',
    icon: Trophy,
  },
  {
    title: 'Analytics',
    url: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Users & Access',
    url: '/admin/users',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'Audit Logs',
    url: '/admin/audit-logs',
    icon: ScrollText,
    adminOnly: true,
  },
];
