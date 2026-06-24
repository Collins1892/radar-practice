import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { toast } from 'sonner';
import { auditUserMessage, deleteAudit, parseAuditId } from '@/api/audits';
import { AuditPageChrome } from '@/components/AuditPageChrome';
import { Badge } from '@/components/Badge';
import { ErrorState } from '@/components/ErrorState';
import { InlineAlert } from '@/components/InlineAlert';
import { LoadingState } from '@/components/LoadingState';
import { Modal } from '@/components/Modal';
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

const AUDIT_DELETE_SUCCESS_MESSAGE = 'Audit deleted successfully.';

export function AuditDetailView(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams();
  const auditId = parseAuditId(id);
  const { audit, loading, error, reload } = useAudit(auditId);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (audit !== null) {
      document.title = formatPageTitle(audit.title);
    }
  }, [audit]);

  async function handleDeleteConfirm(confirmedAuditId: number): Promise<void> {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAudit(confirmedAuditId);
      toast.success(AUDIT_DELETE_SUCCESS_MESSAGE);
      navigate('/audits');
    } catch (err) {
      setDeleteError(auditUserMessage(err, 'updating'));
    } finally {
      setDeleting(false);
    }
  }

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
          <>
            <Button asChild className="w-full sm:w-auto">
              <Link to={`/audits/${audit.id}/edit`}>{AUDIT_EDIT_HEADING}</Link>
            </Button>
            <Modal
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  Delete audit
                </Button>
              }
              title="Delete audit?"
              description="This will permanently remove the audit from the list. This action cannot be undone."
            >
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DialogPrimitive.Close asChild>
                  <Button type="button" variant="outline" disabled={deleting}>
                    Cancel
                  </Button>
                </DialogPrimitive.Close>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleting}
                  onClick={() => void handleDeleteConfirm(audit.id)}
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

      {deleteError !== null ? (
        <InlineAlert variant="error" message={deleteError} className="mt-4" />
      ) : null}
    </>
  );
}
