import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '../errors';
import {
  fetchIncidents,
  incidentUserMessage,
  parseIncidentId,
} from './incidents';

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

describe('parseIncidentId', () => {
  it('returns null for invalid inputs and the correct number for valid inputs', (): void => {
    // Arrange
    const undefinedId = undefined;

    // Act
    const undefinedResult = parseIncidentId(undefinedId);

    // Assert
    expect(undefinedResult).toBe(null);

    // Arrange
    const abcId = 'abc';

    // Act
    const abcResult = parseIncidentId(abcId);

    // Assert
    expect(abcResult).toBe(null);

    // Arrange
    const zeroId = '0';

    // Act
    const zeroResult = parseIncidentId(zeroId);

    // Assert
    expect(zeroResult).toBe(null);

    // Arrange
    const negativeId = '-1';

    // Act
    const negativeResult = parseIncidentId(negativeId);

    // Assert
    expect(negativeResult).toBe(null);

    // Arrange
    const fractionalId = '1.5';

    // Act
    const fractionalResult = parseIncidentId(fractionalId);

    // Assert
    expect(fractionalResult).toBe(null);

    // Arrange
    const oneId = '1';

    // Act
    const oneResult = parseIncidentId(oneId);

    // Assert
    expect(oneResult).toBe(1);

    // Arrange
    const fortyTwoId = '42';

    // Act
    const fortyTwoResult = parseIncidentId(fortyTwoId);

    // Assert
    expect(fortyTwoResult).toBe(42);
  });
});

describe('incidentUserMessage', () => {
  const INCIDENTS_NETWORK_MESSAGE =
    'Cannot reach the server. Start IncidentsApi with dotnet run in IncidentsApi, then try again.';

  it('returns the correct message for each error type', (): void => {
    // Arrange
    const networkError = new ApiClientError(
      'Network request failed',
      'network',
    );

    // Act
    const networkResult = incidentUserMessage(networkError, 'loading');

    // Assert
    expect(networkResult).toBe(INCIDENTS_NETWORK_MESSAGE);

    // Arrange
    const httpMessage = 'Incident not found.';
    const httpError = new ApiClientError(httpMessage, 'http', 404);

    // Act
    const httpResult = incidentUserMessage(httpError, 'updating');

    // Assert
    expect(httpResult).toBe(httpMessage);

    // Arrange
    const plainMessage = 'Something went wrong';
    const plainError = new Error(plainMessage);

    // Act
    const plainResult = incidentUserMessage(plainError, 'creating');

    // Assert
    expect(plainResult).toBe(plainMessage);

    // Arrange
    const unknownError = null;

    // Act
    const unknownResult = incidentUserMessage(unknownError, 'loading');

    // Assert
    expect(unknownResult).toBe(
      'Something went wrong while loading the incident.',
    );
  });
});
