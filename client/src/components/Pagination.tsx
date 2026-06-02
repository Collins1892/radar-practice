import * as React from 'react';

type PaginationProps = {
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

const getPageButtonClassName = (isActive: boolean): string => {
  if (isActive) {
    return 'h-9 min-w-9 rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground';
  }

  return 'h-9 min-w-9 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground';
};

const getArrowButtonClassName = (disabled: boolean): string => {
  if (disabled) {
    return 'h-9 rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground';
  }

  return 'h-9 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground';
};

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
          aria-label="Previous page"
          className={getArrowButtonClassName(isPrevDisabled)}
        >
          Prev
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
              className={getPageButtonClassName(isActivePage)}
            >
              {token}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={isNextDisabled}
          aria-label="Next page"
          className={getArrowButtonClassName(isNextDisabled)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
