import { useCallback, useEffect, useState } from 'react';
import { auditUserMessage, getAudit, type Audit } from '@/api/audits';

export type UseAuditResult = {
  audit: Audit | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useAudit(auditId: number | null): UseAuditResult {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(auditId !== null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    if (auditId === null) return;

    setError(null);
    setLoading(true);
    try {
      setAudit(await getAudit(auditId));
    } catch (err) {
      setError(auditUserMessage(err, 'loading'));
      setAudit(null);
    } finally {
      setLoading(false);
    }
  }, [auditId]);

  // Known: no stale-response guard — rapid auditId changes can
  // cause earlier responses to overwrite later ones. Low impact for
  // a single-user app; fix in Week 7 with an active flag or AbortController.
  useEffect(() => {
    if (auditId !== null) {
      void reload();
    }
  }, [auditId, reload]);

  return { audit, loading, error, reload };
}
