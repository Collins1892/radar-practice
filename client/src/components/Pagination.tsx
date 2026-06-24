import * as React from 'react';
import { cn } from '@/lib/utils';

type PaginationProps = {
  /** 1-indexed. Caller is responsible for keeping this within [1, totalPages]. */
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

type PageToken = number | 'ellipsis';

const getPageTokens = (
  currentPage: number,
  totalPages: number,
): PageToken[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      'ellipsis',
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    'ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis',
    totalPages,
  ];
};

// ring-foreground (not ring-ring): meets SC 1.4.11 3:1 on bg-background / bg-muted.
const getArrowButtonClassName = (disabled: boolean): string =>
  cn(
    'h-9 rounded-md border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground',
    disabled
      ? 'border-input bg-muted text-muted-foreground cursor-not-allowed'
      : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
  );

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps): React.ReactElement {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const pageTokens = getPageTokens(safeCurrentPage, safeTotalPages);
  const isPrevDisabled = safeCurrentPage <= 1;
  const isNextDisabled = safeCurrentPage >= safeTotalPages;

  return (
    <nav aria-label="Pagination">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={isPrevDisabled}
          className={getArrowButtonClassName(isPrevDisabled)}
        >
          Previous
        </button>

        {pageTokens.map((token, index) => {
          if (token === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="inline-flex h-9 min-w-9 items-center justify-center text-sm text-muted-foreground"
              >
                ...
              </span>
            );
          }

          const isActivePage = token === safeCurrentPage;

          return (
            <button
              key={token}
              type="button"
              onClick={() => onPageChange(token)}
              aria-label={`Page ${token}`}
              aria-current={isActivePage ? 'page' : undefined}
              className={cn(
                'h-9 min-w-9 rounded-md border px-3 text-sm font-medium',
                isActivePage
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {token}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={isNextDisabled}
          className={getArrowButtonClassName(isNextDisabled)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
