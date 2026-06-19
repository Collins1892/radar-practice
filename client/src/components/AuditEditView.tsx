import type { JSX } from 'react';
import { useParams } from 'react-router-dom';
import { parseAuditId } from '@/api/audits';
import { AuditForm } from '@/components/AuditForm';
import { AuditPageChrome } from '@/components/AuditPageChrome';
import { ErrorState } from '@/components/ErrorState';
import { AUDIT_EDIT_HEADING } from '@/components/auditPageCopy';

export function AuditEditView(): JSX.Element {
  const { id } = useParams();
  const auditId = parseAuditId(id);

  if (auditId === null) {
    return (
      <>
        <AuditPageChrome heading={AUDIT_EDIT_HEADING} />
        <ErrorState
          title="Invalid audit"
          message="The audit ID in the URL is not valid."
        />
      </>
    );
  }

  return <AuditForm mode="edit" auditId={auditId} />;
}
