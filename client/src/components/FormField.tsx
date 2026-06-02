import type { ReactElement, ReactNode } from 'react';

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

/**
 * Renders a labelled form field wrapper with optional validation message.
 *
 * When `error` is present, the child input should receive
 * `aria-describedby="formfield-{htmlFor}-error"`.
 * The parent/consumer is responsible for wiring this attribute.
 */
export function FormField({
  label,
  htmlFor,
  error,
  required = false,
  children,
}: FormFieldProps): ReactElement {
  const errorId: string = `formfield-${htmlFor}-error`;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium leading-6 text-foreground"
      >
        {label}
        {required ? (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
