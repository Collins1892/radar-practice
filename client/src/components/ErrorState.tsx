import * as React from 'react';

import { Button } from '@/components/ui/button';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onTryAgain?: () => void;
};

export const ErrorState = ({
  title = 'Something went wrong',
  message,
  onTryAgain,
}: ErrorStateProps): React.ReactElement => {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 py-8 text-center"
    >
      <p className="text-lg font-semibold text-foreground">{title}</p>

      {message ? (
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      ) : null}

      {onTryAgain ? (
        <Button type="button" onClick={onTryAgain}>
          Try again
        </Button>
      ) : null}
    </div>
  );
};
