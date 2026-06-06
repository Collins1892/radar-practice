import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, isValid, parseISO } from 'date-fns';
import {
  getIncident,
  incidentUserMessage,
  parseIncidentId,
  type Incident,
  type IncidentSeverity,
  type IncidentStatus,
} from '@/api/incidents';
import { INCIDENT_DETAIL_HEADING } from '@/components/IncidentForm';
import { Badge } from '@/components/Badge';
import { ErrorState } from '@/components/ErrorState';
import { IncidentPageChrome } from '@/components/IncidentPageChrome';
import { LoadingState } from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { formatPageTitle } from '@/pageTitle';

function severityBadgeVariant(
  severity: IncidentSeverity,
): 'default' | 'info' | 'warning' | 'danger' {
  switch (severity) {
    case 'Low':
      return 'default';
    case 'Medium':
      return 'info';
    case 'High':
      return 'warning';
    case 'Critical':
      return 'danger';
  }
}

function statusBadgeVariant(
  status: IncidentStatus,
): 'default' | 'info' | 'warning' | 'success' {
  switch (status) {
    case 'Open':
      return 'info';
    case 'InProgress':
      return 'warning';
    case 'Resolved':
      return 'success';
    case 'Closed':
      return 'default';
  }
}

function formatStatusLabel(status: IncidentStatus): string {
  switch (status) {
    case 'InProgress':
      return 'In Progress';
    default:
      return status;
  }
}

function formatReportedDate(value: string): string {
  const parsed = parseISO(value.slice(0, 10));
  return isValid(parsed) ? format(parsed, 'dd MMM yyyy') : String(value);
}

export function IncidentDetailView(): JSX.Element {
  const { id } = useParams();
  const incidentId = parseIncidentId(id);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(incidentId !== null);
  const [error, setError] = useState<string | null>(null);

  const loadIncident = useCallback(async (): Promise<void> => {
    if (incidentId === null) return;

    setError(null);
    setLoading(true);
    try {
      setIncident(await getIncident(incidentId));
    } catch (err) {
      setError(incidentUserMessage(err, 'loading'));
      setIncident(null);
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    if (incidentId !== null) {
      void loadIncident();
    }
  }, [incidentId, loadIncident]);

  // Refines the generic "Incident detail | Radar Practice" title from usePageTitle in App.tsx once incident data loads.
  useEffect(() => {
    if (incident !== null) {
      document.title = formatPageTitle(incident.title);
    }
  }, [incident]);

  if (incidentId === null) {
    return (
      <>
        <IncidentPageChrome heading={INCIDENT_DETAIL_HEADING} />
        <ErrorState
          title="Invalid incident"
          message="The incident ID in the URL is not valid."
        />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <IncidentPageChrome
          heading={INCIDENT_DETAIL_HEADING}
          subtitle={`Incident #${incidentId}`}
        />
        <LoadingState message="Loading incident…" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <IncidentPageChrome
          heading={INCIDENT_DETAIL_HEADING}
          subtitle={`Incident #${incidentId}`}
        />
        <ErrorState
          title="Could not load incident"
          message={error}
          onTryAgain={() => void loadIncident()}
        />
      </>
    );
  }

  if (incident === null) {
    return (
      <>
        <IncidentPageChrome
          heading={INCIDENT_DETAIL_HEADING}
          subtitle={`Incident #${incidentId}`}
        />
        <ErrorState
          title="Could not load incident"
          message="No incident data is available."
          onTryAgain={() => void loadIncident()}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1>{incident.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Incident #{incident.id}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/incidents">Back to incidents</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link to={`/incidents/${incident.id}/edit`}>Edit incident</Link>
          </Button>
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Description
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {incident.description}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Location
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {incident.location}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Severity
            </dt>
            <dd className="mt-1">
              <Badge
                variant={severityBadgeVariant(incident.severity)}
                size="sm"
              >
                {incident.severity}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Status
            </dt>
            <dd className="mt-1">
              <Badge variant={statusBadgeVariant(incident.status)} size="sm">
                {formatStatusLabel(incident.status)}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Reported date
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {formatReportedDate(incident.reportedDate)}
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
