import { describe, expect, it } from 'vitest';
import {
  INCIDENT_CREATE_HEADING,
  INCIDENT_DETAIL_HEADING,
  INCIDENT_EDIT_HEADING,
} from '@/components/IncidentForm';
import { formatPageTitle, resolvePageTitle, SITE_TITLE } from './pageTitle';

describe('resolvePageTitle', () => {
  it('returns Items title at /', (): void => {
    // Arrange
    const pathname = '/';

    // Act
    const result = resolvePageTitle(pathname);

    // Assert
    expect(result).toBe(formatPageTitle('Items'));
  });

  it('returns Incidents title at /incidents', (): void => {
    // Arrange
    const pathname = '/incidents';

    // Act
    const result = resolvePageTitle(pathname);

    // Assert
    expect(result).toBe(formatPageTitle('Incidents'));
  });

  it('returns create incident title at /incidents/create', (): void => {
    // Arrange
    const pathname = '/incidents/create';

    // Act
    const result = resolvePageTitle(pathname);

    // Assert
    expect(result).toBe(formatPageTitle(INCIDENT_CREATE_HEADING));
  });

  it('returns edit incident title at /incidents/:id/edit', (): void => {
    // Arrange
    const pathname = '/incidents/42/edit';

    // Act
    const result = resolvePageTitle(pathname);

    // Assert
    expect(result).toBe(formatPageTitle(INCIDENT_EDIT_HEADING));
  });

  it('returns incident detail title at /incidents/:id', (): void => {
    // Arrange
    const pathname = '/incidents/42';

    // Act
    const result = resolvePageTitle(pathname);

    // Assert
    expect(result).toBe(formatPageTitle(INCIDENT_DETAIL_HEADING));
  });

  it('returns Components title at /components', (): void => {
    // Arrange
    const pathname = '/components';

    // Act
    const result = resolvePageTitle(pathname);

    // Assert
    expect(result).toBe(formatPageTitle('Components'));
  });

  it('returns site title for unknown paths', (): void => {
    // Arrange
    const pathname = '/not-a-route';

    // Act
    const result = resolvePageTitle(pathname);

    // Assert
    expect(result).toBe(SITE_TITLE);
  });
});
