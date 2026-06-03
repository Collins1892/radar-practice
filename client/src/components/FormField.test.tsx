import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { FormField } from './FormField';
import { formFieldErrorId } from './formFieldUtils';

describe('FormField', () => {
  const defaultInput = (<input id="item-name" type="text" />) as ReactElement;

  function renderFormField(
    overrides: Partial<ComponentProps<typeof FormField>> = {},
  ): ReturnType<typeof render> {
    const {
      label = 'Item name',
      htmlFor = 'item-name',
      children = defaultInput,
      ...rest
    } = overrides;

    return render(
      <FormField label={label} htmlFor={htmlFor} {...rest}>
        {children}
      </FormField>,
    );
  }

  it('displays the label text', (): void => {
    // Arrange — defaults via renderFormField

    // Act
    renderFormField();

    // Assert
    expect(screen.getByText('Item name')).toBeInTheDocument();
  });

  it('shows error alert and sets aria-invalid and aria-describedby on the input when error is provided', (): void => {
    // Arrange
    const errorMessage = 'Price must be a positive amount.';
    const htmlFor = 'item-price';

    // Act
    renderFormField({
      label: 'Price',
      htmlFor,
      error: errorMessage,
      children: <input id={htmlFor} type="text" />,
    });

    // Assert
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(errorMessage);
    expect(alert).toHaveAttribute('id', formFieldErrorId(htmlFor));

    const input = screen.getByLabelText('Price');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      formFieldErrorId(htmlFor),
    );
  });

  it('does not show alert or aria-invalid or aria-describedby on the input when there is no error', (): void => {
    // Arrange — defaults via renderFormField (no error prop)

    // Act
    renderFormField();

    // Assert
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    const input = screen.getByLabelText('Item name');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});
