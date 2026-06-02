import type { ComponentEntry } from './components/ComponentsView';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';

export const componentRegistry: ComponentEntry[] = [
  {
    name: 'Badge',
    description:
      'Compact status label with five colour variants, each paired with a distinct icon so colour is never the only differentiator.',
    preview: (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="info">Info</Badge>
      </div>
    ),
  },
  {
    name: 'LoadingState',
    description:
      'Centred loading spinner with accessible status role and optional message for background operations.',
    preview: (
      <div className="w-full py-6">
        <LoadingState message="Fetching latest items..." />
      </div>
    ),
  },
  {
    name: 'EmptyState',
    description:
      'Centred empty-state messaging with optional supporting text and a call-to-action slot.',
    preview: (
      <div className="w-full rounded-lg border border-dashed border-border p-6">
        <EmptyState
          title="No incidents reported"
          message="Create your first incident report to start tracking follow-up actions."
          action={
            <button
              type="button"
              className="rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Create incident
            </button>
          }
        />
      </div>
    ),
  },
  {
    name: 'EmptyState (Minimal)',
    description:
      'Minimal variant with title only for contexts where no action is required.',
    preview: (
      <div className="w-full rounded-lg border border-dashed border-border p-6">
        <EmptyState title="Nothing to show yet" />
      </div>
    ),
  },
  {
    name: 'ErrorState',
    description:
      'Centred error messaging with optional details and a retry button when a handler is provided.',
    preview: (
      <div className="w-full rounded-lg border border-dashed border-border p-6">
        <ErrorState
          title="Could not load data"
          message="Please try again in a moment."
          onRetry={() => void 0}
        />
      </div>
    ),
  },
  {
    name: 'ErrorState (No Retry)',
    description:
      'Error messaging without a retry action when no handler is provided.',
    preview: (
      <div className="w-full rounded-lg border border-dashed border-border p-6">
        <ErrorState
          title="Something went wrong"
          message="Try refreshing the page."
        />
      </div>
    ),
  },
];
