import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';

type TestRow = {
  id: string;
  name: string;
  category: string;
};

const defaultColumns: ComponentProps<typeof DataTable<TestRow>>['columns'] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'category', header: 'Category', sortable: true },
  { key: 'id', header: 'ID', sortable: false },
];

const defaultRows: TestRow[] = [
  { id: 'ROW-1', name: 'Alpha widget', category: 'Hardware' },
  { id: 'ROW-2', name: 'Beta widget', category: 'Software' },
];

describe('DataTable', () => {
  function renderDataTable(
    overrides: Partial<ComponentProps<typeof DataTable<TestRow>>> = {},
  ): ReturnType<typeof render> & { onSort: ReturnType<typeof vi.fn> } {
    const { onSort: overrideOnSort, ...rest } = overrides;
    const onSort = overrideOnSort ?? vi.fn((): void => {});

    const view = render(
      <DataTable<TestRow>
        columns={defaultColumns}
        data={defaultRows}
        onSort={onSort}
        {...rest}
      />,
    );

    return { ...view, onSort };
  }

  it('renders column headers and row cell values for populated data', (): void => {
    // Arrange — defaults via renderDataTable

    // Act
    renderDataTable();

    // Assert
    expect(
      screen.getByRole('columnheader', { name: 'Name' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Category' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'ID' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('cell', { name: 'Alpha widget' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: 'Beta widget' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Hardware' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Software' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'ROW-1' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'ROW-2' })).toBeInTheDocument();
  });

  it('calls onSort with column key and asc when clicking a sortable header that is not active', (): void => {
    // Arrange
    const { onSort } = renderDataTable({
      sortKey: 'category',
      sortDirection: 'asc',
    });

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));

    // Assert
    expect(onSort).toHaveBeenCalledTimes(1);
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('sets aria-sort ascending on the active sortable column header', (): void => {
    // Arrange — defaults via renderDataTable

    // Act
    renderDataTable({ sortKey: 'name', sortDirection: 'asc' });

    // Assert
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(
      screen.getByRole('columnheader', { name: 'Category' }),
    ).toHaveAttribute('aria-sort', 'none');
    expect(
      screen.getByRole('columnheader', { name: 'ID' }),
    ).not.toHaveAttribute('aria-sort');
  });

  it('exposes the scroll wrapper as a labelled region', (): void => {
    // Arrange — defaults via renderDataTable

    // Act
    renderDataTable();

    // Assert
    expect(
      screen.getByRole('region', { name: 'Data table' }),
    ).toBeInTheDocument();
  });

  it('shows default empty message when data is empty', (): void => {
    // Arrange — defaults via renderDataTable

    // Act
    renderDataTable({ data: [] });

    // Assert
    expect(screen.getByText('No records to display.')).toBeInTheDocument();
  });

  it('calls onSort with desc when clicking the active ascending column header', (): void => {
    // Arrange
    const { onSort } = renderDataTable({
      sortKey: 'name',
      sortDirection: 'asc',
    });

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));

    // Assert
    expect(onSort).toHaveBeenCalledTimes(1);
    expect(onSort).toHaveBeenCalledWith('name', 'desc');
  });
});
