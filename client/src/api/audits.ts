import { ApiClientError } from '../errors';
import { isApiErrorBody, isRecord } from '../guards';

const AUDITS_NETWORK_MESSAGE =
  'Cannot reach the server. Start AuditsApi with dotnet run in AuditsApi, then try again.';

export function auditUserMessage(
  error: unknown,
  verb: 'loading' | 'creating' | 'updating' | 'deleting',
): string {
  if (error instanceof ApiClientError) {
    if (error.kind === 'network') {
      return AUDITS_NETWORK_MESSAGE;
    }
    return error.message;
  }

  if (error instanceof TypeError) {
    return AUDITS_NETWORK_MESSAGE;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return `Something went wrong while ${verb} the audit.`;
}

export function parseAuditId(id: string | undefined): number | null {
  if (id === undefined) return null;
  const n = Number(id);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null;
  if (id !== String(n)) return null;
  return n;
}

const base = import.meta.env.VITE_AUDITS_API_URL ?? 'http://localhost:5135';

export type AuditStatus =
  | 'Scheduled'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled';

export type Audit = {
  id: number;
  title: string;
  description: string;
  auditDate: string;
  status: AuditStatus;
  createdBy: string;
};

export type AuditRequest = {
  title: string;
  description: string;
  auditDate: string;
  status: AuditStatus;
  createdBy: string;
};

// id is included for type completeness and required-field clarity at call sites;
// the server authoritatively uses the route parameter, not the body value.
export type PutAuditRequest = AuditRequest & {
  id: number;
};

export type FetchAuditsParams = {
  status?: AuditStatus;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export type PagedAuditsResult = {
  items: Audit[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const STATUSES: readonly AuditStatus[] = [
  'Scheduled',
  'InProgress',
  'Completed',
  'Cancelled',
];

function isAuditStatus(value: unknown): value is AuditStatus {
  return (
    typeof value === 'string' && (STATUSES as readonly string[]).includes(value)
  );
}

function isAudit(value: unknown): value is Audit {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'number' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    typeof value.auditDate === 'string' &&
    isAuditStatus(value.status) &&
    typeof value.createdBy === 'string'
  );
}

function isPagedAuditsResult(value: unknown): value is PagedAuditsResult {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.items) &&
    value.items.every(isAudit) &&
    typeof value.page === 'number' &&
    typeof value.pageSize === 'number' &&
    typeof value.totalCount === 'number' &&
    typeof value.totalPages === 'number'
  );
}

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

export async function fetchAudits(
  params: FetchAuditsParams = {},
): Promise<PagedAuditsResult> {
  const searchParams = new URLSearchParams();

  if (params.status !== undefined) {
    searchParams.set('status', params.status);
  }
  if (params.sortBy !== undefined) {
    searchParams.set('sortBy', params.sortBy);
  }
  if (params.sortDirection !== undefined) {
    searchParams.set('sortDirection', params.sortDirection);
  }
  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }
  if (params.pageSize !== undefined) {
    searchParams.set('pageSize', String(params.pageSize));
  }

  const query = searchParams.toString();
  const path = query ? `/audits?${query}` : '/audits';

  const response = await request(path);

  if (!response.ok) {
    throw new ApiClientError(
      await parseErrorMessage(response),
      'http',
      response.status,
    );
  }

  const body = await parseJson(response);
  if (!isPagedAuditsResult(body)) {
    throw new ApiClientError('Unexpected response format from server', 'parse');
  }

  return body;
}

export async function createAudit(data: AuditRequest): Promise<Audit> {
  const response = await request('/audits', {
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
  if (!isAudit(body)) {
    throw new ApiClientError('Unexpected response format from server', 'parse');
  }

  return body;
}

export async function getAudit(id: number): Promise<Audit> {
  const response = await request(`/audits/${id}`);

  if (!response.ok) {
    throw new ApiClientError(
      await parseErrorMessage(response),
      'http',
      response.status,
    );
  }

  const body = await parseJson(response);
  if (!isAudit(body)) {
    throw new ApiClientError('Unexpected response format from server', 'parse');
  }

  return body;
}

export async function updateAudit(
  id: number,
  data: PutAuditRequest,
): Promise<Audit> {
  const response = await request(`/audits/${id}`, {
    method: 'PUT',
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
  if (!isAudit(body)) {
    throw new ApiClientError('Unexpected response format from server', 'parse');
  }

  return body;
}

export async function deleteAudit(id: number): Promise<void> {
  const response = await request(`/audits/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new ApiClientError(
      await parseErrorMessage(response),
      'http',
      response.status,
    );
  }
}
