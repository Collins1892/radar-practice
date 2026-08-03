import type { ComponentEntry } from './components/ComponentsView';
import {
  BadgePreview,
  DataTablePreview,
  DatePickerFieldPreview,
  EmptyStateMinimalPreview,
  EmptyStatePreview,
  ErrorStateNoRetryPreview,
  ErrorStatePreview,
  FormFieldErrorPreview,
  FormFieldPreview,
  InlineAlertPreview,
  LoadingStateOverlayPreview,
  LoadingStatePreview,
  ModalPreview,
  PaginationPreview,
  SelectFieldPreview,
  ToastPreview,
} from './componentPreviews';

export const componentRegistry: ComponentEntry[] = [
  {
    name: 'Pagination',
    description:
      'Page navigation controls with previous/next actions, active-page semantics, and ellipsis truncation for long page ranges.',
    preview: PaginationPreview,
  },
  {
    name: 'DataTable',
    description:
      'Generic sortable data table with semantic table markup, ARIA sort states, and an empty-state slot.',
    preview: DataTablePreview,
  },
  {
    name: 'Badge',
    description:
      'Compact status label with five colour variants, each paired with a distinct icon so colour is never the only differentiator.',
    preview: BadgePreview,
  },
  {
    name: 'LoadingState',
    description:
      'Centred block loading indicator for full-page or section-level waits; role="status" and aria-live="polite".',
    preview: LoadingStatePreview,
  },
  {
    name: 'LoadingState (Overlay)',
    description:
      'Absolute backdrop overlay for in-place refetch states over existing content; role="status" and aria-live="polite".',
    preview: LoadingStateOverlayPreview,
  },
  {
    name: 'EmptyState',
    description:
      'Centred empty-state messaging with optional supporting text and a call-to-action slot.',
    preview: EmptyStatePreview,
  },
  {
    name: 'EmptyState (Minimal)',
    description:
      'Minimal variant with title only for contexts where no action is required.',
    preview: EmptyStateMinimalPreview,
  },
  {
    name: 'ErrorState',
    description:
      'Centred error messaging with optional details and a retry button when a handler is provided.',
    preview: ErrorStatePreview,
  },
  {
    name: 'ErrorState (No Retry)',
    description:
      'Error messaging without a retry action when no handler is provided.',
    preview: ErrorStateNoRetryPreview,
  },
  {
    name: 'FormField',
    description:
      'Form field wrapper with WCAG-compliant label association and optional required indicator.',
    preview: FormFieldPreview,
  },
  {
    name: 'FormField (Error)',
    description:
      'Validation state showing an alert message linked by aria-describedby from the input.',
    preview: FormFieldErrorPreview,
  },
  {
    name: 'SelectField',
    description:
      'FormField-wrapped select using shadcn Select with keyboard-friendly severity options.',
    preview: SelectFieldPreview,
  },
  {
    name: 'DatePickerField',
    description:
      'FormField-wrapped date picker using a Popover trigger button and Calendar single-date selection.',
    preview: DatePickerFieldPreview,
  },
  {
    name: 'Modal',
    description:
      'Accessible dialog built on Radix Dialog with a composable trigger, title, body, and close button. Supports an optional description for screen readers. Focus-trapped and dismissible via ESC or backdrop click.',
    preview: ModalPreview,
  },
  {
    name: 'InlineAlert',
    description:
      'Inline status banner with four variants (success, warning, error, info) — each pairs a distinct colour with a distinct icon so status is never conveyed by colour alone. role="alert" for errors, role="status" aria-live="polite" for all others.',
    preview: InlineAlertPreview,
  },
  {
    name: 'Toast',
    description:
      'Sonner toast notifications with four variants (success, warning, error, info), each with a distinct icon and accessible colour pairing. Auto-dismiss after 3 seconds with a manual close button.',
    preview: ToastPreview,
  },
];
