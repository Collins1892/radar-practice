import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { format, isValid, parseISO } from 'date-fns';
import {
  fetchIncidents,
  incidentUserMessage,
  type Incident,
  type IncidentSeverity,
  type IncidentStatus,
  type PagedIncidentsResult,
} from '@/api/incidents';
import { Badge } from '@/components/Badge';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Pagination } from '@/components/Pagination';
import { SelectField } from '@/components/SelectField';
import { Button } from '@/components/ui/button';

type SortDirection = 'asc' | 'desc';

type IncidentRow = Incident & Record<string, unknown>;

const PAGE_SIZE = 25;

const ALL_FILTER = 'all';

const SEVERITY_OPTIONS = [
  { value: ALL_FILTER, label: 'All severities' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

const STATUS_OPTIONS = [
  { value: ALL_FILTER, label: 'All statuses' },
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' },
];

function severityBadgeVariant(
  severity: IncidentSeverity,
): 'default' | 'info' | 'warning' | 'danger' {
  switch (severity) {
    case 'Low':
      return 'default';
    case 'Medium':
      return 'info';
    case 'High':
      return 'warning';
    case 'Critical':
      return 'danger';
  }
}

function statusBadgeVariant(
  status: IncidentStatus,
): 'default' | 'info' | 'warning' | 'success' {
  switch (status) {
    case 'Open':
      return 'info';
    case 'InProgress':
      return 'warning';
    case 'Resolved':
      return 'success';
    case 'Closed':
      return 'default';
  }
}

function formatStatusLabel(status: IncidentStatus): string {
  switch (status) {
    case 'InProgress':
      return 'In Progress';
    default:
      return status;
  }
}

function formatReportedDate(value: string): string {
  const parsed = parseISO(value.slice(0, 10));
  return isValid(parsed) ? format(parsed, 'dd MMM yyyy') : String(value);
}

export function IncidentsView(): JSX.Element {
  const [severityFilter, setSeverityFilter] = useState<string>(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [sortKey, setSortKey] = useState<string>('reportedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState<number>(1);
  const [result, setResult] = useState<PagedIncidentsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadIncidents = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchIncidents({
        severity:
          severityFilter === ALL_FILTER
            ? undefined
            : (severityFilter as IncidentSeverity),
        status:
          statusFilter === ALL_FILTER
            ? undefined
            : (statusFilter as IncidentStatus),
        sortBy: sortKey,
        sortDirection,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch (err) {
      setError(incidentUserMessage(err, 'loading'));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter, sortKey, sortDirection, page]);

  // Known: no stale-response guard — rapid filter/sort changes can
  // cause earlier responses to overwrite later ones. Low impact for
  // a single-user app; fix in Week 7 with an active flag or AbortController.
  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const handleSeverityChange = (value: string): void => {
    setSeverityFilter(value);
    setPage(1);
  };

  const handleStatusChange = (value: string): void => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSort = (key: string, direction: SortDirection): void => {
    setSortKey(key);
    setSortDirection(direction);
    setPage(1);
  };

  const hasActiveFilters =
    severityFilter !== ALL_FILTER || statusFilter !== ALL_FILTER;

  const columns = useMemo(
    () => [
      {
        key: 'title' as const,
        header: 'Title',
        sortable: true,
        render: (value: unknown, row: IncidentRow) => (
          <Link
            to={`/incidents/${row.id}`}
            className="text-foreground underline underline-offset-4 decoration-muted-foreground"
          >
            {String(value)}
          </Link>
        ),
      },
      {
        key: 'description' as const,
        header: 'Description',
        render: (value: unknown) => (
          <span className="whitespace-normal">{String(value)}</span>
        ),
      },
      {
        key: 'severity' as const,
        header: 'Severity',
        sortable: true,
        render: (value: unknown) => (
          <Badge
            variant={severityBadgeVariant(value as IncidentSeverity)}
            size="sm"
          >
            {String(value)}
          </Badge>
        ),
      },
      {
        key: 'status' as const,
        header: 'Status',
        sortable: true,
        render: (value: unknown) => (
          <Badge
            variant={statusBadgeVariant(value as IncidentStatus)}
            size="sm"
          >
            {formatStatusLabel(value as IncidentStatus)}
          </Badge>
        ),
      },
      {
        key: 'reportedDate' as const,
        header: 'Reported date',
        sortable: true,
        render: (value: unknown) => formatReportedDate(String(value)),
      },
      { key: 'location' as const, header: 'Location' },
    ],
    [],
  );

  const tableData: IncidentRow[] = result?.items ?? [];

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1>Incidents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Incident reports from the Incidents API
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/incidents/create">Create incident</Link>
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
          <div className="w-full md:max-w-xs">
            <SelectField
              label="Severity"
              id="filter-severity"
              value={severityFilter}
              onValueChange={handleSeverityChange}
              options={SEVERITY_OPTIONS}
              placeholder="All severities"
            />
          </div>
          <div className="w-full md:max-w-xs">
            <SelectField
              label="Status"
              id="filter-status"
              value={statusFilter}
              onValueChange={handleStatusChange}
              options={STATUS_OPTIONS}
              placeholder="All statuses"
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading incidents…" />
        ) : error ? (
          <ErrorState
            title="Could not load incidents"
            message={error}
            onTryAgain={() => void loadIncidents()}
          />
        ) : tableData.length === 0 ? (
          <EmptyState
            title="No incidents found"
            message={
              hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : 'No incidents have been reported yet.'
            }
          />
        ) : (
          <>
            <DataTable<IncidentRow>
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
          </>
        )}
      </section>
    </>
  );
}
