const ITEMS_API = 'http://localhost:5133';
const INCIDENTS_API = 'http://localhost:5134';
const AUDITS_API = 'http://localhost:5135';

export type Item = {
  id: number;
  name: string;
  price: number;
};

export type CreateItemRequest = {
  name: string;
  price: number;
};

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

export type CreateIncidentRequest = {
  title: string;
  description: string;
  location: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedDate: string;
};

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

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
    ) {
      return (body as { error: string }).error;
    }
  } catch {
    /* ignore non-JSON bodies */
  }
  return response.statusText || `Request failed (${response.status})`;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as T;
}

async function deleteResource(url: string): Promise<void> {
  const response = await fetch(url, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

export async function createItem(data: CreateItemRequest): Promise<Item> {
  return postJson<Item>(`${ITEMS_API}/items`, data);
}

export async function createIncident(
  data: CreateIncidentRequest,
): Promise<Incident> {
  return postJson<Incident>(`${INCIDENTS_API}/incidents`, data);
}

export async function createAudit(data: AuditRequest): Promise<Audit> {
  return postJson<Audit>(`${AUDITS_API}/audits`, data);
}

export async function deleteAudit(id: number): Promise<void> {
  await deleteResource(`${AUDITS_API}/audits/${id}`);
}
