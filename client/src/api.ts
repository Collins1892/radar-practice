import { ApiClientError } from './errors';
import { isApiErrorBody, isItem, isItemArray } from './guards';
import type { CreateItemRequest, Item } from './types';

const base = import.meta.env.VITE_API_URL ?? '';

async function request(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${base}${path}`, init);
  } catch {
    throw new ApiClientError('Network request failed', 'network');
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (isApiErrorBody(body)) return body.error;
  } catch {
    /* ignore non-JSON bodies */
  }
  return response.statusText || `Request failed (${response.status})`;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiClientError('Invalid response from server', 'parse');
  }
}

export async function fetchItems(): Promise<Item[]> {
  const response = await request('/items');

  if (!response.ok) {
    throw new ApiClientError(
      await parseErrorMessage(response),
      'http',
      response.status,
    );
  }

  const body = await parseJson(response);
  if (!isItemArray(body)) {
    throw new ApiClientError('Unexpected response format from server', 'parse');
  }

  return body;
}

export async function createItem(data: CreateItemRequest): Promise<Item> {
  const response = await request('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new ApiClientError(
      await parseErrorMessage(response),
      'http',
      response.status,
    );
  }

  const body = await parseJson(response);
  if (!isItem(body)) {
    throw new ApiClientError('Unexpected response format from server', 'parse');
  }

  return body;
}
