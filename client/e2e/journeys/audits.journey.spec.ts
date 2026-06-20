import { format, parseISO } from 'date-fns';
import { test, expect } from '@playwright/test';
import { createAudit, deleteAudit } from '../support/api';
import type { AuditRequest } from '../support/api';
import { AuditsPage } from '../pages/AuditsPage';

test.describe('audits: view and soft delete', () => {
  test('shows API-seeded audit on list and detail, then hides it after soft delete', async ({
    page,
  }): Promise<void> => {
    // Arrange
    const auditDate = format(new Date(), 'yyyy-MM-dd');
    const payload: AuditRequest = {
      title: `${Date.now()} E2E hand hygiene`,
      description: 'Quarterly ward review',
      auditDate,
      status: 'Scheduled',
      createdBy: 'E2E quality team',
    };
    const audit = await createAudit(payload);
    expect(audit.id).toBeGreaterThan(0);
    expect(audit.title).toBe(payload.title);

    const auditsPage = new AuditsPage(page);
    const formattedAuditDate = format(parseISO(auditDate), 'dd MMM yyyy');

    // Act — list (filter + sort so seeded row is on page 1) and detail by id
    await auditsPage.goto();
    await auditsPage.waitForListLoaded();
    await auditsPage.filterByStatus('Scheduled');
    await auditsPage.sortByTitleDescending();
    await expect(auditsPage.listAuditLink(audit.id)).toBeVisible();
    await auditsPage.gotoAudit(audit.id);

    // Assert — detail
    await expect(
      page.getByRole('heading', { name: payload.title }),
    ).toBeVisible();
    await expect(page.getByText(`Audit #${audit.id}`)).toBeVisible();
    await expect(page.getByText(payload.description)).toBeVisible();
    await expect(page.getByText(formattedAuditDate)).toBeVisible();
    await expect(page.getByText('Scheduled', { exact: true })).toBeVisible();
    await expect(page.getByText(payload.createdBy)).toBeVisible();

    // Act — soft delete via API
    await deleteAudit(audit.id);
    await page.reload();
    await auditsPage.waitForListLoaded();

    // Assert — removed from list
    await expect(auditsPage.auditLink(audit.id)).not.toBeVisible();

    // Act — navigate to deleted audit detail
    await page.goto(`/audits/${audit.id}`);

    // Assert — 404 not-found UI (API error path, not invalid-id copy)
    await expect(
      page.getByRole('heading', { name: 'Audit detail' }),
    ).toBeVisible();
    await expect(page.getByText(`Audit #${audit.id}`)).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Could not load audit');
    await expect(page.getByRole('alert')).toContainText('Audit not found.');
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
