import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactElement;
};

export function FormField({
  label,
  htmlFor,
  error,
  required = false,
  children,
}: FormFieldProps): ReactElement {
  const errorId = `formfield-${htmlFor}-error`;
  const singleChild: ReactNode = Children.only(children);
  const enhancedChild: ReactNode = isValidElement(singleChild)
    ? cloneElement(singleChild, {
        'aria-describedby': error ? errorId : undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })
    : singleChild;

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

      {enhancedChild}

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
