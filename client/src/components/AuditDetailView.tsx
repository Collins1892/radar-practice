import { useEffect } from 'react';
import type { JSX } from 'react';
import { Link, useParams } from 'react-router-dom';
import { parseAuditId } from '@/api/audits';
import { AuditPageChrome } from '@/components/AuditPageChrome';
import { Badge } from '@/components/Badge';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import {
  formatAuditDate,
  formatAuditStatusLabel,
  statusBadgeVariant,
} from '@/components/auditDisplay';
import {
  AUDIT_DETAIL_HEADING,
  AUDIT_EDIT_HEADING,
} from '@/components/auditPageCopy';
import { useAudit } from '@/hooks/useAudit';
import { Button } from '@/components/ui/button';
import { formatPageTitle } from '@/pageTitle';

export function AuditDetailView(): JSX.Element {
  const { id } = useParams();
  const auditId = parseAuditId(id);
  const { audit, loading, error, reload } = useAudit(auditId);

  useEffect(() => {
    if (audit !== null) {
      document.title = formatPageTitle(audit.title);
    }
  }, [audit]);

  if (auditId === null) {
    return (
      <>
        <AuditPageChrome heading={AUDIT_DETAIL_HEADING} />
        <ErrorState
          title="Invalid audit"
          message="The audit ID in the URL is not valid."
        />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <AuditPageChrome
          heading={AUDIT_DETAIL_HEADING}
          subtitle={`Audit #${auditId}`}
        />
        <LoadingState message="Loading audit…" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <AuditPageChrome
          heading={AUDIT_DETAIL_HEADING}
          subtitle={`Audit #${auditId}`}
        />
        <ErrorState
          title="Could not load audit"
          message={error}
          onTryAgain={() => void reload()}
        />
      </>
    );
  }

  if (audit === null) {
    return (
      <>
        <AuditPageChrome
          heading={AUDIT_DETAIL_HEADING}
          subtitle={`Audit #${auditId}`}
        />
        <ErrorState
          title="Could not load audit"
          message="No audit data is available."
          onTryAgain={() => void reload()}
        />
      </>
    );
  }

  return (
    <>
      <AuditPageChrome
        heading={audit.title}
        subtitle={`Audit #${audit.id}`}
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link to={`/audits/${audit.id}/edit`}>{AUDIT_EDIT_HEADING}</Link>
          </Button>
        }
      />

      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Description
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {audit.description || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Audit date
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {formatAuditDate(audit.auditDate)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Status
            </dt>
            <dd className="mt-1">
              <Badge variant={statusBadgeVariant(audit.status)} size="sm">
                {formatAuditStatusLabel(audit.status)}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Created by
            </dt>
            <dd className="mt-1 text-sm text-foreground">{audit.createdBy}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
