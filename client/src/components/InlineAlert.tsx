import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const inlineAlertVariants = cva(
  'flex items-start gap-3 rounded-lg border p-4 text-sm',
  {
    variants: {
      variant: {
        success:
          'bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300',
        warning:
          'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300',
        error:
          'bg-red-100 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300',
        info: 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300',
      },
    },
  },
);

type InlineAlertVariant = NonNullable<
  VariantProps<typeof inlineAlertVariants>['variant']
>;

const variantIcons: Record<InlineAlertVariant, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

type InlineAlertProps = {
  variant: InlineAlertVariant;
  title?: string;
  message: string;
  className?: string;
};

export const InlineAlert = ({
  variant,
  title,
  message,
  className,
}: InlineAlertProps): React.ReactElement => {
  const Icon = variantIcons[variant];
  const isError = variant === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? undefined : 'polite'}
      className={cn(inlineAlertVariants({ variant }), className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>
        {title !== undefined && (
          <p className="font-semibold leading-none">{title}</p>
        )}
        <p className={title !== undefined ? 'mt-1' : undefined}>{message}</p>
      </div>
    </div>
  );
};
