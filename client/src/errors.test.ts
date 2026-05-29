import { describe, expect, it } from 'vitest';
import { ApiClientError, toUserMessage } from './errors';

describe('ApiClientError', () => {
  it('sets message, kind, status, and name, and is instanceof Error', (): void => {
    // Arrange
    const error = new ApiClientError('Bad request', 'http', 400);

    // Act
    // (construction is the act)

    // Assert
    expect(error.message).toBe('Bad request');
    expect(error.kind).toBe('http');
    expect(error.status).toBe(400);
    expect(error.name).toBe('ApiClientError');
    expect(error).toBeInstanceOf(Error);
  });

  it('status is undefined when not provided', (): void => {
    // Arrange
    const error = new ApiClientError('Network request failed', 'network');

    // Act
    // (construction is the act)

    // Assert
    expect(error.status).toBeUndefined();
  });
});

describe('toUserMessage', () => {
  const SERVER_UNREACHABLE_MSG =
    'Cannot reach the server. Start the API with dotnet run in ItemsApi, then try again.';

  it('returns the server unreachable message for ApiClientError with network kind', (): void => {
    // Arrange
    const error = new ApiClientError('Network request failed', 'network');

    // Act
    const result = toUserMessage(error, 'load');

    // Assert
    expect(result).toBe(SERVER_UNREACHABLE_MSG);
    expect(toUserMessage(error, 'create')).toBe(SERVER_UNREACHABLE_MSG);
  });

  it('returns error.message for ApiClientError with http kind', (): void => {
    // Arrange
    const errorMessage = 'Name is required.';
    const error = new ApiClientError(errorMessage, 'http', 400);

    // Act
    const result = toUserMessage(error, 'create');

    // Assert
    expect(result).toBe(errorMessage);
  });

  it('returns error.message for ApiClientError with parse kind', (): void => {
    // Arrange
    const errorMessage = 'Invalid response from server';
    const error = new ApiClientError(errorMessage, 'parse');

    // Act
    const result = toUserMessage(error, 'load');

    // Assert
    expect(result).toBe(errorMessage);
  });

  it('returns the server unreachable message for a TypeError', (): void => {
    // Arrange
    const error = new TypeError('Failed to fetch');

    // Act
    const result = toUserMessage(error, 'load');

    // Assert
    expect(result).toBe(SERVER_UNREACHABLE_MSG);
  });

  it('returns error.message for a generic Error', (): void => {
    // Arrange
    const errorMessage = 'Something went wrong';
    const error = new Error(errorMessage);

    // Act
    const result = toUserMessage(error, 'create');

    // Assert
    expect(result).toBe(errorMessage);
  });

  it('returns the load fallback message when the error is an unknown value and context is load', (): void => {
    // Arrange
    const error = 'unexpected failure';

    // Act
    const result = toUserMessage(error, 'load');

    // Assert
    expect(result).toBe('Something went wrong while loading items.');
  });

  it('returns the create fallback message when the error is an unknown value and context is create', (): void => {
    // Arrange
    const error = { code: 'UNKNOWN' };

    // Act
    const result = toUserMessage(error, 'create');

    // Assert
    expect(result).toBe('Something went wrong while adding the item.');
  });
});
