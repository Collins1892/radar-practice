import { matchPath } from 'react-router-dom';
import {
  AUDIT_CREATE_HEADING,
  AUDIT_DETAIL_HEADING,
  AUDIT_EDIT_HEADING,
} from '@/components/auditPageCopy';
import {
  INCIDENT_CREATE_HEADING,
  INCIDENT_DETAIL_HEADING,
  INCIDENT_EDIT_HEADING,
} from '@/components/incidentPageCopy';

export const SITE_TITLE = 'Radar Practice';

export function formatPageTitle(pageTitle: string): string {
  return `${pageTitle} | ${SITE_TITLE}`;
}

export function resolvePageTitle(pathname: string): string {
  if (matchPath({ path: '/audits/create', end: true }, pathname)) {
    return formatPageTitle(AUDIT_CREATE_HEADING);
  }
  if (matchPath({ path: '/audits/:id/edit', end: true }, pathname)) {
    return formatPageTitle(AUDIT_EDIT_HEADING);
  }
  if (matchPath({ path: '/audits/:id', end: true }, pathname)) {
    return formatPageTitle(AUDIT_DETAIL_HEADING);
  }
  if (matchPath({ path: '/audits', end: true }, pathname)) {
    return formatPageTitle('Audits');
  }
  if (matchPath({ path: '/incidents/create', end: true }, pathname)) {
    return formatPageTitle(INCIDENT_CREATE_HEADING);
  }
  if (matchPath({ path: '/incidents/:id/edit', end: true }, pathname)) {
    return formatPageTitle(INCIDENT_EDIT_HEADING);
  }
  if (matchPath({ path: '/incidents/:id', end: true }, pathname)) {
    return formatPageTitle(INCIDENT_DETAIL_HEADING);
  }
  if (matchPath({ path: '/incidents', end: true }, pathname)) {
    return formatPageTitle('Incidents');
  }
  if (matchPath({ path: '/components', end: true }, pathname)) {
    return formatPageTitle('Components');
  }
  if (matchPath({ path: '/items', end: true }, pathname)) {
    return formatPageTitle('Items');
  }
  if (matchPath({ path: '/', end: true }, pathname)) {
    return formatPageTitle('Components');
  }
  return SITE_TITLE;
}
