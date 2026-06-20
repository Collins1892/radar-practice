import { format, parseISO } from 'date-fns';
import { test, expect } from '@playwright/test';
import { createIncident } from '../support/api';
import type { CreateIncidentRequest } from '../support/api';
import { IncidentDetailPage } from '../pages/IncidentDetailPage';
import { IncidentFormPage } from '../pages/IncidentFormPage';
import { IncidentsPage } from '../pages/IncidentsPage';

test.describe('incidents: create validation', () => {
  test('shows title required and focuses title on empty submit', async ({
    page,
  }): Promise<void> => {
    // Arrange
    const formPage = new IncidentFormPage(page);
    await formPage.gotoCreate();

    // Act
    await formPage.submitCreate();

    // Assert
    await expect(page.getByText('Title is required.')).toBeVisible();
    await expect(formPage.titleInput).toBeFocused();
    await expect(page).toHaveURL('/incidents/create');
  });
});

test.describe('incidents: view and edit', () => {
  test('shows API-seeded incident on list and detail, then edits status via UI', async ({
    page,
  }): Promise<void> => {
    // Arrange
    const reportedDate = format(new Date(), 'yyyy-MM-dd');
    const payload: CreateIncidentRequest = {
      title: `${Date.now()} E2E spill`,
      description: 'Water on floor',
      location: 'Building 2, level 1',
      severity: 'Medium',
      status: 'Open',
      reportedDate,
    };
    const incident = await createIncident(payload);
    expect(incident.id).toBeGreaterThan(0);
    expect(incident.title).toBe(payload.title);

    const incidentsPage = new IncidentsPage(page);
    const detailPage = new IncidentDetailPage(page);
    const formPage = new IncidentFormPage(page);
    const formattedReportedDate = format(parseISO(reportedDate), 'dd MMM yyyy');

    // Act — list (filter + sort so seeded row is on page 1) and detail by id
    await incidentsPage.goto();
    await incidentsPage.waitForListLoaded();
    await incidentsPage.filterByStatus('Open');
    await incidentsPage.filterBySeverity('Medium');
    await incidentsPage.sortByTitleDescending();
    await expect(incidentsPage.listIncidentLink(incident.id)).toBeVisible();
    await incidentsPage.gotoIncident(incident.id);

    // Assert — detail
    await expect(
      page.getByRole('heading', { name: payload.title }),
    ).toBeVisible();
    await expect(page.getByText(`Incident #${incident.id}`)).toBeVisible();
    await expect(page.getByText(payload.description)).toBeVisible();
    await expect(page.getByText(payload.location)).toBeVisible();
    await expect(page.getByText('Medium', { exact: true })).toBeVisible();
    await expect(page.getByText('Open', { exact: true })).toBeVisible();
    await expect(page.getByText(formattedReportedDate)).toBeVisible();

    // Act — edit status
    await detailPage.clickEdit();
    await expect(
      page.getByRole('heading', { name: 'Edit incident' }),
    ).toBeVisible();
    await formPage.selectStatus('In Progress');
    await formPage.submitEdit();

    // Assert — updated on list
    await expect(page).toHaveURL('/incidents');
    await incidentsPage.waitForListLoaded();
    await incidentsPage.filterByStatus('In Progress');
    await incidentsPage.sortByTitleDescending();
    await expect(incidentsPage.dataTable).toBeVisible();
    await expect(incidentsPage.listIncidentLink(incident.id)).toBeVisible();
    await expect(
      incidentsPage.dataTable
        .getByRole('row')
        .filter({ hasText: payload.title })
        .getByText('In Progress', { exact: true }),
    ).toBeVisible();
  });
});
