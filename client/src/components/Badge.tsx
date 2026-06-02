import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Tag,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground border-border',
        success:
          'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
        warning:
          'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
        danger:
          'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900',
        info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900',
      },
      size: {
        sm: 'text-xs px-1.5 py-0.5 [&_svg]:size-3',
        md: 'text-sm px-2 py-0.5 [&_svg]:size-3.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const variantIcons: Record<BadgeVariant, LucideIcon> = {
  default: Tag,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
};

type BadgeProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  children: React.ReactNode;
} & VariantProps<typeof badgeVariants>;

/**
 * A compact status label rendered as a span. Each variant pairs a distinct
 * colour with a distinct leading icon so colour is never the only signal.
 *
 * `children` are required: the icon is decorative (`aria-hidden`), so the text
 * content is the accessible label for the badge.
 */
export const Badge = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps): React.ReactElement => {
  const Icon = variantIcons[variant ?? 'default'];

  return (
    <span
      {...props}
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size, className }))}
    >
      <Icon aria-hidden="true" />
      {children}
    </span>
  );
};
