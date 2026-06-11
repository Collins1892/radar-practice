import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  function renderModal(
    overrides: Partial<ComponentProps<typeof Modal>> = {},
  ): ReturnType<typeof render> {
    const { children: overrideChildren, trigger, title, ...rest } = overrides;

    return render(
      <Modal
        trigger={trigger ?? <button>Open modal</button>}
        title={title ?? 'Test title'}
        {...rest}
      >
        {overrideChildren ?? <p>Modal body content</p>}
      </Modal>,
    );
  }

  it('renders trigger button', (): void => {
    // Arrange

    // Act
    renderModal();

    // Assert
    expect(
      screen.getByRole('button', { name: 'Open modal' }),
    ).toBeInTheDocument();
  });

  it('opens on trigger click', async (): Promise<void> => {
    // Arrange
    renderModal();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));

    // Assert
    expect(await screen.findByText('Test title')).toBeVisible();
  });

  it('displays title and body content', async (): Promise<void> => {
    // Arrange
    renderModal();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));

    // Assert
    expect(await screen.findByText('Test title')).toBeVisible();
    expect(screen.getByText('Modal body content')).toBeVisible();
  });

  it('closes on close button click', async (): Promise<void> => {
    // Arrange
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));
    await screen.findByText('Test title');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // Assert
    expect(screen.queryByText('Test title')).not.toBeInTheDocument();
  });

  it('closes on ESC key', async (): Promise<void> => {
    // Arrange
    const user = userEvent.setup();
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));
    await screen.findByText('Test title');

    // Act
    await user.keyboard('{Escape}');

    // Assert
    expect(screen.queryByText('Test title')).not.toBeInTheDocument();
  });

  it('closes on backdrop click', async (): Promise<void> => {
    // Arrange
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));
    await screen.findByText('Test title');

    // Act
    // Radix overlay is portaled and has no ARIA role, so a DOM-level selector is unavoidable.
    const overlay = document.querySelector(
      'div[data-state="open"]:not([role="dialog"])',
    );
    if (overlay === null) {
      throw new Error('Expected dialog overlay to be present');
    }
    fireEvent.pointerDown(overlay);

    // Assert
    expect(screen.queryByText('Test title')).not.toBeInTheDocument();
  });

  it('omits aria-describedby when no description is provided', async (): Promise<void> => {
    // Arrange
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Open modal' }));
    await screen.findByText('Test title');

    // Act — (dialog open handled in Arrange)

    // Assert
    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveAttribute('aria-describedby');
  });
});
