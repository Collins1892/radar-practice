import type { JSX } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorState } from '@/components/ErrorState';
import { IncidentForm } from '@/components/IncidentForm';

function parseIncidentId(id: string | undefined): number | null {
  if (id === undefined) return null;
  const parsed = Number(id);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}

export function IncidentEditView(): JSX.Element {
  const { id } = useParams();
  const incidentId = parseIncidentId(id);

  if (incidentId === null) {
    return (
      <ErrorState
        title="Invalid incident"
        message="The incident ID in the URL is not valid."
      />
    );
  }

  return <IncidentForm mode="edit" incidentId={incidentId} />;
}
