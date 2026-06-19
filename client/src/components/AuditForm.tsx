import { format, isValid, parseISO } from 'date-fns';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  createAudit,
  updateAudit,
  auditUserMessage,
  type AuditStatus,
} from '@/api/audits';
import { AuditPageChrome } from '@/components/AuditPageChrome';
import { DatePickerField } from '@/components/DatePickerField';
import { ErrorState } from '@/components/ErrorState';
import { FormField } from '@/components/FormField';
import { LoadingState } from '@/components/LoadingState';
import { SelectField } from '@/components/SelectField';
import { AUDIT_STATUSES, STATUS_FORM_OPTIONS } from '@/components/auditDisplay';
import {
  AUDIT_CREATE_HEADING,
  AUDIT_CREATE_SUBMIT_LABEL,
  AUDIT_CREATE_SUBTITLE,
  AUDIT_CREATE_SUCCESS_MESSAGE,
  AUDIT_EDIT_HEADING,
  AUDIT_EDIT_SUBTITLE,
  AUDIT_EDIT_SUCCESS_MESSAGE,
} from '@/components/auditPageCopy';
import { useAudit } from '@/hooks/useAudit';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FieldKey = 'title' | 'description' | 'auditDate' | 'status' | 'createdBy';

type FieldErrors = Partial<Record<FieldKey, string>>;

type AuditFormValues = {
  title: string;
  description: string;
  auditDate: Date | undefined;
  status: string;
  createdBy: string;
};

type AuditFormProps = { mode: 'create' } | { mode: 'edit'; auditId: number };

function isAuditStatusValue(value: string): value is AuditStatus {
  return (AUDIT_STATUSES as readonly string[]).includes(value);
}

function formatAuditDateForApi(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function validateAuditForm(values: AuditFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  } else if (values.title.length > 200) {
    errors.title = 'Title must not exceed 200 characters.';
  }

  if (!isAuditStatusValue(values.status)) {
    errors.status = 'Status is required.';
  }

  if (values.auditDate === undefined) {
    errors.auditDate = 'Audit date is required.';
  }

  if (!values.createdBy.trim()) {
    errors.createdBy = 'Created by is required.';
  }

  return errors;
}

function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

const FIELD_ORDER: readonly FieldKey[] = [
  'title',
  'description',
  'auditDate',
  'status',
  'createdBy',
];

const FIELD_ELEMENT_IDS: Record<FieldKey, string> = {
  title: 'audit-title',
  description: 'audit-description',
  auditDate: 'audit-date',
  status: 'audit-status',
  createdBy: 'audit-created-by',
};

function getFirstInvalidFieldKey(errors: FieldErrors): FieldKey | undefined {
  return FIELD_ORDER.find((key) => errors[key] !== undefined);
}

const inputClassName =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground';

function inputClassNameWithError(hasError: boolean): string {
  return cn(inputClassName, hasError && 'border-destructive');
}

