import { describe, expect, it } from 'vitest';
import type { AuditStatus } from '@/api/audits';
import {
  AUDIT_ALL_FILTER,
  STATUS_FORM_OPTIONS,
  STATUS_OPTIONS,
  formatAuditDate,
  formatAuditStatusLabel,
  statusBadgeVariant,
} from '@/components/auditDisplay';

describe('formatAuditStatusLabel', () => {
  it('formats InProgress as In Progress', (): void => {
    // Arrange
    const status: AuditStatus = 'InProgress';

    // Act
    const result = formatAuditStatusLabel(status);

    // Assert
    expect(result).toBe('In Progress');
  });

  it.each([
    ['Scheduled', 'Scheduled'],
    ['Completed', 'Completed'],
    ['Cancelled', 'Cancelled'],
  ] as const satisfies readonly [AuditStatus, string][])(
    'returns same label for %s',
    (status, expected): void => {
      // Act
      const result = formatAuditStatusLabel(status);

      // Assert
      expect(result).toBe(expected);
    },
  );
});

describe('statusBadgeVariant', () => {
  it.each([
    ['Scheduled', 'info'],
    ['InProgress', 'warning'],
    ['Completed', 'success'],
    ['Cancelled', 'default'],
  ] as const satisfies readonly [
    AuditStatus,
    ReturnType<typeof statusBadgeVariant>,
  ][])('statusBadgeVariant_%s_Returns%s', (status, expected): void => {
    // Act
    const result = statusBadgeVariant(status);

    // Assert
    expect(result).toBe(expected);
  });
});

describe('formatAuditDate', () => {
  it('formats an ISO datetime string as dd MMM yyyy', (): void => {
    // Arrange
    const value = '2026-01-15T00:00:00.000Z';

    // Act
    const result = formatAuditDate(value);

    // Assert
    expect(result).toBe('15 Jan 2026');
  });

  it('formats a date-only string as dd MMM yyyy', (): void => {
    // Arrange
    const value = '2026-01-15';

    // Act
    const result = formatAuditDate(value);

    // Assert
    expect(result).toBe('15 Jan 2026');
  });

  it('returns the original value when it cannot be parsed', (): void => {
    // Arrange
    const value = 'not-a-date';

    // Act
    const result = formatAuditDate(value);

    // Assert
    expect(result).toBe('not-a-date');
  });
});

describe('filter options', () => {
  it('includes all statuses filter entry', (): void => {
    // Act
    const firstOption = STATUS_OPTIONS[0];

    // Assert
    expect(firstOption).toEqual({
      value: AUDIT_ALL_FILTER,
      label: 'All statuses',
    });
    expect(STATUS_OPTIONS).toHaveLength(STATUS_FORM_OPTIONS.length + 1);
  });
});
