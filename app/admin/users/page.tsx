'use client';

import * as React from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { RoleBadge, StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ErrorState } from '@/components/admin/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAdminUsers, useUserMutations, useSystemSettings, useUpdateSettings, useAdminMe } from '@/lib/admin/hooks';
import { demoAdapter } from '@/lib/admin/api/mock/adapter';
import { IS_ADMIN_MOCK } from '@/lib/admin/api/client';
import type { AdminUser, Role, AccountStatus } from '@/lib/admin/types';
import {
  ShieldAlert,
  Search,
  UserCheck,
  Shield,
  UserX,
  Edit2,
  Lock,
  AlertTriangle,
  Users,
  Trophy,
} from 'lucide-react';

export default function AdminUsersPage() {
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<Role | 'all'>('all');
  const [statusFilter, setStatusFilter] = React.useState<AccountStatus | 'all'>('all');
  const [page, setPage] = React.useState(1);
  const pageSize = 15;

  // Track active persona in demo mode
  const [activePersonaRole, setActivePersonaRole] = React.useState<Role>(
    IS_ADMIN_MOCK ? demoAdapter.getRole() : 'admin'
  );

  React.useEffect(() => {
    if (IS_ADMIN_MOCK) {
      const current = demoAdapter.getRole();
      setActivePersonaRole(current);
    }
  }, []);

  // Selected user for editing
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<Role>('student');
  const [selectedStatus, setSelectedStatus] = React.useState<AccountStatus>('active');

  // Confirmation state for critical actions (suspension / role demotion)
  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'default' | 'destructive';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    variant: 'destructive',
    action: async () => {},
  });

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminUsers({
    q: search || undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    pageSize,
  });

  const { setRole, setStatus } = useUserMutations();
  const { data: me } = useAdminMe();
  const { data: settingsData, isLoading: settingsLoading } = useSystemSettings();
  const updateSettings = useUpdateSettings();

  const isSelf = editingUser ? editingUser.id === (me?.id ?? 1) : false;
  const isRankVisible = settingsData?.showStudentRank ?? true;

  const handleToggleRank = (checked: boolean) => {
    updateSettings.mutate({ showStudentRank: checked });
  };

  // If viewing as Staff, display Staff Access Denied state per specification
  if (activePersonaRole === 'staff') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Users & Access Control"
          description="Manage portal accounts, assign staff or administrator privileges"
        />
        <Card className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-serif text-lg font-semibold text-rose-900 dark:text-rose-200">
                  Administrator Privileges Required
                </CardTitle>
                <CardDescription className="text-xs text-rose-700/80 dark:text-rose-400">
                  User and role management is restricted to full administrators
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs font-sans text-rose-800 dark:text-rose-300 leading-relaxed">
              You are currently viewing the admin portal with the <strong>Staff</strong> persona. Staff members
              can create and edit quizzes, reactions, and molecules, but cannot inspect or modify system user accounts,
              privileges, or access tokens.
            </p>
            <Alert className="bg-background/80 border-border">
              <Shield className="h-4 w-4 text-primary" />
              <AlertTitle className="text-xs font-semibold">Testing tip</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                To test user management, switch your persona back to <strong>Admin</strong> using the role switcher
                in the top right navigation bar.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usersList = data?.data || [];
  const totalUsers = data?.total || 0;

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setSelectedStatus(user.status);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    const roleChanged = selectedRole !== editingUser.role;
    const statusChanged = selectedStatus !== editingUser.status;

    if (!roleChanged && !statusChanged) {
      setEditingUser(null);
      return;
    }

    // If changing role to lower, or suspending, prompt confirmation
    if (statusChanged && selectedStatus === 'suspended') {
      setConfirmDialog({
        isOpen: true,
        title: `Suspend ${editingUser.name}?`,
        description: `Suspending this account will immediately revoke all portal access and invalidate active sessions.`,
        confirmText: 'Suspend Account',
        variant: 'destructive',
        action: async () => {
          if (roleChanged) await setRole.mutateAsync({ id: editingUser.id, role: selectedRole });
          await setStatus.mutateAsync({ id: editingUser.id, status: 'suspended' });
          setEditingUser(null);
        },
      });
      return;
    }

    if (roleChanged && editingUser.role === 'admin' && selectedRole !== 'admin') {
      setConfirmDialog({
        isOpen: true,
        title: `Demote Administrator ${editingUser.name}?`,
        description: `Are you sure you want to change this user from Admin to ${selectedRole.toUpperCase()}? They will lose access to user administration and audit records.`,
        confirmText: 'Demote User',
        variant: 'destructive',
        action: async () => {
          await setRole.mutateAsync({ id: editingUser.id, role: selectedRole });
          if (statusChanged) await setStatus.mutateAsync({ id: editingUser.id, status: selectedStatus });
          setEditingUser(null);
        },
      });
      return;
    }

    // Normal save
    if (roleChanged) await setRole.mutateAsync({ id: editingUser.id, role: selectedRole });
    if (statusChanged) await setStatus.mutateAsync({ id: editingUser.id, status: selectedStatus });
    setEditingUser(null);
  };

  const columns: Column<AdminUser>[] = [
    {
      header: 'User',
      accessorKey: 'name',
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="font-medium text-xs text-foreground flex items-center gap-1.5">
            {row.name}
            {row.id === (me?.id ?? 1) && (
              <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.2 rounded font-normal">
                You
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Institution',
      accessorKey: 'institution',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.institution || '—'}</span>,
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: (row) => <RoleBadge role={row.role} />,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Created',
      accessorKey: 'createdAt',
      cell: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Last Login',
      accessorKey: 'lastLoginAt',
      cell: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => {
        const isSelf = row.id === 1;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs font-sans text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => handleOpenEdit(row)}
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              Manage
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Access Control"
        description="Manage portal accounts, assign staff or administrator privileges, and oversee account access"
      />

      {/* Learner Access & Ranking Control Card */}
      <Card className="rounded-xl border border-border shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-foreground">
                    Display Overall Rank on Student Profiles
                  </h3>
                  <Badge
                    variant="outline"
                    className={
                      isRankVisible
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]"
                        : "bg-muted text-muted-foreground border-border text-[10px]"
                    }
                  >
                    {isRankVisible ? "Visible" : "Hidden"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Allow students to view their leaderboard rank, standing among cohort, and mastery points on their dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
              <Switch
                id="rank-visibility-toggle"
                checked={isRankVisible}
                disabled={settingsLoading || updateSettings.isPending}
                onCheckedChange={handleToggleRank}
              />
              <Label
                htmlFor="rank-visibility-toggle"
                className="text-xs font-medium cursor-pointer select-none"
              >
                {isRankVisible ? "Enabled" : "Disabled"}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <ErrorState
          title="Failed to load users"
          message={error?.message || 'Could not fetch user accounts'}
          onRetry={() => refetch()}
        />
      )}

      {/* Filter and Search Bar */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or institution..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={roleFilter}
                onValueChange={(val) => {
                  setRoleFilter(val as Role | 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val as AccountStatus | 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={usersList}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        total={totalUsers}
        onPageChange={setPage}
        emptyTitle="No users found"
        emptyDescription={search ? `No accounts matched "${search}".` : 'No accounts in the system.'}
      />

      {/* Edit Role / Status Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Manage User Access
            </DialogTitle>
            <DialogDescription className="text-xs font-sans">
              Update access roles and account status for <strong>{editingUser?.name}</strong> (
              <span className="font-mono">{editingUser?.email}</span>).
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-2">
              {isSelf && (
                <Alert className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-xs font-semibold">Self Account Protected</AlertTitle>
                  <AlertDescription className="text-xs">
                    You cannot change your own administrator role or suspend your own account.
                  </AlertDescription>
                </Alert>
              )}

              {/* Role Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Portal Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setSelectedRole(val as Role)}
                  disabled={isSelf}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student" className="text-xs">
                      Student (standard learner access)
                    </SelectItem>
                    <SelectItem value="staff" className="text-xs">
                      Staff (curriculum & content editor)
                    </SelectItem>
                    <SelectItem value="admin" className="text-xs">
                      Admin (full system & user management)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {selectedRole === 'admin'
                    ? 'Admins have unrestricted control over curriculum, users, and audit logs.'
                    : selectedRole === 'staff'
                      ? 'Staff can author questions, reactions, and molecules, but cannot manage users.'
                      : 'Students can only view published materials and attempt quizzes.'}
                </p>
              </div>

              {/* Account Status Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Account Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => setSelectedStatus(val as AccountStatus)}
                  disabled={editingUser.id === 1}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xs">
                      Active (standard access enabled)
                    </SelectItem>
                    <SelectItem value="suspended" className="text-xs text-rose-600">
                      Suspended (login and access blocked)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs"
              disabled={isSelf || setRole.isPending || setStatus.isPending}
              onClick={handleSaveUser}
            >
              {setRole.isPending || setStatus.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
