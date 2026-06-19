import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '../errors';
import { auditUserMessage, fetchAudits, parseAuditId } from './audits';

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
  it('returns null for invalid inputs and the correct number for valid inputs', (): void => {
    // Arrange
    const undefinedId = undefined;

    // Act
    const undefinedResult = parseAuditId(undefinedId);

    // Assert
    expect(undefinedResult).toBe(null);

    // Arrange
    const abcId = 'abc';

    // Act
    const abcResult = parseAuditId(abcId);

    // Assert
    expect(abcResult).toBe(null);

    // Arrange
    const zeroId = '0';

    // Act
    const zeroResult = parseAuditId(zeroId);

    // Assert
    expect(zeroResult).toBe(null);

    // Arrange
    const negativeId = '-1';

    // Act
    const negativeResult = parseAuditId(negativeId);

    // Assert
    expect(negativeResult).toBe(null);

    // Arrange
    const fractionalId = '1.5';

    // Act
    const fractionalResult = parseAuditId(fractionalId);

    // Assert
    expect(fractionalResult).toBe(null);

    // Arrange
    const leadingZeroId = '01';

    // Act
    const leadingZeroResult = parseAuditId(leadingZeroId);

    // Assert
    expect(leadingZeroResult).toBe(null);

    // Arrange
    const oneId = '1';

    // Act
    const oneResult = parseAuditId(oneId);

    // Assert
    expect(oneResult).toBe(1);

    // Arrange
    const fortyTwoId = '42';

    // Act
    const fortyTwoResult = parseAuditId(fortyTwoId);

    // Assert
    expect(fortyTwoResult).toBe(42);
  });
});

describe('auditUserMessage', () => {
  const AUDITS_NETWORK_MESSAGE =
    'Cannot reach the server. Start AuditsApi with dotnet run in AuditsApi, then try again.';

  it('returns the correct message for each error type', (): void => {
    // Arrange
    const networkError = new ApiClientError(
      'Network request failed',
      'network',
    );

    // Act
    const networkResult = auditUserMessage(networkError, 'loading');

    // Assert
    expect(networkResult).toBe(AUDITS_NETWORK_MESSAGE);

    // Arrange
    const httpMessage = 'Audit not found.';
    const httpError = new ApiClientError(httpMessage, 'http', 404);

    // Act
    const httpResult = auditUserMessage(httpError, 'updating');

    // Assert
    expect(httpResult).toBe(httpMessage);

    // Arrange
    const plainMessage = 'Something went wrong';
    const plainError = new Error(plainMessage);

    // Act
    const plainResult = auditUserMessage(plainError, 'creating');

    // Assert
    expect(plainResult).toBe(plainMessage);

    // Arrange
    const unknownError = null;

    // Act
    const unknownResult = auditUserMessage(unknownError, 'loading');

    // Assert
    expect(unknownResult).toBe('Something went wrong while loading the audit.');
  });
});
