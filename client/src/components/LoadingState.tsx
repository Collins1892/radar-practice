import * as React from 'react';
import { cn } from '@/lib/utils';

type LoadingStateProps = {
  message?: string;
  variant?: 'block' | 'overlay';
};

export const LoadingState = ({
  message = 'Loading...',
  variant = 'block',
}: LoadingStateProps): React.ReactElement => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-muted-foreground',
        variant === 'overlay'
          ? 'pointer-events-none absolute inset-0 z-10 bg-background/60'
          : 'py-8',
      )}
    >
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary motion-reduce:animate-none motion-reduce:opacity-75"
      />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};
