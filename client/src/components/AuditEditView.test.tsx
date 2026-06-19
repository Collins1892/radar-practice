import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAudit } from '@/api/audits';
import { AUDIT_EDIT_HEADING } from '@/components/auditPageCopy';
import { AuditEditView } from './AuditEditView';

vi.mock('@/api/audits', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/audits')>();
  return {
    ...actual,
    getAudit: vi.fn(),
  };
});

function renderAuditEditViewWithInvalidId(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/audits/abc/edit']}>
      <Routes>
        <Route path="/audits/:id/edit" element={<AuditEditView />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuditEditView', () => {
  beforeEach((): void => {
    vi.mocked(getAudit).mockReset();
  });

  it('shows an error state when the id param is not a valid number', (): void => {
    // Arrange — invalid id via renderAuditEditViewWithInvalidId

    // Act
    renderAuditEditViewWithInvalidId();

    // Assert
    expect(
      screen.getByRole('heading', { name: AUDIT_EDIT_HEADING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to audits' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(getAudit).not.toHaveBeenCalled();
  });
});
