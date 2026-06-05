import type { JSX } from 'react';
import { useParams } from 'react-router-dom';
import { parseIncidentId } from '@/api/incidents';
import { ErrorState } from '@/components/ErrorState';
import {
  INCIDENT_EDIT_HEADING,
  INCIDENT_EDIT_SUBTITLE,
  IncidentForm,
} from '@/components/IncidentForm';
import { IncidentPageChrome } from '@/components/IncidentPageChrome';

export function IncidentEditView(): JSX.Element {
  const { id } = useParams();
  const incidentId = parseIncidentId(id);

  if (incidentId === null) {
    return (
      <>
        <IncidentPageChrome
          heading={INCIDENT_EDIT_HEADING}
          subtitle={INCIDENT_EDIT_SUBTITLE}
        />
        <ErrorState
          title="Invalid incident"
          message="The incident ID in the URL is not valid."
        />
      </>
    );
  }

  return <IncidentForm mode="edit" incidentId={incidentId} />;
}
