import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '../errors';
import { fetchIncidents } from './incidents';

describe('fetchIncidents', () => {
  afterEach((): void => {
    vi.unstubAllGlobals();
  });

  it('rejects with ApiClientError kind parse when the response body does not match PagedIncidentsResult', async (): Promise<void> => {
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
    const rejection = fetchIncidents();

    // Assert
    await expect(rejection).rejects.toSatisfy((error: unknown): boolean => {
      return error instanceof ApiClientError && error.kind === 'parse';
    });
  });
});
