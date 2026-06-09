import type { IncidentSeverity, IncidentStatus } from '@/api/incidents';
import type { SelectFieldOption } from '@/components/SelectField';

export const INCIDENT_ALL_FILTER = 'all';

export const INCIDENT_SEVERITIES: readonly IncidentSeverity[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

export const INCIDENT_STATUSES: readonly IncidentStatus[] = [
  'Open',
  'InProgress',
  'Resolved',
  'Closed',
];

export function formatStatusLabel(status: IncidentStatus): string {
  switch (status) {
    case 'InProgress':
      return 'In Progress';
    default:
      return status;
  }
}

export const SEVERITY_FORM_OPTIONS = INCIDENT_SEVERITIES.map(
  (severity): SelectFieldOption => ({
    value: severity,
    label: severity,
  }),
) satisfies readonly SelectFieldOption[];

export const STATUS_FORM_OPTIONS = INCIDENT_STATUSES.map(
  (status): SelectFieldOption => ({
    value: status,
    label: formatStatusLabel(status),
  }),
) satisfies readonly SelectFieldOption[];

export const SEVERITY_OPTIONS = [
  { value: INCIDENT_ALL_FILTER, label: 'All severities' },
  ...SEVERITY_FORM_OPTIONS,
] satisfies readonly SelectFieldOption[];

export const STATUS_OPTIONS = [
  { value: INCIDENT_ALL_FILTER, label: 'All statuses' },
  ...STATUS_FORM_OPTIONS,
] satisfies readonly SelectFieldOption[];

export function severityBadgeVariant(
  severity: IncidentSeverity,
): 'default' | 'info' | 'warning' | 'danger' {
  switch (severity) {
    case 'Low':
      return 'default';
    case 'Medium':
      return 'info';
    case 'High':
      return 'warning';
    case 'Critical':
      return 'danger';
  }
}

export function statusBadgeVariant(
  status: IncidentStatus,
): 'default' | 'info' | 'warning' | 'success' {
  switch (status) {
    case 'Open':
      return 'info';
    case 'InProgress':
      return 'warning';
    case 'Resolved':
      return 'success';
    case 'Closed':
      return 'default';
  }
}
