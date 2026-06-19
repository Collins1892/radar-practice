import { useMemo } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import type { AuditStatus } from '@/api/audits';
import { Badge } from '@/components/Badge';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Pagination } from '@/components/Pagination';
import { SelectField } from '@/components/SelectField';
import {
  STATUS_OPTIONS,
  formatAuditDate,
  formatAuditStatusLabel,
  statusBadgeVariant,
} from '@/components/auditDisplay';
import { AUDIT_CREATE_HEADING } from '@/components/auditPageCopy';
import { useAudits, type AuditRow } from '@/hooks/useAudits';
import { Button } from '@/components/ui/button';

export function AuditsView(): JSX.Element {
  const {
    statusFilter,
    setStatusFilter,
    sortKey,
    sortDirection,
    handleSort,
    page,
    setPage,
    result,
    error,
    reload,
    isInitialLoad,
    isRefetching,
    hasActiveFilters,
    tableData,
  } = useAudits();

  const columns = useMemo(
    () => [
      {
        key: 'title' as const,
        header: 'Title',
        sortable: true,
        render: (value: unknown, row: AuditRow) => (
          <Link
            to={`/audits/${row.id}`}
            className="text-foreground underline underline-offset-4 decoration-muted-foreground"
          >
            {String(value)}
          </Link>
        ),
      },
      {
        key: 'auditDate' as const,
        header: 'Audit date',
        sortable: true,
        render: (value: unknown) => formatAuditDate(String(value)),
      },
      {
        key: 'status' as const,
        header: 'Status',
        sortable: true,
        render: (value: unknown) => (
          <Badge variant={statusBadgeVariant(value as AuditStatus)} size="sm">
            {formatAuditStatusLabel(value as AuditStatus)}
          </Badge>
        ),
      },
      {
        key: 'createdBy' as const,
        header: 'Created by',
        sortable: true,
        render: (value: unknown) => (
          <span className="whitespace-normal">{String(value)}</span>
        ),
      },
    ],
    [],
  );

  const showEmpty =
    !isRefetching &&
    tableData.length === 0 &&
    (error === null || result === null);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1>Audits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clinical quality audits from the Audits API
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/audits/create">{AUDIT_CREATE_HEADING}</Link>
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
          <div className="w-full md:max-w-xs">
            <SelectField
              label="Status"
              id="filter-audit-status"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={STATUS_OPTIONS}
              placeholder="All statuses"
            />
          </div>
        </div>

        {isInitialLoad ? (
          <LoadingState message="Loading audits…" />
        ) : error && result === null ? (
          <ErrorState
            title="Could not load audits"
            message={error}
            onTryAgain={() => void reload()}
          />
        ) : showEmpty ? (
          <EmptyState
            title="No audits found"
            message={
              hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : 'No audits have been created yet.'
            }
          />
        ) : (
          <div className="relative" aria-busy={isRefetching || undefined}>
            {error !== null && result !== null ? (
              <p className="mb-4 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {isRefetching ? (
              <LoadingState variant="overlay" message="Updating audits…" />
            ) : null}
            <DataTable<AuditRow>
              ariaLabel="Audits list, scrollable"
              columns={columns}
              data={tableData}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            {result !== null && result.totalPages > 1 ? (
              <div className="mt-4 flex justify-center md:justify-end">
                <Pagination
                  currentPage={page}
                  totalPages={result.totalPages}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
}
