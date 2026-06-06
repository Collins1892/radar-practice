import * as React from 'react';

type SortDirection = 'asc' | 'desc';

type DataTableColumn<T extends Record<string, unknown>> = {
  key: Extract<keyof T, string>;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
};

/**
 * At least one column should be sortable or render an interactive cell (e.g. a
 * link or button) so the scroll region remains keyboard-accessible. Without a
 * focusable descendant, an overflowing table would be unreachable by keyboard.
 */
type DataTableProps<T extends Record<string, unknown>> = {
  columns: Array<DataTableColumn<T>>;
  data: T[];
  onSort?: (key: Extract<keyof T, string>, direction: SortDirection) => void;
  sortKey?: Extract<keyof T, string>;
  sortDirection?: SortDirection;
  emptyState?: React.ReactNode;
  /** Accessible name for the scrollable table region. Override when multiple tables exist on one page. */
  ariaLabel?: string;
};

const getDisplayValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) {
    return '—';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  return '—';
};

const getAriaSortValue = (
  columnKey: string,
  sortKey: string | undefined,
  sortDirection: SortDirection | undefined,
): 'ascending' | 'descending' | 'none' => {
  if (sortKey !== columnKey) {
    return 'none';
  }
  return sortDirection === 'desc' ? 'descending' : 'ascending';
};

const getSortIndicator = (
  columnKey: string,
  sortable: boolean | undefined,
  sortKey: string | undefined,
  sortDirection: SortDirection | undefined,
): string => {
  if (!sortable) {
    return '';
  }

  if (sortKey !== columnKey) {
    return '↕';
  }

  return sortDirection === 'desc' ? '↓' : '↑';
};

export const DataTable = <T extends Record<string, unknown>>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  emptyState,
  ariaLabel = 'Data table, scrollable',
}: DataTableProps<T>): React.ReactElement => {
  const handleSort = (column: DataTableColumn<T>): void => {
    if (!column.sortable || !onSort) {
      return;
    }

    const nextDirection: SortDirection =
      sortKey === column.key && sortDirection === 'asc' ? 'desc' : 'asc';

    onSort(column.key, nextDirection);
  };

  return (
    <div className="overflow-x-auto" role="region" aria-label={ariaLabel}>
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-muted/30">
          <tr>
            {columns.map((column) => {
              const ariaSort = getAriaSortValue(
                column.key,
                sortKey,
                sortDirection,
              );
              const indicator = getSortIndicator(
                column.key,
                column.sortable,
                sortKey,
                sortDirection,
              );

              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={column.sortable ? ariaSort : undefined}
                  className="px-4 py-3 font-semibold text-foreground"
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      onClick={() => handleSort(column)}
                    >
                      <span>{column.header}</span>
                      <span aria-hidden="true">{indicator}</span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                {emptyState ?? 'No records to display.'}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={String(row.id ?? rowIndex)} className="bg-background">
                {columns.map((column) => {
                  const value = row[column.key];
                  const content = column.render
                    ? column.render(value, row)
                    : getDisplayValue(value);

                  return (
                    <td
                      key={`${String(row.id ?? rowIndex)}-${column.key}`}
                      className="px-4 py-3"
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
