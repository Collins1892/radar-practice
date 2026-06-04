import { ApiClientError } from '../errors';
import { isApiErrorBody, isRecord } from '../guards';

const INCIDENTS_NETWORK_MESSAGE =
  'Cannot reach the server. Start IncidentsApi with dotnet run in IncidentsApi, then try again.';

export function incidentUserMessage(
  error: unknown,
  verb: 'loading' | 'creating' | 'updating',
): string {
  if (error instanceof ApiClientError) {
    if (error.kind === 'network') {
      return INCIDENTS_NETWORK_MESSAGE;
    }
    return error.message;
  }

  if (error instanceof TypeError) {
    return INCIDENTS_NETWORK_MESSAGE;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return `Something went wrong while ${verb} the incident.`;
}

export function parseIncidentId(id: string | undefined): number | null {
  if (id === undefined) return null;
  const n = Number(id);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1 ? n : null;
}

const base = import.meta.env.VITE_INCIDENTS_API_URL ?? 'http://localhost:5134';

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type IncidentStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed';

export type Incident = {
  id: number;
  title: string;
  description: string;
  location: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedDate: string;
};

export type FetchIncidentsParams = {
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export type PagedIncidentsResult = {
  items: Incident[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type CreateIncidentRequest = {
  title: string;
  description: string;
  location: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedDate: string;
};

const SEVERITIES: readonly IncidentSeverity[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

const STATUSES: readonly IncidentStatus[] = [
  'Open',
  'InProgress',
  'Resolved',
  'Closed',
];

function isIncidentSeverity(value: unknown): value is IncidentSeverity {
  return (
    typeof value === 'string' &&
    (SEVERITIES as readonly string[]).includes(value)
  );
}

function isIncidentStatus(value: unknown): value is IncidentStatus {
  return (
    typeof value === 'string' && (STATUSES as readonly string[]).includes(value)
  );
}

function isIncident(value: unknown): value is Incident {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'number' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    typeof value.location === 'string' &&
    isIncidentSeverity(value.severity) &&
    isIncidentStatus(value.status) &&
    typeof value.reportedDate === 'string'
  );
}

function isPagedIncidentsResult(value: unknown): value is PagedIncidentsResult {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.items) &&
    value.items.every(isIncident) &&
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

export async function fetchIncidents(
  params: FetchIncidentsParams = {},
): Promise<PagedIncidentsResult> {
  const searchParams = new URLSearchParams();

  if (params.severity !== undefined) {
    searchParams.set('severity', params.severity);
  }
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
  searchParams.set('pageSize', String(params.pageSize ?? 25));

  const query = searchParams.toString();
  const path = query ? `/incidents?${query}` : '/incidents';

  const response = await request(path);

  if (!response.ok) {
    throw new ApiClientError(
      await parseErrorMessage(response),
      'http',
      response.status,
    );
  }

  const body = await parseJson(response);
  if (!isPagedIncidentsResult(body)) {
    throw new ApiClientError('Unexpected response format from server', 'parse');
  }

  return body;
}

export async function createIncident(
  data: CreateIncidentRequest,
): Promise<Incident> {
  const response = await request('/incidents', {
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
  if (!isIncident(body)) {
    throw new ApiClientError('Unexpected response format from server', 'parse');
  }

  return body;
}

export async function getIncident(id: number): Promise<Incident> {
  const response = await request(`/incidents/${id}`);

  if (!response.ok) {
    throw new ApiClientError(
      await parseErrorMessage(response),
      'http',
      response.status,
    );
  }

  const body = await parseJson(response);
  if (!isIncident(body)) {
    throw new ApiClientError('Unexpected response format from server', 'parse');
  }

  return body;
}

export async function updateIncident(
  id: number,
  data: CreateIncidentRequest,
): Promise<Incident> {
  const response = await request(`/incidents/${id}`, {
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
  if (!isIncident(body)) {
    throw new ApiClientError('Unexpected response format from server', 'parse');
  }

  return body;
}
