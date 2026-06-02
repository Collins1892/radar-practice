/* eslint-disable react-refresh/only-export-components */

import { useState } from 'react';
import type { ReactElement } from 'react';
import type { ComponentEntry } from './components/ComponentsView';
import { Badge } from '@/components/Badge';
import { DatePickerField } from '@/components/DatePickerField';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FormField } from '@/components/FormField';
import { LoadingState } from '@/components/LoadingState';
import { Pagination } from '@/components/Pagination';
import { SelectField } from '@/components/SelectField';

function SelectFieldPreview(): ReactElement {
  const [severity, setSeverity] = useState<string>('');

  return (
    <div className="w-full max-w-md rounded-lg border border-dashed border-border p-6">
      <SelectField
        label="Severity"
        id="incident-severity"
        value={severity}
        onValueChange={setSeverity}
        options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'critical', label: 'Critical' },
        ]}
        placeholder="Select incident severity"
        required
      />
    </div>
  );
}

function DatePickerFieldPreview(): ReactElement {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  return (
    <div className="w-full max-w-md rounded-lg border border-dashed border-border p-6">
      <DatePickerField
        label="Incident date"
        id="incident-date"
        value={selectedDate}
        onChange={setSelectedDate}
        placeholder="Pick incident date"
        required
      />
    </div>
  );
}

type IncidentPreviewRow = {
  id: string;
  title: string;
  severity: string;
  status: string;
};

function DataTablePreview(): ReactElement {
  const [sortKey, setSortKey] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const incidents: IncidentPreviewRow[] = [
    {
      id: 'INC-1001',
      title: 'Medication omitted on night round',
      severity: 'High',
      status: 'Open',
    },
    {
      id: 'INC-1002',
      title: 'Delayed discharge paperwork',
      severity: 'Medium',
      status: 'In Review',
    },
    {
      id: 'INC-1003',
      title: 'Broken bed rail in ward 4',
      severity: 'Critical',
      status: 'Resolved',
    },
  ];

  const sortedIncidents: IncidentPreviewRow[] = [...incidents].sort((a, b) => {
    const aValue = String(a[sortKey as keyof IncidentPreviewRow]).toLowerCase();
    const bValue = String(b[sortKey as keyof IncidentPreviewRow]).toLowerCase();
    const order = aValue.localeCompare(bValue);

    return sortDirection === 'asc' ? order : -order;
  });

  return (
    <div className="w-full rounded-lg border border-dashed border-border p-4">
      <DataTable<IncidentPreviewRow>
        columns={[
          { key: 'id', header: 'ID', sortable: true },
          { key: 'title', header: 'Title', sortable: true },
          { key: 'severity', header: 'Severity', sortable: true },
          { key: 'status', header: 'Status', sortable: true },
        ]}
        data={sortedIncidents}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={(key, direction) => {
          setSortKey(key);
          setSortDirection(direction);
        }}
        emptyState={<span>No incidents found.</span>}
      />
    </div>
  );
}

function PaginationPreview(): ReactElement {
  const [currentPage, setCurrentPage] = useState<number>(1);

  return (
    <div className="w-full rounded-lg border border-dashed border-border p-4">
      <Pagination
        currentPage={currentPage}
        totalPages={10}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export const componentRegistry: ComponentEntry[] = [
  {
    name: 'Pagination',
    description:
      'Page navigation controls with previous/next actions, active-page semantics, and ellipsis truncation for long page ranges.',
    preview: <PaginationPreview />,
  },
  {
    name: 'DataTable',
    description:
      'Generic sortable data table with semantic table markup, ARIA sort states, and an empty-state slot.',
    preview: <DataTablePreview />,
  },
  {
    name: 'Badge',
    description:
      'Compact status label with five colour variants, each paired with a distinct icon so colour is never the only differentiator.',
    preview: (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="info">Info</Badge>
      </div>
    ),
  },
  {
    name: 'LoadingState',
    description:
      'Centred loading spinner with accessible status role and optional message for background operations.',
    preview: (
      <div className="w-full py-6">
        <LoadingState message="Fetching latest items..." />
      </div>
    ),
  },
  {
    name: 'EmptyState',
    description:
      'Centred empty-state messaging with optional supporting text and a call-to-action slot.',
    preview: (
      <div className="w-full rounded-lg border border-dashed border-border p-6">
        <EmptyState
          title="No incidents reported"
          message="Create your first incident report to start tracking follow-up actions."
          action={
            <button
              type="button"
              className="rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Create incident
            </button>
          }
        />
      </div>
    ),
  },
  {
    name: 'EmptyState (Minimal)',
    description:
      'Minimal variant with title only for contexts where no action is required.',
    preview: (
      <div className="w-full rounded-lg border border-dashed border-border p-6">
        <EmptyState title="Nothing to show yet" />
      </div>
    ),
  },
  {
    name: 'ErrorState',
    description:
      'Centred error messaging with optional details and a retry button when a handler is provided.',
    preview: (
      <div className="w-full rounded-lg border border-dashed border-border p-6">
        <ErrorState
          title="Could not load data"
          message="Please try again in a moment."
          onRetry={() => void 0}
        />
      </div>
    ),
  },
  {
    name: 'ErrorState (No Retry)',
    description:
      'Error messaging without a retry action when no handler is provided.',
    preview: (
      <div className="w-full rounded-lg border border-dashed border-border p-6">
        <ErrorState
          title="Something went wrong"
          message="Try refreshing the page."
        />
      </div>
    ),
  },
  {
    name: 'FormField',
    description:
      'Form field wrapper with WCAG-compliant label association and optional required indicator.',
    preview: (
      <div className="w-full max-w-md rounded-lg border border-dashed border-border p-6">
        <FormField label="Item name" htmlFor="item-name" required>
          <input
            id="item-name"
            name="itemName"
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Enter item name"
          />
        </FormField>
      </div>
    ),
  },
  {
    name: 'FormField (Error)',
    description:
      'Validation state showing an alert message linked by aria-describedby from the input.',
    preview: (
      <div className="w-full max-w-md rounded-lg border border-dashed border-border p-6">
        <FormField
          label="Price"
          htmlFor="item-price"
          required
          error="Price must be a positive amount."
        >
          <input
            id="item-price"
            name="itemPrice"
            type="text"
            className="w-full rounded-md border border-destructive bg-background px-3 py-2 text-sm text-foreground"
            placeholder="0.00"
          />
        </FormField>
      </div>
    ),
  },
  {
    name: 'SelectField',
    description:
      'FormField-wrapped select using shadcn Select with keyboard-friendly severity options.',
    preview: <SelectFieldPreview />,
  },
  {
    name: 'DatePickerField',
    description:
      'FormField-wrapped date picker using a Popover trigger button and Calendar single-date selection.',
    preview: <DatePickerFieldPreview />,
  },
];
