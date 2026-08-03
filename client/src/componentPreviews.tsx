import { useState } from 'react';
import type { ReactElement } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/Badge';
import { DatePickerField } from '@/components/DatePickerField';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FormField } from '@/components/FormField';
import { LoadingState } from '@/components/LoadingState';
import { Pagination } from '@/components/Pagination';
import { INCIDENT_CREATE_HEADING } from '@/components/incidentPageCopy';
import { InlineAlert } from '@/components/InlineAlert';
import { Modal } from '@/components/Modal';
import { SelectField } from '@/components/SelectField';

export function SelectFieldPreview(): ReactElement {
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

export function DatePickerFieldPreview(): ReactElement {
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

export function DataTablePreview(): ReactElement {
  const [sortKey, setSortKey] = useState<keyof IncidentPreviewRow>('title');
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
    const aValue = String(a[sortKey]).toLowerCase();
    const bValue = String(b[sortKey]).toLowerCase();
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

export function ToastPreview(): ReactElement {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-border p-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => toast.success('Incident saved successfully.')}
      >
        Success
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => toast.warning('Reported date is in the past.')}
      >
        Warning
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          toast.error('Could not save incident. Please try again.')
        }
      >
        Error
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => toast.info('Changes are saved to the Incidents API.')}
      >
        Info
      </Button>
    </div>
  );
}

export function PaginationPreview(): ReactElement {
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

export function InlineAlertPreview(): ReactElement {
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-dashed border-border p-4">
      <InlineAlert
        variant="success"
        title="Changes saved"
        message="Your incident report has been updated successfully."
      />
      <InlineAlert
        variant="info"
        message="Incidents are archived automatically after 90 days."
      />
      <InlineAlert
        variant="warning"
        title="Unsaved changes"
        message="Navigate away to discard your current edits."
      />
      <InlineAlert
        variant="error"
        title="Submission failed"
        message="Could not save the incident. Please try again."
      />
    </div>
  );
}

export function ModalPreview(): ReactElement {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-6">
      <Modal
        trigger={
          <Button type="button" variant="outline">
            Open modal
          </Button>
        }
        title="Example modal"
        description="An optional description providing context for the modal content."
      >
        <p className="text-sm text-muted-foreground">
          Modal body content goes here. This area accepts any React children.
        </p>
      </Modal>
    </div>
  );
}

export function BadgePreview(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  );
}

export function LoadingStatePreview(): ReactElement {
  return (
    <div className="w-full rounded-lg border border-dashed border-border p-6">
      <LoadingState message="Loading..." />
    </div>
  );
}

export function LoadingStateOverlayPreview(): ReactElement {
  return (
    <div className="relative w-full min-h-24 rounded-lg border border-dashed border-border p-6">
      <LoadingState variant="overlay" message="Saving changes..." />
    </div>
  );
}

export function EmptyStatePreview(): ReactElement {
  return (
    <div className="w-full rounded-lg border border-dashed border-border p-6">
      <EmptyState
        title="No incidents reported"
        message="Create your first incident report to start tracking follow-up actions."
        action={
          <button
            type="button"
            className="rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {INCIDENT_CREATE_HEADING}
          </button>
        }
      />
    </div>
  );
}

export function EmptyStateMinimalPreview(): ReactElement {
  return (
    <div className="w-full rounded-lg border border-dashed border-border p-6">
      <EmptyState title="Nothing to show yet" />
    </div>
  );
}

export function ErrorStatePreview(): ReactElement {
  return (
    <div className="w-full rounded-lg border border-dashed border-border p-6">
      <ErrorState
        title="Could not load data"
        message="Please try again in a moment."
        onTryAgain={() => void 0}
      />
    </div>
  );
}

export function ErrorStateNoRetryPreview(): ReactElement {
  return (
    <div className="w-full rounded-lg border border-dashed border-border p-6">
      <ErrorState
        title="Something went wrong"
        message="Try refreshing the page."
      />
    </div>
  );
}

export function FormFieldPreview(): ReactElement {
  return (
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
  );
}

export function FormFieldErrorPreview(): ReactElement {
  return (
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
  );
}
