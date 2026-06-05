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

// whitespace-nowrap keeps short labels on one line (required visual design) but
// prevents wrapping in narrow containers (WCAG 2.2 SC 1.4.10 Reflow). Consumers
// should keep badge text to 15 characters or fewer (e.g. "In Progress", "Critical").
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        // Border aids separation on light page backgrounds; border-border vs bg-muted
        // is ~1.16:1 (below SC 1.4.11 3:1). Identification uses text + icon, not border.
        default: 'bg-muted text-foreground border border-border',
        success:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        warning:
          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
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
 *
 * Presentational only — not designed for keyboard interaction. Consumers should
 * not pass `tabIndex` or interactive roles (e.g. `role="button"`); Badge has no
 * `focus-visible` ring styles.
 *
 * If a parent updates a Badge value dynamically (e.g. after an edit), the parent
 * should provide a live region (`role="status"` or `aria-live="polite"`) at the
 * screen level — not inside Badge itself.
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
