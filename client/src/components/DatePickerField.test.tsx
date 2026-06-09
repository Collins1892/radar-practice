import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DatePickerField } from './DatePickerField';
import { formFieldErrorId } from './formFieldUtils';

describe('DatePickerField', () => {
  const labelText = 'Incident date';

  function renderDatePickerField(
    overrides: Partial<ComponentProps<typeof DatePickerField>> = {},
  ): ReturnType<typeof render> {
    const {
      label = labelText,
      id = 'incident-date',
      value = undefined,
      onChange = vi.fn((): void => {}),
      placeholder = 'Pick incident date',
      ...rest
    } = overrides;

    return render(
      <DatePickerField
        label={label}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
      />,
    );
  }

  function getTrigger(): HTMLElement {
    return screen.getByLabelText(labelText);
  }

  it('displays the label text', (): void => {
    // Arrange — defaults via renderDatePickerField

    // Act
    renderDatePickerField();

    // Assert
    expect(screen.getByText(labelText)).toBeInTheDocument();
  });

  it('opens the calendar popover when the trigger is clicked', async (): Promise<void> => {
    // Arrange
    renderDatePickerField();
    expect(
      screen.queryByRole('button', { name: /previous month/i }),
    ).not.toBeInTheDocument();

    // Act
    fireEvent.click(getTrigger());

    // Assert
    await screen.findByRole('button', { name: /previous month/i });
  });

  it('shows error alert with message when error is provided', (): void => {
    // Arrange
    const errorMessage = 'Incident date is required.';
    const id = 'incident-date';

    // Act
    renderDatePickerField({ error: errorMessage });

    // Assert
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(errorMessage);
    expect(alert).toHaveAttribute('id', formFieldErrorId(id));
  });

  it('focuses the calendar when the popover opens', async (): Promise<void> => {
    // Arrange
    renderDatePickerField();

    // Act
    fireEvent.click(getTrigger());
    const previousMonthButton = await screen.findByRole('button', {
      name: /previous month/i,
    });

    // Assert
    const calendarRoot =
      previousMonthButton.closest('[data-slot="calendar"]') ??
      previousMonthButton.closest('.rdp-root');
    expect(calendarRoot).not.toBeNull();
    expect(calendarRoot).toContain(document.activeElement);
  });

  it('sets aria-invalid and aria-describedby on the trigger when error is provided', (): void => {
    // Arrange
    const errorMessage = 'Incident date is required.';
    const id = 'incident-date';

    // Act
    renderDatePickerField({ error: errorMessage });

    // Assert
    const trigger = screen.getByLabelText(labelText);
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-describedby', formFieldErrorId(id));
  });

  it('does not set aria-invalid or aria-describedby on the trigger when there is no error', (): void => {
    // Arrange — defaults via renderDatePickerField (no error prop)

    // Act
    renderDatePickerField();

    // Assert
    const trigger = screen.getByLabelText(labelText);
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('disables the trigger button when disabled is true', (): void => {
    // Arrange — defaults via renderDatePickerField

    // Act
    renderDatePickerField({ disabled: true });

    // Assert
    expect(getTrigger()).toBeDisabled();
  });

  it('does not open the calendar popover when disabled and the trigger is clicked', (): void => {
    // Arrange
    renderDatePickerField({ disabled: true });

    // Act
    fireEvent.click(getTrigger());

    // Assert
    expect(
      screen.queryByRole('button', { name: /previous month/i }),
    ).not.toBeInTheDocument();
  });

  it('closes the calendar popover when disabled becomes true while open', async (): Promise<void> => {
    // Arrange
    const onChange = vi.fn((): void => {});
    const { rerender } = render(
      <DatePickerField
        label={labelText}
        id="incident-date"
        value={undefined}
        onChange={onChange}
        placeholder="Pick incident date"
      />,
    );
    fireEvent.click(getTrigger());
    await screen.findByRole('button', { name: /previous month/i });

    // Act
    rerender(
      <DatePickerField
        label={labelText}
        id="incident-date"
        value={undefined}
        onChange={onChange}
        placeholder="Pick incident date"
        disabled={true}
      />,
    );

    // Assert
    expect(
      screen.queryByRole('button', { name: /previous month/i }),
    ).not.toBeInTheDocument();
  });
});
