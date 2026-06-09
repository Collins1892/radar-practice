import { matchPath } from 'react-router-dom';
import {
  INCIDENT_CREATE_HEADING,
  INCIDENT_DETAIL_HEADING,
  INCIDENT_EDIT_HEADING,
} from './components/IncidentForm';

export const SITE_TITLE = 'Radar Practice';

export function formatPageTitle(pageTitle: string): string {
  return `${pageTitle} | ${SITE_TITLE}`;
}

export function resolvePageTitle(pathname: string): string {
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
  if (matchPath({ path: '/', end: true }, pathname)) {
    return formatPageTitle('Items');
  }
  return SITE_TITLE;
}
