import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  deleteIncident,
  getIncident,
  incidentUserMessage,
  parseIncidentId,
  type Incident,
} from '@/api/incidents';
import {
  formatReportedDate,
  formatStatusLabel,
  severityBadgeVariant,
  statusBadgeVariant,
} from '@/components/incidentDisplay';
import {
  INCIDENT_DETAIL_HEADING,
  INCIDENT_EDIT_HEADING,
} from '@/components/incidentPageCopy';
import { Badge } from '@/components/Badge';
import { ErrorState } from '@/components/ErrorState';
import { IncidentPageChrome } from '@/components/IncidentPageChrome';
import { InlineAlert } from '@/components/InlineAlert';
import { LoadingState } from '@/components/LoadingState';
import { Modal, ModalClose } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { formatPageTitle } from '@/pageTitle';

const INCIDENT_DELETE_SUCCESS_MESSAGE = 'Incident deleted successfully.';

export function IncidentDetailView(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams();
  const incidentId = parseIncidentId(id);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(incidentId !== null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

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
    if (incident !== null && incident.id === incidentId) {
      document.title = formatPageTitle(incident.title);
    }
  }, [incident, incidentId]);

  const handleDeleteModalOpenChange = useCallback(
    (open: boolean): void => {
      if (!open && deleting) return;
      setDeleteModalOpen(open);
      if (!open) setDeleteError(null);
    },
    [deleting],
  );

  const handleDeleteConfirm = useCallback(
    async (confirmedIncidentId: number): Promise<void> => {
      setDeleteError(null);
      setDeleting(true);
      try {
        await deleteIncident(confirmedIncidentId);
        toast.success(INCIDENT_DELETE_SUCCESS_MESSAGE);
        navigate('/incidents');
      } catch (err) {
        setDeleteError(incidentUserMessage(err, 'deleting'));
      } finally {
        setDeleting(false);
      }
    },
    [navigate],
  );

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
      <IncidentPageChrome
        heading={incident.title}
        subtitle={`Incident #${incident.id}`}
        actions={
          <>
            <Button asChild className="w-full sm:w-auto">
              <Link to={`/incidents/${incident.id}/edit`}>
                {INCIDENT_EDIT_HEADING}
              </Link>
            </Button>
            <Modal
              open={deleteModalOpen}
              onOpenChange={handleDeleteModalOpenChange}
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  Delete incident
                </Button>
              }
              title="Delete incident?"
              description="This removes the incident from the list. You won't be able to access it from the app afterwards."
            >
              {deleteError !== null ? (
                <InlineAlert
                  variant="error"
                  message={deleteError}
                  className="mb-4"
                />
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <ModalClose asChild>
                  <Button type="button" variant="outline" disabled={deleting}>
                    Cancel
                  </Button>
                </ModalClose>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleting}
                  aria-busy={deleting}
                  onClick={() => void handleDeleteConfirm(incident.id)}
                >
                  {deleting ? 'Deleting…' : 'Confirm delete'}
                </Button>
              </div>
            </Modal>
          </>
        }
      />

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
