import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type IncidentPageChromeProps = {
  heading: string;
  subtitle?: string;
};

export function IncidentPageChrome({
  heading,
  subtitle,
}: IncidentPageChromeProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1>{heading}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <Button variant="outline" asChild className="w-full sm:w-auto">
        <Link to="/incidents">Back to incidents</Link>
      </Button>
    </div>
  );
}
