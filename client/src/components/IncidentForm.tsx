import { format, isValid, parseISO } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createIncident,
  getIncident,
  incidentUserMessage,
  updateIncident,
  type IncidentSeverity,
  type IncidentStatus,
} from '@/api/incidents';
import { DatePickerField } from '@/components/DatePickerField';
import { ErrorState } from '@/components/ErrorState';
import { FormField } from '@/components/FormField';
import { IncidentPageChrome } from '@/components/IncidentPageChrome';
import { LoadingState } from '@/components/LoadingState';
import { SelectField } from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const INCIDENT_CREATE_HEADING = 'Create incident';
export const INCIDENT_CREATE_SUBTITLE =
  'Add a new incident to the Incidents API';
export const INCIDENT_EDIT_HEADING = 'Edit incident';
export const INCIDENT_EDIT_SUBTITLE =
  'Update an existing incident in the Incidents API';

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

type IncidentFormProps =
  | { mode: 'create' }
  | { mode: 'edit'; incidentId: number };

function isIncidentSeverityValue(value: string): value is IncidentSeverity {
  return (SEVERITIES as readonly string[]).includes(value);
}

function isIncidentStatusValue(value: string): value is IncidentStatus {
  return (STATUSES as readonly string[]).includes(value);
}

function formatReportedDateForApi(date: Date): string {
  return format(date, 'yyyy-MM-dd');
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
  } else if (
    new Date(formatReportedDateForApi(values.reportedDate)) >
    new Date(formatReportedDateForApi(new Date()))
  ) {
    errors.reportedDate = 'Reported date must not be in the future.';
  }

  return errors;
}

function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

const inputClassName =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground';

function inputClassNameWithError(hasError: boolean): string {
  return cn(inputClassName, hasError && 'border-destructive');
}

export function IncidentForm(props: IncidentFormProps): JSX.Element {
  const isEdit = props.mode === 'edit';
  const incidentId = isEdit ? props.incidentId : undefined;
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
  const [loadLoading, setLoadLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadIncident = useCallback(async (): Promise<void> => {
    if (!isEdit || incidentId === undefined) return;

    setLoadError(null);
    setLoadLoading(true);
    try {
      const incident = await getIncident(incidentId);
      setTitle(incident.title);
      setDescription(incident.description);
      setLocation(incident.location);
      setSeverity(incident.severity);
      setStatus(incident.status);
      const parsed = parseISO(incident.reportedDate.slice(0, 10));
      setReportedDate(isValid(parsed) ? parsed : undefined);
    } catch (err) {
      setLoadError(incidentUserMessage(err, 'loading'));
    } finally {
      setLoadLoading(false);
    }
  }, [isEdit, incidentId]);

  useEffect(() => {
    if (isEdit) {
      void loadIncident();
    }
  }, [isEdit, loadIncident]);

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

    const payload = {
      title,
      description,
      location,
      severity: severity as IncidentSeverity,
      status: status as IncidentStatus,
      reportedDate: formatReportedDateForApi(reportedDate as Date),
    };

    try {
      if (isEdit && incidentId !== undefined) {
        await updateIncident(incidentId, payload);
      } else {
        await createIncident(payload);
      }
      navigate('/incidents');
    } catch (err) {
      setSubmitError(
        incidentUserMessage(
          err,
          props.mode === 'create' ? 'creating' : 'updating',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const heading = isEdit ? INCIDENT_EDIT_HEADING : INCIDENT_CREATE_HEADING;
  const subtitle = isEdit ? INCIDENT_EDIT_SUBTITLE : INCIDENT_CREATE_SUBTITLE;

  if (isEdit && loadLoading) {
    return (
      <>
        <IncidentPageChrome heading={heading} subtitle={subtitle} />
        <LoadingState message="Loading incident…" />
      </>
    );
  }

  if (isEdit && loadError) {
    return (
      <>
        <IncidentPageChrome heading={heading} subtitle={subtitle} />
        <ErrorState
          title="Could not load incident"
          message={loadError}
          onTryAgain={() => void loadIncident()}
        />
      </>
    );
  }
  const submitLabel = isEdit ? 'Save changes' : 'Create incident';
  const submittingLabel = isEdit ? 'Saving…' : 'Creating…';

  return (
    <>
      <IncidentPageChrome heading={heading} subtitle={subtitle} />

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
              {submitting ? submittingLabel : submitLabel}
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
