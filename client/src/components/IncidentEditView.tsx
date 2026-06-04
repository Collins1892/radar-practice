import type { JSX } from 'react';
import { useParams } from 'react-router-dom';
import { parseIncidentId } from '@/api/incidents';
import { ErrorState } from '@/components/ErrorState';
import { IncidentForm } from '@/components/IncidentForm';

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
