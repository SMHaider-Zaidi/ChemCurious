'use client';

import { useState, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  ExternalLink,
  User,
  LogOut,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAuth } from '@/contexts/auth-context';
import { useAdminMe } from '@/lib/admin/hooks';
import { AdminThemeToggle } from './AdminThemeToggle';
import { RoleBadge } from './StatusBadge';
import { ADMIN_NAV_ITEMS } from '@/lib/admin/modules';
import { IS_ADMIN_MOCK } from '@/lib/admin/api/client';
import { demoAdapter } from '@/lib/admin/api/mock/adapter';
import type { Role } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

interface AdminShellProps {
  children: ReactNode;
  initialRole?: Role;
  initialName?: string;
  initialEmail?: string;
}

export function AdminShell({
  children,
  initialRole = 'admin',
  initialName,
  initialEmail,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: adminMe } = useAdminMe();
  const activeRole = adminMe?.role || initialRole || 'admin';
  const activeName = adminMe?.name || initialName || user?.name || 'Administrator';
  const activeEmail = adminMe?.email || initialEmail || user?.email || '';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoRole, setDemoRole] = useState<Role>(initialRole);

  const isAdmin = demoRole === 'admin';

  // Handle demo role switching
  const handleRoleChange = (newRole: Role) => {
    setDemoRole(newRole);
    if (IS_ADMIN_MOCK) {
      demoAdapter.setRole(newRole);
      router.refresh();
    }
  };

  // Breadcrumbs calculation
  const breadcrumbSegments = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    const crumbs = [];

    let accumulatedPath = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      accumulatedPath += `/${part}`;

      let label = part;
      if (part === 'admin') label = 'Admin';
      else if (part === 'dashboard') label = 'Overview';
      else if (part === 'quizzes') label = 'Quiz & Curriculum';
      else if (part === 'chapters') label = 'Chapters';
      else if (part === 'questions') label = 'Questions';
      else if (part === 'reactions') label = 'Reactions';
      else if (part === 'molecules') label = 'Molecules';
      else if (part === 'students') label = 'Students';
      else if (part === 'leaderboard') label = 'Leaderboard';
      else if (part === 'analytics') label = 'Analytics';
      else if (part === 'users') label = 'Users & Access';
      else if (part === 'audit-logs') label = 'Audit Logs';
      else if (part === 'new') label = 'Create New';
      else if (/^\d+$/.test(part)) label = `#${part}`;

      crumbs.push({
        path: accumulatedPath,
        label,
        isLast: i === parts.length - 1,
      });
    }

    return crumbs;
  }, [pathname]);

  const navContent = (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6">
        {/* Brand Logo header */}
        <div className="flex h-16 items-center px-5 border-b border-sidebar-border bg-sidebar">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/ChemCurious_logo_HD.png"
              alt="ChemCurious Portal"
              width={140}
              height={38}
              priority
              className="h-9 w-auto object-contain"
            />
            <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-primary uppercase">
              Admin
            </span>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="px-3 space-y-1" aria-label="Admin Navigation">
          {ADMIN_NAV_ITEMS.map((item) => {
            // Note: In Phase 2, security is strictly enforced on the server APIs;
            // hiding here is for clean UX presentation for staff roles.
            if (item.adminOnly && !isAdmin) {
              return null;
            }

            const isActive = item.exact
              ? pathname === item.url
              : pathname === item.url || pathname.startsWith(`${item.url}/`);

            const Icon = item.icon;

            return (
              <Link
                key={item.url}
                href={item.url}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.title}</span>
                {item.adminOnly && (
                  <span className="ml-auto rounded border border-sidebar-border px-1 py-0.2 text-[9px] uppercase tracking-wider text-muted-foreground/80 font-mono">
                    Admin
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar bottom section */}
      <div className="p-4 border-t border-sidebar-border space-y-2 bg-sidebar">
        <Link
          href="/"
          className="flex items-center justify-between rounded-lg border border-sidebar-border px-3 py-2 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            Back to Student Site
          </span>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar shrink-0">
        {navContent}
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin Navigation</SheetTitle>
          </SheetHeader>
          {navContent}
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top persistent Demo Mode banner */}
        {IS_ADMIN_MOCK && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Demo mode active</strong> — changes are kept in-memory and will not persist to the database.
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[11px] opacity-80">Testing role:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 text-xs px-2 py-0 bg-background/80">
                    {demoRole === 'admin' ? (
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-secondary">
                        <Shield className="h-3 w-3" /> Staff
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuLabel>Switch Demo Persona</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={demoRole} onValueChange={(val) => handleRoleChange(val as Role)}>
                    <DropdownMenuRadioItem value="admin">Administrator (All Access)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="staff">Staff Member (Content Only)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Global Portal Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/85 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(true)}
              aria-label="Open mobile navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                {breadcrumbSegments.map((crumb) => (
                  <span key={crumb.path} className="inline-flex items-center gap-1.5">
                    <BreadcrumbItem>
                      {crumb.isLast ? (
                        <BreadcrumbPage className="font-semibold text-foreground text-xs sm:text-sm">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={crumb.path}
                          className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!crumb.isLast && <BreadcrumbSeparator />}
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {/* Role Badge */}
            <RoleBadge role={IS_ADMIN_MOCK ? demoRole : activeRole} />

            {/* Theme Switcher */}
            <AdminThemeToggle />

            {/* User Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9 border-border/80 text-xs sm:text-sm px-2.5"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden md:inline font-medium">
                    {activeName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">
                      {activeName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {activeEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    <span>Student Website</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => { await logout(); window.location.href = '/auth?portal=admin'; }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
