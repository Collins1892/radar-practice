import * as React from 'react';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export const ErrorState = ({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps): React.ReactElement => {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 py-8 text-center"
    >
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>

      {message ? (
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      ) : null}

      {onRetry ? (
        <button
          type="button"
          onClick={() => {
            onRetry();
          }}
          className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
};