export function AuditForm(props: AuditFormProps): JSX.Element {
  const isEdit = props.mode === 'edit';
  const auditId = isEdit ? props.auditId : null;
  const navigate = useNavigate();
  const {
    audit,
    loading: loadLoading,
    error: loadError,
    reload,
  } = useAudit(auditId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [auditDate, setAuditDate] = useState<Date | undefined>(
    () => new Date(),
  );
  const [status, setStatus] = useState<AuditStatus>('Scheduled');
  const [createdBy, setCreatedBy] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const shouldFocusFirstErrorRef = useRef(false);
  const populatedAuditIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isEdit || audit === null || audit.id !== auditId) return;
    if (populatedAuditIdRef.current === audit.id) return;

    populatedAuditIdRef.current = audit.id;
    setTitle(audit.title);
    setDescription(audit.description);
    setStatus(audit.status);
    setCreatedBy(audit.createdBy);
    const parsed = parseISO(audit.auditDate.slice(0, 10));
    setAuditDate(isValid(parsed) ? parsed : undefined);
  }, [isEdit, audit, auditId]);

  useLayoutEffect(() => {
    if (!shouldFocusFirstErrorRef.current) return;
    shouldFocusFirstErrorRef.current = false;

    const firstKey = getFirstInvalidFieldKey(fieldErrors);
    if (firstKey === undefined) return;

    const element = document.getElementById(FIELD_ELEMENT_IDS[firstKey]);
    if (!(element instanceof HTMLElement)) return;

    element.focus();
    element.scrollIntoView({ block: 'nearest' });
  }, [fieldErrors]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const errors = validateAuditForm({
      title,
      description,
      auditDate,
      status,
      createdBy,
    });

    if (hasFieldErrors(errors)) {
      shouldFocusFirstErrorRef.current = true;
      setFieldErrors(errors);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);

    const formattedDate = formatAuditDateForApi(auditDate as Date);
    const auditStatus = status as AuditStatus;

    try {
      if (isEdit && auditId !== null) {
        await updateAudit(auditId, {
          id: auditId,
          title,
          description,
          auditDate: formattedDate,
          status: auditStatus,
          createdBy,
        });
      } else {
        await createAudit({
          title,
          description,
          auditDate: formattedDate,
          status: auditStatus,
          createdBy,
        });
      }
      toast.success(
        isEdit ? AUDIT_EDIT_SUCCESS_MESSAGE : AUDIT_CREATE_SUCCESS_MESSAGE,
      );
      navigate('/audits');
    } catch (err) {
      setSubmitError(
        auditUserMessage(
          err,
          props.mode === 'create' ? 'creating' : 'updating',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const heading = isEdit ? AUDIT_EDIT_HEADING : AUDIT_CREATE_HEADING;
  const subtitle = isEdit ? AUDIT_EDIT_SUBTITLE : AUDIT_CREATE_SUBTITLE;

  if (isEdit && loadLoading) {
    return (
      <>
        <AuditPageChrome heading={heading} subtitle={subtitle} />
        <LoadingState message="Loading audit…" />
      </>
    );
  }

  if (isEdit && loadError) {
    return (
      <>
        <AuditPageChrome heading={heading} subtitle={subtitle} />
        <ErrorState
          title="Could not load audit"
          message={loadError}
          onTryAgain={() => void reload()}
        />
      </>
    );
  }

  const submitLabel = isEdit ? 'Save changes' : AUDIT_CREATE_SUBMIT_LABEL;
  const submittingLabel = isEdit ? 'Saving…' : 'Creating…';

  return (
    <>
      <AuditPageChrome heading={heading} subtitle={subtitle} />

      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <form
          className="w-full max-w-lg space-y-4"
          onSubmit={(e) => void handleSubmit(e)}
          noValidate
          aria-busy={submitting || undefined}
        >
          <FormField
            label="Title"
            htmlFor={FIELD_ELEMENT_IDS.title}
            required
            error={fieldErrors.title}
          >
            <input
              id={FIELD_ELEMENT_IDS.title}
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              className={inputClassNameWithError(Boolean(fieldErrors.title))}
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor={FIELD_ELEMENT_IDS.description}
            error={fieldErrors.description}
          >
            <textarea
              id={FIELD_ELEMENT_IDS.description}
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={submitting}
              className={cn(
                inputClassNameWithError(Boolean(fieldErrors.description)),
                'min-h-[5rem] resize-y',
              )}
            />
          </FormField>

          <DatePickerField
            label="Audit date"
            id={FIELD_ELEMENT_IDS.auditDate}
            value={auditDate}
            onChange={setAuditDate}
            placeholder="Pick audit date"
            error={fieldErrors.auditDate}
            required
            disabled={submitting}
          />

          <SelectField
            label="Status"
            id={FIELD_ELEMENT_IDS.status}
            value={status}
            onValueChange={(value) => setStatus(value as AuditStatus)}
            options={STATUS_FORM_OPTIONS}
            placeholder="Select status"
            error={fieldErrors.status}
            required
            disabled={submitting}
          />

          <FormField
            label="Created by"
            htmlFor={FIELD_ELEMENT_IDS.createdBy}
            required
            error={fieldErrors.createdBy}
          >
            <input
              id={FIELD_ELEMENT_IDS.createdBy}
              name="createdBy"
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              disabled={submitting}
              className={inputClassNameWithError(
                Boolean(fieldErrors.createdBy),
              )}
            />
          </FormField>

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
