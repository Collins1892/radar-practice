import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { ComponentsView } from './ComponentsView';
import type { ComponentEntry } from './ComponentsView';

function AlphaPreview(): ReactElement {
  return <p>Alpha preview body</p>;
}

function BetaPreview(): ReactElement {
  return <p>Beta preview body</p>;
}

describe('ComponentsView', () => {
  const entries: ComponentEntry[] = [
    {
      name: 'Alpha',
      description: 'First registered primitive.',
      preview: AlphaPreview,
    },
    {
      name: 'Beta',
      description: 'Second registered primitive.',
      preview: BetaPreview,
    },
  ];

  function renderComponentsView(
    components: ComponentEntry[] = entries,
  ): ReturnType<typeof render> {
    return render(<ComponentsView components={components} />);
  }

  it('renders the selected entry preview component and swaps it when another entry is selected', (): void => {
    // Arrange
    renderComponentsView();

    // Assert — first entry selected by default, its preview component is mounted
    expect(
      screen.getByRole('heading', { level: 2, name: 'Alpha' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Alpha preview body')).toBeInTheDocument();
    expect(screen.queryByText('Beta preview body')).not.toBeInTheDocument();

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Beta' }));

    // Assert — selection swaps to the second entry's preview component
    expect(
      screen.getByRole('heading', { level: 2, name: 'Beta' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Beta preview body')).toBeInTheDocument();
    expect(screen.queryByText('Alpha preview body')).not.toBeInTheDocument();
  });

  it('shows an empty message and keeps the page heading when no components are registered', (): void => {
    // Arrange
    const noComponents: ComponentEntry[] = [];

    // Act
    renderComponentsView(noComponents);

    // Assert — empty branch renders its message and still shows the page heading
    expect(
      screen.getByText('No components registered yet.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Components' }),
    ).toBeInTheDocument();

    // Assert — no selection UI or preview is rendered
    expect(
      screen.queryByRole('navigation', { name: 'Components' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Alpha preview body')).not.toBeInTheDocument();
  });
});
