'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  sortable?: boolean;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor?: (item: T) => number | string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  filters?: ReactNode;
  actions?: ReactNode;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  pageSize?: number;
  page?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  mobileCard?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchFilter,
  filters,
  actions,
  isLoading = false,
  error,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display matching the current criteria.',
  emptyAction,
  pageSize = 10,
  page,
  total,
  onPageChange,
  onRowClick,
  mobileCard,
  className,
}: DataTableProps<T>) {
  const [internalQuery, setInternalQuery] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const isServerPagination = page !== undefined && onPageChange !== undefined;
  const currentPage = isServerPagination ? page : internalPage;
  const setCurrentPage = isServerPagination ? onPageChange : setInternalPage;

  // Filter
  const filteredData = useMemo(() => {
    if (!internalQuery.trim() || !searchFilter) return data;
    return data.filter((item) => searchFilter(item, internalQuery.trim().toLowerCase()));
  }, [data, internalQuery, searchFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDirection]);

  // Total items & Pages
  const totalItems = total !== undefined ? total : sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // In server pagination mode, data is already paginated by backend
  const displayData = useMemo(() => {
    if (isServerPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [isServerPagination, sortedData, currentPage, pageSize]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getRowKey = (row: T, index: number): number | string => {
    if (keyExtractor) return keyExtractor(row);
    if ('id' in row && (typeof row.id === 'string' || typeof row.id === 'number')) {
      return row.id;
    }
    if ('userId' in row && (typeof row.userId === 'string' || typeof row.userId === 'number')) {
      return row.userId;
    }
    return index;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top Controls: Search, Filters, Actions */}
      {Boolean(searchFilter || filters || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            {searchFilter && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={internalQuery}
                  onChange={(e) => {
                    setInternalQuery(e.target.value);
                    if (!isServerPagination) setInternalPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  className="pl-9 text-sm"
                />
              </div>
            )}
            {filters}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Error state */}
      {Boolean(error) && !isLoading && <ErrorState error={error} onRetry={onRetry} />}

      {/* Main Content */}
      {!error && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/70">
                    {columns.map((col, idx) => (
                      <TableHead
                        key={idx}
                        className={cn(
                          'font-semibold text-xs tracking-wider uppercase text-muted-foreground whitespace-nowrap',
                          col.sortable && 'cursor-pointer select-none hover:text-foreground',
                          col.headerClassName
                        )}
                        onClick={col.sortable ? () => handleSort(col.accessorKey) : undefined}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.header}</span>
                          {col.sortable && (
                            <span className="text-muted-foreground/60">
                              {sortKey === col.accessorKey ? (
                                sortDirection === 'asc' ? (
                                  <ArrowUp className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <ArrowDown className="h-3.5 w-3.5 text-primary" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: pageSize }).map((_, rIdx) => (
                      <TableRow key={rIdx}>
                        {columns.map((_, cIdx) => (
                          <TableCell key={cIdx} className="py-4">
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : displayData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-48 text-center">
                        <EmptyState
                          title={emptyTitle}
                          description={emptyDescription}
                          action={emptyAction}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayData.map((row, rIdx) => (
                      <TableRow
                        key={getRowKey(row, rIdx)}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={cn(
                          'transition-colors',
                          onRowClick && 'cursor-pointer hover:bg-muted/40'
                        )}
                      >
                        {columns.map((col, cIdx) => (
                          <TableCell key={cIdx} className={cn('py-3.5', col.className)}>
                            {col.cell(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : displayData.length === 0 ? (
              <div className="p-6 rounded-xl border border-border bg-card text-center">
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  action={emptyAction}
                />
              </div>
            ) : (
              displayData.map((row, rIdx) =>
                mobileCard ? (
                  <div
                    key={getRowKey(row, rIdx)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {mobileCard(row)}
                  </div>
                ) : (
                  <div
                    key={getRowKey(row, rIdx)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2.5"
                  >
                    {columns.map((col, cIdx) => (
                      <div key={cIdx} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">{col.header}:</span>
                        <span>{col.cell(row)}</span>
                      </div>
                    ))}
                  </div>
                )
              )
            )}
          </div>

          {/* Pagination Footer */}
          {!isLoading && totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
              <div>
                Showing{' '}
                <span className="font-semibold text-foreground">
                  {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-foreground">
                  {Math.min(totalItems, currentPage * pageSize)}
                </span>{' '}
                of <span className="font-semibold text-foreground">{totalItems}</span> records
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>
                  <span className="px-2 text-xs font-mono font-medium text-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
