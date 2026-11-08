'use client';

import * as React from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { ErrorState } from '@/components/admin/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuditLogs } from '@/lib/admin/hooks';
import { demoAdapter } from '@/lib/admin/api/mock/adapter';
import { IS_ADMIN_MOCK } from '@/lib/admin/api/client';
import type { AuditLogEntry, Role } from '@/lib/admin/types';
import {
  History,
  Search,
  ShieldAlert,
  Shield,
  Eye,
  Calendar,
  User,
  ArrowRight,
  Database,
  Clock,
  Layers,
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [search, setSearch] = React.useState('');
  const [entityFilter, setEntityFilter] = React.useState<string>('all');
  const [actionFilter, setActionFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

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

  // Selected entry for inspection drawer
  const [selectedLog, setSelectedLog] = React.useState<AuditLogEntry | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useAuditLogs({
    q: search || undefined,
    entityType: entityFilter === 'all' ? undefined : entityFilter,
    action: actionFilter === 'all' ? undefined : actionFilter,
    page,
    pageSize,
  });

  // If viewing as Staff, display Staff Access Denied state per specification
  if (activePersonaRole === 'staff') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="System Audit Logs"
          description="Complete chronological timeline of administrative actions"
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
                  Audit trail records are restricted to administrators
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs font-sans text-rose-800 dark:text-rose-300 leading-relaxed">
              You are currently viewing the admin portal with the <strong>Staff</strong> persona. Complete system
              audit records (including user role changes, account suspensions, and raw diffs) are strictly confidential
              and visible only to full system administrators.
            </p>
            <Alert className="bg-background/80 border-border">
              <Shield className="h-4 w-4 text-primary" />
              <AlertTitle className="text-xs font-semibold">Testing tip</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                To test the audit log inspection drawer and filters, switch your persona back to <strong>Admin</strong>{' '}
                using the role switcher in the top right navigation bar.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const logsList = data?.data || [];
  const totalLogs = data?.total || 0;

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (action.includes('delete') || action.includes('suspend')) return 'destructive';
    if (action.includes('create') || action.includes('add')) return 'default';
    if (action.includes('update') || action.includes('role')) return 'secondary';
    return 'outline';
  };

  const columns: Column<AuditLogEntry>[] = [
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      className: 'w-[160px]',
      cell: (row) => {
        const d = new Date(row.timestamp);
        return (
          <div className="space-y-0.5 font-mono text-[11px]">
            <div className="text-foreground font-medium">{d.toLocaleDateString()}</div>
            <div className="text-muted-foreground">{d.toLocaleTimeString()}</div>
          </div>
        );
      },
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: (row) => (
        <Badge variant={getActionBadgeVariant(row.action)} className="text-[11px] font-mono">
          {formatAction(row.action)}
        </Badge>
      ),
    },
    {
      header: 'Actor',
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-foreground">{row.actor.name}</div>
          <div className="text-[11px] text-muted-foreground font-mono">{row.actor.email}</div>
        </div>
      ),
    },
    {
      header: 'Target Entity',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[11px] uppercase tracking-wider font-mono">
            {row.entityType}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground">#{row.entityId}</span>
        </div>
      ),
    },
    {
      header: 'IP Address',
      accessorKey: 'ipAddress',
      className: 'font-mono text-[11px] text-muted-foreground',
      cell: (row) => row.ipAddress || '—',
    },
    {
      header: 'Details',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-sans text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => setSelectedLog(row)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Inspect
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Audit Logs"
        description="Immutable timeline of curriculum edits, user access modifications, and content lifecycle events"
      />

      {isError && (
        <ErrorState
          title="Failed to load audit logs"
          message={error?.message || 'Could not fetch audit events'}
          onRetry={() => refetch()}
        />
      )}

      {/* Filter Bar */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by action, actor, entity type, or target ID..."
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
                value={entityFilter}
                onValueChange={(val) => {
                  setEntityFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="chapter">Chapter</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="reaction">Reaction</SelectItem>
                  <SelectItem value="molecule">Molecule</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={actionFilter}
                onValueChange={(val) => {
                  setActionFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create_question">Create Question</SelectItem>
                  <SelectItem value="update_question">Update Question</SelectItem>
                  <SelectItem value="create_chapter">Create Chapter</SelectItem>
                  <SelectItem value="create_reaction">Create Reaction</SelectItem>
                  <SelectItem value="create_molecule">Create Molecule</SelectItem>
                  <SelectItem value="update_user_role">Update Role</SelectItem>
                  <SelectItem value="update_user_status">Update Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <DataTable
        columns={columns}
        data={logsList}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        total={totalLogs}
        onPageChange={setPage}
        emptyTitle="No audit records found"
        emptyDescription={search ? `No log entries match "${search}".` : 'No audit records in the database.'}
      />

      {/* Detail Inspection Sheet */}
      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-serif text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Audit Event #{selectedLog?.id}
            </SheetTitle>
            <SheetDescription className="text-xs font-sans">
              Recorded at {selectedLog ? new Date(selectedLog.timestamp).toLocaleString() : ''}
            </SheetDescription>
          </SheetHeader>

          {selectedLog && (
            <div className="space-y-6 py-4">
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-border bg-muted/30 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-0.5">Action</span>
                  <Badge variant={getActionBadgeVariant(selectedLog.action)} className="font-mono text-xs">
                    {formatAction(selectedLog.action)}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-0.5">Target</span>
                  <span className="font-mono font-medium">
                    {selectedLog.entityType.toUpperCase()} #{selectedLog.entityId}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-0.5">Actor</span>
                  <span className="font-medium">{selectedLog.actor.name}</span>
                  <span className="block text-[11px] text-muted-foreground font-mono truncate">
                    {selectedLog.actor.email}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-0.5">IP Address</span>
                  <span className="font-mono text-muted-foreground">{selectedLog.ipAddress || '—'}</span>
                </div>
              </div>

              {/* State Diff / Payload Comparison */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payload & State Changes
                </h4>

                <Tabs defaultValue="diff" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="diff" className="text-xs">
                      Comparison
                    </TabsTrigger>
                    <TabsTrigger value="new" className="text-xs">
                      New Value
                    </TabsTrigger>
                    <TabsTrigger value="old" className="text-xs">
                      Old Value
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="diff" className="space-y-3 mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          Previous State (Old)
                        </span>
                        <pre className="p-3 rounded-md bg-muted/60 text-[11px] font-mono overflow-x-auto max-h-[300px] border border-border text-muted-foreground">
                          {selectedLog.oldValue
                            ? JSON.stringify(selectedLog.oldValue, null, 2)
                            : '(None / Initial Creation)'}
                        </pre>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Updated State (New)
                        </span>
                        <pre className="p-3 rounded-md bg-muted/60 text-[11px] font-mono overflow-x-auto max-h-[300px] border border-border text-foreground">
                          {selectedLog.newValue
                            ? JSON.stringify(selectedLog.newValue, null, 2)
                            : '(None / Deleted)'}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="new" className="mt-3">
                    <pre className="p-3 rounded-md bg-muted/60 text-[11px] font-mono overflow-x-auto max-h-[350px] border border-border text-foreground">
                      {JSON.stringify(selectedLog.newValue, null, 2) || '(null)'}
                    </pre>
                  </TabsContent>

                  <TabsContent value="old" className="mt-3">
                    <pre className="p-3 rounded-md bg-muted/60 text-[11px] font-mono overflow-x-auto max-h-[350px] border border-border text-muted-foreground">
                      {JSON.stringify(selectedLog.oldValue, null, 2) || '(null)'}
                    </pre>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedLog(null)}
                >
                  Close Inspection
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
