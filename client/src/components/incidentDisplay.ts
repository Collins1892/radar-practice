import type { IncidentSeverity, IncidentStatus } from '@/api/incidents';

export const INCIDENT_ALL_FILTER = 'all';

export const SEVERITY_OPTIONS = [
  { value: INCIDENT_ALL_FILTER, label: 'All severities' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

export const STATUS_OPTIONS = [
  { value: INCIDENT_ALL_FILTER, label: 'All statuses' },
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' },
];

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

export function formatStatusLabel(status: IncidentStatus): string {
  switch (status) {
    case 'InProgress':
      return 'In Progress';
    default:
      return status;
  }
}
