import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getIncident } from '@/api/incidents';
import { IncidentEditView } from './IncidentEditView';

vi.mock('@/api/incidents', () => ({
  createIncident: vi.fn(),
  getIncident: vi.fn(),
  updateIncident: vi.fn(),
}));

function renderIncidentEditViewWithInvalidId(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/incidents/abc/edit']}>
      <Routes>
        <Route path="/incidents/:id/edit" element={<IncidentEditView />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('IncidentEditView', () => {
  beforeEach((): void => {
    vi.mocked(getIncident).mockReset();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('shows an error state when the id param is not a valid number', (): void => {
    // Arrange — invalid id via renderIncidentEditViewWithInvalidId

    // Act
    renderIncidentEditViewWithInvalidId();

    // Assert
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(getIncident).not.toHaveBeenCalled();
  });
});
