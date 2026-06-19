import { format, isValid, parseISO } from 'date-fns';
import type { AuditStatus } from '@/api/audits';
import type { SelectFieldOption } from '@/components/SelectField';

export const AUDIT_ALL_FILTER = 'all';

export function formatAuditDate(value: string): string {
  const parsed = parseISO(value.slice(0, 10));
  return isValid(parsed) ? format(parsed, 'dd MMM yyyy') : value;
}

export const AUDIT_STATUSES: readonly AuditStatus[] = [
  'Scheduled',
  'InProgress',
  'Completed',
  'Cancelled',
];

export function formatAuditStatusLabel(status: AuditStatus): string {
  switch (status) {
    case 'InProgress':
      return 'In Progress';
    default:
      return status;
  }
}

export const STATUS_FORM_OPTIONS = AUDIT_STATUSES.map(
  (status): SelectFieldOption => ({
    value: status,
    label: formatAuditStatusLabel(status),
  }),
) satisfies readonly SelectFieldOption[];

export const STATUS_OPTIONS = [
  { value: AUDIT_ALL_FILTER, label: 'All statuses' },
  ...STATUS_FORM_OPTIONS,
] satisfies readonly SelectFieldOption[];

export function statusBadgeVariant(
  status: AuditStatus,
): 'default' | 'info' | 'warning' | 'success' {
  switch (status) {
    case 'Scheduled':
      return 'info';
    case 'InProgress':
      return 'warning';
    case 'Completed':
      return 'success';
    case 'Cancelled':
      return 'default';
  }
}
