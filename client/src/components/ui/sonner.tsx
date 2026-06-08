import * as React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps): React.ReactElement => {
  return (
    <Sonner
      theme="system"
      richColors
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="size-4" aria-hidden="true" />,
        info: <Info className="size-4" aria-hidden="true" />,
        warning: <AlertTriangle className="size-4" aria-hidden="true" />,
        error: <XCircle className="size-4" aria-hidden="true" />,
        loading: <Loader2 className="size-4 animate-spin" aria-hidden="true" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
          '--success-bg': 'var(--sonner-success-bg)',
          '--success-text': 'var(--sonner-success-text)',
          '--success-border': 'var(--sonner-success-border)',
          '--warning-bg': 'var(--sonner-warning-bg)',
          '--warning-text': 'var(--sonner-warning-text)',
          '--warning-border': 'var(--sonner-warning-border)',
          '--error-bg': 'var(--sonner-error-bg)',
          '--error-text': 'var(--sonner-error-text)',
          '--error-border': 'var(--sonner-error-border)',
          '--info-bg': 'var(--sonner-info-bg)',
          '--info-text': 'var(--sonner-info-text)',
          '--info-border': 'var(--sonner-info-border)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            'group-[.toaster]:border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg',
          closeButton:
            '!left-auto !right-0 !translate-x-[35%] !-translate-y-[35%]',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
