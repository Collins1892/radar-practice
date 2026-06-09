import type { JSX } from 'react';
import { useParams } from 'react-router-dom';
import { parseIncidentId } from '@/api/incidents';
import { ErrorState } from '@/components/ErrorState';
import { IncidentForm } from '@/components/IncidentForm';
import { IncidentPageChrome } from '@/components/IncidentPageChrome';
import { INCIDENT_EDIT_HEADING } from '@/components/incidentPageCopy';

export function IncidentEditView(): JSX.Element {
  const { id } = useParams();
  const incidentId = parseIncidentId(id);

  if (incidentId === null) {
    return (
      <>
        <IncidentPageChrome heading={INCIDENT_EDIT_HEADING} />
        <ErrorState
          title="Invalid incident"
          message="The incident ID in the URL is not valid."
        />
      </>
    );
  }

  return <IncidentForm mode="edit" incidentId={incidentId} />;
}
