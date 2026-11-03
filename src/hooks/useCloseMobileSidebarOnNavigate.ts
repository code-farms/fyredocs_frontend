import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Closes the shadcn sidebar's mobile sheet after every navigation. On mobile
 * the sidebar is a Sheet over the page, and nothing in sidebar.tsx resets
 * `openMobile` when a link inside it is tapped. The page changed underneath
 * while the sheet stayed open and had to be dismissed by hand.
 *
 * Keyed on `location.key`, not pathname, so tapping the already-active tab
 * (a new history entry, same path) closes it too. Desktop collapse state
 * (`open`) is never touched. Must be called inside SidebarProvider.
 */
export function useCloseMobileSidebarOnNavigate() {
  const { key } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [key, isMobile, setOpenMobile]);
}
