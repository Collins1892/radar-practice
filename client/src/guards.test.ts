import { describe, expect, it } from 'vitest';
import { isApiErrorBody, isItem, isItemArray, isRecord } from './guards';
import type { Item } from './types';

describe('isRecord', () => {
  it('returns true for a plain object', (): void => {
    // Arrange
    const value = { id: 1, name: 'Sprocket' };

    // Act
    const result = isRecord(value);

    // Assert
    expect(result).toBe(true);
  });

  it('returns false for null', (): void => {
    // Arrange
    const value = null;

    // Act
    const result = isRecord(value);

    // Assert
    expect(result).toBe(false);
  });

  it('returns true for an array because arrays are objects in JavaScript', (): void => {
    // Arrange
    const value: unknown[] = [];

    // Act
    const result = isRecord(value);

    // Assert
    expect(result).toBe(true);
  });

  it('returns false for primitives', (): void => {
    // Arrange
    const undefinedValue = undefined;

    // Act
    const undefinedResult = isRecord(undefinedValue);

    // Assert
    expect(undefinedResult).toBe(false);

    // Arrange
    const stringValue = 'text';

    // Act
    const stringResult = isRecord(stringValue);

    // Assert
    expect(stringResult).toBe(false);

    // Arrange
    const numberValue = 42;

    // Act
    const numberResult = isRecord(numberValue);

    // Assert
    expect(numberResult).toBe(false);

    // Arrange
    const booleanValue = true;

    // Act
    const booleanResult = isRecord(booleanValue);

    // Assert
    expect(booleanResult).toBe(false);
  });
});

describe('isItem', () => {
  it('returns true for a valid item shape', (): void => {
    // Arrange
    const value: Item = { id: 1, name: 'Sprocket', price: 12.5 };

    // Act
    const result = isItem(value);

    // Assert
    expect(result).toBe(true);
  });

  it('returns true for an object with extra properties beyond id, name, and price', (): void => {
    // Arrange
    const value = { id: 1, name: 'Sprocket', price: 12.5, category: 'parts' };

    // Act
    const result = isItem(value);

    // Assert
    expect(result).toBe(true);
  });

  it('returns true when id is NaN because typeof NaN is number in JavaScript', (): void => {
    // Arrange
    const value = { id: NaN, name: 'Sprocket', price: 12.5 };

    // Act
    const result = isItem(value);

    // Assert
    expect(result).toBe(true);
  });

  it('returns true when price is NaN because typeof NaN is number in JavaScript', (): void => {
    // Arrange
    const value = { id: 1, name: 'Sprocket', price: NaN };

    // Act
    const result = isItem(value);

    // Assert
    expect(result).toBe(true);
  });

  it('returns false for an empty array because array indices are not item fields', (): void => {
    // Arrange
    const value: unknown[] = [];

    // Act
    const result = isItem(value);

    // Assert
    expect(result).toBe(false);
  });

  it('returns false when value is not a record', (): void => {
    // Arrange
    const nullValue = null;

    // Act
    const nullResult = isItem(nullValue);

    // Assert
    expect(nullResult).toBe(false);

    // Arrange
    const stringValue = 'not an item';

    // Act
    const stringResult = isItem(stringValue);

    // Assert
    expect(stringResult).toBe(false);
  });

  it('returns false when id, name, or price has the wrong type', (): void => {
    // Arrange
    const invalidIdValue = { id: '1', name: 'Sprocket', price: 12.5 };

    // Act
    const invalidIdResult = isItem(invalidIdValue);

    // Assert
    expect(invalidIdResult).toBe(false);

    // Arrange
    const invalidNameValue = { id: 1, name: 12, price: 12.5 };

    // Act
    const invalidNameResult = isItem(invalidNameValue);

    // Assert
    expect(invalidNameResult).toBe(false);

    // Arrange
    const invalidPriceValue = { id: 1, name: 'Sprocket', price: '12.5' };

    // Act
    const invalidPriceResult = isItem(invalidPriceValue);

    // Assert
    expect(invalidPriceResult).toBe(false);
  });

  it('returns false when a required field is missing', (): void => {
    // Arrange
    const missingIdValue = { name: 'Sprocket', price: 12.5 };

    // Act
    const missingIdResult = isItem(missingIdValue);

    // Assert
    expect(missingIdResult).toBe(false);

    // Arrange
    const missingNameValue = { id: 1, price: 12.5 };

    // Act
    const missingNameResult = isItem(missingNameValue);

    // Assert
    expect(missingNameResult).toBe(false);

    // Arrange
    const missingPriceValue = { id: 1, name: 'Sprocket' };

    // Act
    const missingPriceResult = isItem(missingPriceValue);

    // Assert
    expect(missingPriceResult).toBe(false);
  });
});

describe('isItemArray', () => {
  it('returns true for an array of valid items', (): void => {
    // Arrange
    const value: Item[] = [
      { id: 1, name: 'Sprocket', price: 12.5 },
      { id: 2, name: 'Widget', price: 3.99 },
    ];

    // Act
    const result = isItemArray(value);

    // Assert
    expect(result).toBe(true);
  });

  it('returns true for an empty array', (): void => {
    // Arrange
    const value: unknown[] = [];

    // Act
    const result = isItemArray(value);

    // Assert
    expect(result).toBe(true);
  });

  it('returns false when value is not an array', (): void => {
    // Arrange
    const value = { id: 1, name: 'Sprocket', price: 12.5 };

    // Act
    const result = isItemArray(value);

    // Assert
    expect(result).toBe(false);
  });

  it('returns false when any element is not a valid item', (): void => {
    // Arrange
    const value = [
      { id: 1, name: 'Sprocket', price: 12.5 },
      { id: 2, name: 12 },
    ];

    // Act
    const result = isItemArray(value);

    // Assert
    expect(result).toBe(false);
  });
});

describe('isApiErrorBody', () => {
  it('returns true when error is a string on a record', (): void => {
    // Arrange
    const value = { error: 'Name is required.' };

    // Act
    const result = isApiErrorBody(value);

    // Assert
    expect(result).toBe(true);
  });

  it('returns true for an object with extra properties beyond error', (): void => {
    // Arrange
    const value = { error: 'Name is required.', traceId: 'abc-123' };

    // Act
    const result = isApiErrorBody(value);

    // Assert
    expect(result).toBe(true);
  });

  it('returns false when value is not a record', (): void => {
    // Arrange
    const nullValue = null;

    // Act
    const nullResult = isApiErrorBody(nullValue);

    // Assert
    expect(nullResult).toBe(false);

    // Arrange
    const stringValue = 'Name is required.';

    // Act
    const stringResult = isApiErrorBody(stringValue);

    // Assert
    expect(stringResult).toBe(false);
  });

  it('returns false when error is missing or not a string', (): void => {
    // Arrange
    const missingErrorValue = {};

    // Act
    const missingErrorResult = isApiErrorBody(missingErrorValue);

    // Assert
    expect(missingErrorResult).toBe(false);

    // Arrange
    const nonStringErrorValue = { error: 400 };

    // Act
    const nonStringErrorResult = isApiErrorBody(nonStringErrorValue);

    // Assert
    expect(nonStringErrorResult).toBe(false);
  });
});
