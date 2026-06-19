import { useCallback, useEffect, useState } from 'react';
import {
  auditUserMessage,
  fetchAudits,
  type Audit,
  type AuditStatus,
  type PagedAuditsResult,
} from '@/api/audits';
import { AUDIT_ALL_FILTER } from '@/components/auditDisplay';

type SortDirection = 'asc' | 'desc';

export type AuditRow = Audit & Record<string, unknown>;

const PAGE_SIZE = 25;

export type UseAuditsResult = {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortKey: string;
  sortDirection: SortDirection;
  handleSort: (key: string, direction: SortDirection) => void;
  page: number;
  setPage: (page: number) => void;
  result: PagedAuditsResult | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  isInitialLoad: boolean;
  isRefetching: boolean;
  hasActiveFilters: boolean;
  tableData: AuditRow[];
};

export function useAudits(): UseAuditsResult {
  const [statusFilter, setStatusFilterState] =
    useState<string>(AUDIT_ALL_FILTER);
  const [sortKey, setSortKey] = useState<string>('auditDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPageState] = useState<number>(1);
  const [result, setResult] = useState<PagedAuditsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchAudits({
        status:
          statusFilter === AUDIT_ALL_FILTER
            ? undefined
            : (statusFilter as AuditStatus),
        sortBy: sortKey,
        sortDirection,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch (err) {
      setError(auditUserMessage(err, 'loading'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortKey, sortDirection, page]);

  // Known: no stale-response guard — rapid filter/sort changes can
  // cause earlier responses to overwrite later ones. Low impact for
  // a single-user app; fix in Week 7 with an active flag or AbortController.
  useEffect(() => {
    void reload();
  }, [reload]);

  const setStatusFilter = useCallback((value: string): void => {
    setStatusFilterState(value);
    setPageState(1);
  }, []);

  const handleSort = useCallback(
    (key: string, direction: SortDirection): void => {
      setSortKey(key);
      setSortDirection(direction);
      setPageState(1);
    },
    [],
  );

  const setPage = useCallback((nextPage: number): void => {
    setPageState(nextPage);
  }, []);

  const hasActiveFilters = statusFilter !== AUDIT_ALL_FILTER;
  const tableData: AuditRow[] = result?.items ?? [];
  const isInitialLoad = loading && result === null && error === null;
  const isRefetching = loading && result !== null;

  return {
    statusFilter,
    setStatusFilter,
    sortKey,
    sortDirection,
    handleSort,
    page,
    setPage,
    result,
    loading,
    error,
    reload,
    isInitialLoad,
    isRefetching,
    hasActiveFilters,
    tableData,
  };
}
