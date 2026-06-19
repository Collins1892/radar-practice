import type { JSX } from 'react';
import { AuditForm } from '@/components/AuditForm';

export function AuditCreateView(): JSX.Element {
  return <AuditForm mode="create" />;
}
