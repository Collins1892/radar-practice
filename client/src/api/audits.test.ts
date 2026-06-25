import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '../errors';
import {
  auditUserMessage,
  deleteAudit,
  fetchAudits,
  parseAuditId,
} from './audits';

describe('fetchAudits', () => {
  afterEach((): void => {
    vi.unstubAllGlobals();
  });

  it('rejects with ApiClientError kind parse when the response body does not match PagedAuditsResult', async (): Promise<void> => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (): Promise<Response> =>
          Promise.resolve(
            new Response(JSON.stringify({ invalid: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          ),
      ),
    );

    // Act
    const rejection = fetchAudits();

    // Assert
    await expect(rejection).rejects.toSatisfy((error: unknown): boolean => {
      return error instanceof ApiClientError && error.kind === 'parse';
    });
  });
});

describe('parseAuditId', () => {
  it('returns null when id is undefined', (): void => {
    // Arrange
    const id = undefined;

    // Act
    const result = parseAuditId(id);

    // Assert
    expect(result).toBe(null);
  });

  it.each([['abc'], ['0'], ['-1'], ['1.5'], ['01']] as const)(
    'returns null for invalid id %s',
    (id): void => {
      // Act
      const result = parseAuditId(id);

      // Assert
      expect(result).toBe(null);
    },
  );

  it('returns 1 for id "1"', (): void => {
    // Arrange
    const id = '1';

    // Act
    const result = parseAuditId(id);

    // Assert
    expect(result).toBe(1);
  });

  it('returns 42 for id "42"', (): void => {
    // Arrange
    const id = '42';

    // Act
    const result = parseAuditId(id);

    // Assert
    expect(result).toBe(42);
  });
});

describe('auditUserMessage', () => {
  const AUDITS_NETWORK_MESSAGE =
    'Cannot reach the server. Start AuditsApi with dotnet run in AuditsApi, then try again.';

  it('returns the server unreachable message for ApiClientError with network kind', (): void => {
    // Arrange
    const error = new ApiClientError('Network request failed', 'network');

    // Act
    const result = auditUserMessage(error, 'loading');

    // Assert
    expect(result).toBe(AUDITS_NETWORK_MESSAGE);
  });

  it('returns error.message for ApiClientError with http kind', (): void => {
    // Arrange
    const errorMessage = 'Audit not found.';
    const error = new ApiClientError(errorMessage, 'http', 404);

    // Act
    const result = auditUserMessage(error, 'updating');

    // Assert
    expect(result).toBe(errorMessage);
  });

  it('returns error.message for a generic Error', (): void => {
    // Arrange
    const errorMessage = 'Something went wrong';
    const error = new Error(errorMessage);

    // Act
    const result = auditUserMessage(error, 'creating');

    // Assert
    expect(result).toBe(errorMessage);
  });

  it('returns the loading fallback message when the error is an unknown value', (): void => {
    // Arrange
    const error = null;

    // Act
    const result = auditUserMessage(error, 'loading');

    // Assert
    expect(result).toBe('Something went wrong while loading the audit.');
  });

  it('returns the deleting fallback message when the error is an unknown value', (): void => {
    // Arrange
    const error = null;

    // Act
    const result = auditUserMessage(error, 'deleting');

    // Assert
    expect(result).toBe('Something went wrong while deleting the audit.');
  });
});

describe('deleteAudit', () => {
  afterEach((): void => {
    vi.unstubAllGlobals();
  });

  it('resolves when the server responds with 204', async (): Promise<void> => {
    // Arrange
    const fetchMock = vi.fn(
      (): Promise<Response> =>
        Promise.resolve(new Response(null, { status: 204 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    // Act
    await deleteAudit(42);

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:5135/audits/42', {
      method: 'DELETE',
    });
  });

  it('rejects with ApiClientError when the server responds with 404', async (): Promise<void> => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (): Promise<Response> =>
          Promise.resolve(
            new Response(JSON.stringify({ error: 'Audit not found.' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            }),
          ),
      ),
    );

    // Act
    const rejection = deleteAudit(999);

    // Assert
    await expect(rejection).rejects.toSatisfy((error: unknown): boolean => {
      return (
        error instanceof ApiClientError &&
        error.kind === 'http' &&
        error.status === 404 &&
        error.message === 'Audit not found.'
      );
    });
  });

  it('rejects with ApiClientError when the server responds with 500', async (): Promise<void> => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (): Promise<Response> =>
          Promise.resolve(
            new Response(
              JSON.stringify({ error: 'An unexpected error occurred.' }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              },
            ),
          ),
      ),
    );

    // Act
    const rejection = deleteAudit(1);

    // Assert
    await expect(rejection).rejects.toSatisfy((error: unknown): boolean => {
      return (
        error instanceof ApiClientError &&
        error.kind === 'http' &&
        error.status === 500 &&
        error.message === 'An unexpected error occurred.'
      );
    });
  });
});
