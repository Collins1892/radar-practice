import * as React from 'react';

type EmptyStateProps = {
  title: string;
  message?: string;
  action?: React.ReactNode;
};

export const EmptyState = ({
  title,
  message,
  action,
}: EmptyStateProps): React.ReactElement => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-8 text-center"
    >
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {message ? (
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
};
