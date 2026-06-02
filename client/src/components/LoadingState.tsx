import * as React from 'react';

type LoadingStateProps = {
  message?: string;
};

export const LoadingState = ({
  message = 'Loading...',
}: LoadingStateProps): React.ReactElement => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground"
    >
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary motion-reduce:animate-none motion-reduce:opacity-75"
      />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};
