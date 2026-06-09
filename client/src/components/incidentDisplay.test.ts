import { describe, expect, it } from 'vitest';
import type { IncidentSeverity, IncidentStatus } from '@/api/incidents';
import {
  INCIDENT_ALL_FILTER,
  SEVERITY_FORM_OPTIONS,
  SEVERITY_OPTIONS,
  STATUS_FORM_OPTIONS,
  STATUS_OPTIONS,
  formatStatusLabel,
  severityBadgeVariant,
  statusBadgeVariant,
} from '@/components/incidentDisplay';

describe('formatStatusLabel', () => {
  it('formats InProgress as In Progress', (): void => {
    // Arrange
    const status: IncidentStatus = 'InProgress';

    // Act
    const result = formatStatusLabel(status);

    // Assert
    expect(result).toBe('In Progress');
  });

  it.each([
    ['Open', 'Open'],
    ['Resolved', 'Resolved'],
    ['Closed', 'Closed'],
  ] as const satisfies readonly [IncidentStatus, string][])(
    'formatStatusLabel_%s_ReturnsSameLabel',
    (status, expected): void => {
      // Act
      const result = formatStatusLabel(status);

      // Assert
      expect(result).toBe(expected);
    },
  );
});

describe('severityBadgeVariant', () => {
  it.each([
    ['Low', 'default'],
    ['Medium', 'info'],
    ['High', 'warning'],
    ['Critical', 'danger'],
  ] as const satisfies readonly [
    IncidentSeverity,
    ReturnType<typeof severityBadgeVariant>,
  ][])('severityBadgeVariant_%s_Returns%s', (severity, expected): void => {
    // Act
    const result = severityBadgeVariant(severity);

    // Assert
    expect(result).toBe(expected);
  });
});

describe('statusBadgeVariant', () => {
  it.each([
    ['Open', 'info'],
    ['InProgress', 'warning'],
    ['Resolved', 'success'],
    ['Closed', 'default'],
  ] as const satisfies readonly [
    IncidentStatus,
    ReturnType<typeof statusBadgeVariant>,
  ][])('statusBadgeVariant_%s_Returns%s', (status, expected): void => {
    // Act
    const result = statusBadgeVariant(status);

    // Assert
    expect(result).toBe(expected);
  });
});

describe('filter options', () => {
  it('includes all severities filter entry', (): void => {
    // Act
    const firstOption = SEVERITY_OPTIONS[0];

    // Assert
    expect(firstOption).toEqual({
      value: INCIDENT_ALL_FILTER,
      label: 'All severities',
    });
    expect(SEVERITY_OPTIONS).toHaveLength(SEVERITY_FORM_OPTIONS.length + 1);
  });

  it('includes all statuses filter entry', (): void => {
    // Act
    const firstOption = STATUS_OPTIONS[0];

    // Assert
    expect(firstOption).toEqual({
      value: INCIDENT_ALL_FILTER,
      label: 'All statuses',
    });
    expect(STATUS_OPTIONS).toHaveLength(STATUS_FORM_OPTIONS.length + 1);
  });
});
