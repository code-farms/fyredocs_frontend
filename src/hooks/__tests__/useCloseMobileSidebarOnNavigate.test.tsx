import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useCloseMobileSidebarOnNavigate } from '../useCloseMobileSidebarOnNavigate';

const sidebar = { isMobile: true, setOpenMobile: vi.fn() };
vi.mock('@/components/ui/sidebar', () => ({ useSidebar: () => sidebar }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={['/admin/business']}>{children}</MemoryRouter>
);

const renderWithNavigate = () =>
  renderHook(
    () => {
      useCloseMobileSidebarOnNavigate();
      return useNavigate();
    },
    { wrapper },
  );

describe('useCloseMobileSidebarOnNavigate', () => {
  beforeEach(() => {
    sidebar.setOpenMobile.mockReset();
  });

  it('closes the mobile sheet on every navigation, including to the current path', () => {
    sidebar.isMobile = true;
    const { result } = renderWithNavigate();
    sidebar.setOpenMobile.mockReset();

    act(() => result.current('/admin/growth'));
    expect(sidebar.setOpenMobile).toHaveBeenLastCalledWith(false);

    sidebar.setOpenMobile.mockReset();
    act(() => result.current('/admin/growth'));
    expect(sidebar.setOpenMobile).toHaveBeenCalledWith(false);
  });

  it('leaves the sidebar alone on desktop', () => {
    sidebar.isMobile = false;
    const { result } = renderWithNavigate();
    act(() => result.current('/admin/growth'));
    expect(sidebar.setOpenMobile).not.toHaveBeenCalled();
  });
});
