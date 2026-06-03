import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  function renderPagination(
    overrides: Partial<ComponentProps<typeof Pagination>> = {},
  ): ReturnType<typeof render> & {
    onPageChange: ReturnType<typeof vi.fn>;
  } {
    const { onPageChange: overrideOnPageChange, ...rest } = overrides;
    const onPageChange = overrideOnPageChange ?? vi.fn((): void => {});

    const view = render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={onPageChange}
        {...rest}
      />,
    );

    return { ...view, onPageChange };
  }

  it('renders a page button for each page when totalPages is five or fewer', (): void => {
    // Arrange — defaults via renderPagination

    // Act
    renderPagination({ currentPage: 2, totalPages: 3 });

    // Assert
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });

  it('renders ellipsis between truncated page ranges when totalPages exceeds five', (): void => {
    // Arrange — defaults via renderPagination

    // Act
    renderPagination({ currentPage: 1, totalPages: 10 });

    // Assert
    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Page 5' }),
    ).not.toBeInTheDocument();
  });

  it('sets aria-current page on the active page button only', (): void => {
    // Arrange — defaults via renderPagination

    // Act
    renderPagination({ currentPage: 2, totalPages: 3 });

    // Assert
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Page 1' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('button', { name: 'Page 3' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).not.toHaveAttribute('aria-current');
    expect(
      screen.getByRole('button', { name: 'Next page' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('calls onPageChange with the clicked page number', (): void => {
    // Arrange
    const { onPageChange } = renderPagination({
      currentPage: 1,
      totalPages: 5,
    });

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));

    // Assert
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('exposes pagination controls inside a labelled nav', (): void => {
    // Arrange — defaults via renderPagination

    // Act
    renderPagination();

    // Assert
    expect(
      screen.getByRole('navigation', { name: 'Pagination' }),
    ).toBeInTheDocument();
  });

  it('disables the previous page button when currentPage is 1', (): void => {
    // Arrange — defaults via renderPagination

    // Act
    renderPagination({ currentPage: 1, totalPages: 5 });

    // Assert
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
  });

  it('disables the next page button when currentPage equals totalPages', (): void => {
    // Arrange — defaults via renderPagination

    // Act
    renderPagination({ currentPage: 5, totalPages: 5 });

    // Assert
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('calls onPageChange with the next page when the next page button is clicked', (): void => {
    // Arrange
    const { onPageChange } = renderPagination({
      currentPage: 1,
      totalPages: 5,
    });

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    // Assert
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
