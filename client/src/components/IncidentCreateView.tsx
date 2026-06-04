import type { JSX } from 'react';
import { IncidentForm } from '@/components/IncidentForm';

export function IncidentCreateView(): JSX.Element {
  return <IncidentForm mode="create" />;
}
