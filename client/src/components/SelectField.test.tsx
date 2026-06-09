import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SelectField } from './SelectField';
import { formFieldErrorId } from './formFieldUtils';

describe('SelectField', () => {
  const defaultOptions = [{ value: 'low', label: 'Low' }];

  function renderSelectField(
    overrides: Partial<ComponentProps<typeof SelectField>> = {},
  ): ReturnType<typeof render> {
    const {
      label = 'Severity',
      id = 'incident-severity',
      value = '',
      onValueChange = vi.fn((): void => {}),
      options = defaultOptions,
      ...rest
    } = overrides;

    return render(
      <SelectField
        label={label}
        id={id}
        value={value}
        onValueChange={onValueChange}
        options={options}
        {...rest}
      />,
    );
  }

  it('displays the label text', (): void => {
    // Arrange — defaults via renderSelectField

    // Act
    renderSelectField();

    // Assert
    expect(screen.getByText('Severity')).toBeInTheDocument();
  });

  it('shows error alert and sets aria-invalid and aria-describedby on the select trigger when error is provided', (): void => {
    // Arrange
    const errorMessage = 'Severity is required.';
    const id = 'incident-severity';

    // Act
    renderSelectField({ error: errorMessage });

    // Assert
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(errorMessage);
    expect(alert).toHaveAttribute('id', formFieldErrorId(id));

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-describedby', formFieldErrorId(id));
  });

  it('does not show alert or aria-invalid or aria-describedby on the select trigger when there is no error', (): void => {
    // Arrange — defaults via renderSelectField (no error prop)

    // Act
    renderSelectField();

    // Assert
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    const trigger = screen.getByRole('combobox');
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('disables the select trigger when disabled is true', (): void => {
    // Arrange — defaults via renderSelectField

    // Act
    renderSelectField({ disabled: true });

    // Assert
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
