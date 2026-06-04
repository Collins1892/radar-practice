import { useState } from 'react';
import type { FormEvent, JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createIncident,
  type IncidentSeverity,
  type IncidentStatus,
} from '@/api/incidents';
import { DatePickerField } from '@/components/DatePickerField';
import { FormField } from '@/components/FormField';
import { SelectField } from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/errors';
import { cn } from '@/lib/utils';

const SEVERITIES: readonly IncidentSeverity[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

const STATUSES: readonly IncidentStatus[] = [
  'Open',
  'InProgress',
  'Resolved',
  'Closed',
];

const SEVERITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

const STATUS_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' },
];

type FieldKey =
  | 'title'
  | 'description'
  | 'location'
  | 'severity'
  | 'status'
  | 'reportedDate';

type FieldErrors = Partial<Record<FieldKey, string>>;

type IncidentFormValues = {
  title: string;
  description: string;
  location: string;
  severity: string;
  status: string;
  reportedDate: Date | undefined;
};

function isIncidentSeverityValue(value: string): value is IncidentSeverity {
  return (SEVERITIES as readonly string[]).includes(value);
}

function isIncidentStatusValue(value: string): value is IncidentStatus {
  return (STATUSES as readonly string[]).includes(value);
}

function formatReportedDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function utcDateOnlyMs(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function todayUtcMs(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function validateIncidentForm(values: IncidentFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  } else if (values.title.length > 50) {
    errors.title = 'Title must be 50 characters or fewer.';
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required.';
  } else if (values.description.length > 100) {
    errors.description = 'Description must be 100 characters or fewer.';
  }

  if (!values.location.trim()) {
    errors.location = 'Location is required.';
  } else if (values.location.length > 100) {
    errors.location = 'Location must be 100 characters or fewer.';
  }

  if (!isIncidentSeverityValue(values.severity)) {
    errors.severity = 'Invalid severity value.';
  }

  if (!isIncidentStatusValue(values.status)) {
    errors.status = 'Invalid status value.';
  }

  if (values.reportedDate === undefined) {
    errors.reportedDate = 'Reported date is required.';
  } else if (utcDateOnlyMs(values.reportedDate) > todayUtcMs()) {
    errors.reportedDate = 'Reported date must not be in the future.';
  }

  return errors;
}

function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

function toUserMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.kind === 'network') {
      return 'Cannot reach the server. Start IncidentsApi with dotnet run in IncidentsApi, then try again.';
    }
    return error.message;
  }

  if (error instanceof TypeError) {
    return 'Cannot reach the server. Start IncidentsApi with dotnet run in IncidentsApi, then try again.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while creating the incident.';
}

const inputClassName =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground';

function inputClassNameWithError(hasError: boolean): string {
  return cn(inputClassName, hasError && 'border-destructive');
}

export function IncidentCreateView(): JSX.Element {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [reportedDate, setReportedDate] = useState<Date | undefined>(undefined);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const errors = validateIncidentForm({
      title,
      description,
      location,
      severity,
      status,
      reportedDate,
    });

    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);

    const date = reportedDate;
    if (date === undefined) {
      return;
    }

    try {
      await createIncident({
        title,
        description,
        location,
        severity: severity as IncidentSeverity,
        status: status as IncidentStatus,
        reportedDate: formatReportedDateUtc(date),
      });
      navigate('/incidents');
    } catch (err) {
      setSubmitError(toUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1>Create incident</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Report a new incident to the Incidents API
          </p>
        </div>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link to="/incidents">Back to incidents</Link>
        </Button>
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <form
          className="w-full max-w-lg space-y-4"
          onSubmit={(e) => void handleSubmit(e)}
          noValidate
        >
          <FormField
            label="Title"
            htmlFor="incident-title"
            required
            error={fieldErrors.title}
          >
            <input
              id="incident-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              disabled={submitting}
              className={inputClassNameWithError(Boolean(fieldErrors.title))}
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor="incident-description"
            required
            error={fieldErrors.description}
          >
            <textarea
              id="incident-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              rows={3}
              disabled={submitting}
              className={cn(
                inputClassNameWithError(Boolean(fieldErrors.description)),
                'min-h-[5rem] resize-y',
              )}
            />
          </FormField>

          <FormField
            label="Location"
            htmlFor="incident-location"
            required
            error={fieldErrors.location}
          >
            <input
              id="incident-location"
              name="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
              disabled={submitting}
              className={inputClassNameWithError(Boolean(fieldErrors.location))}
            />
          </FormField>

          <SelectField
            label="Severity"
            id="incident-severity"
            value={severity}
            onValueChange={setSeverity}
            options={SEVERITY_OPTIONS}
            placeholder="Select severity"
            error={fieldErrors.severity}
            required
          />

          <SelectField
            label="Status"
            id="incident-status"
            value={status}
            onValueChange={setStatus}
            options={STATUS_OPTIONS}
            placeholder="Select status"
            error={fieldErrors.status}
            required
          />

          <DatePickerField
            label="Reported date"
            id="incident-reported-date"
            value={reportedDate}
            onChange={setReportedDate}
            placeholder="Pick reported date"
            error={fieldErrors.reportedDate}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={submitting}
            >
              {submitting ? 'Creating…' : 'Create incident'}
            </Button>
          </div>

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
        </form>
      </section>
    </>
  );
}
