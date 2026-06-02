import type { ComponentEntry } from './components/ComponentsView';
import { Badge } from '@/components/ui/Badge';

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
];
