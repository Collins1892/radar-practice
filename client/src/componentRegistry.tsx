import type { ComponentEntry } from './components/ComponentsView';
import { Badge } from '@/components/Badge';
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
];
