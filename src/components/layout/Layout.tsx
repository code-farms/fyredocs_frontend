import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { CommandPaletteProvider } from '@/components/common/CommandPalette';

export const Layout = () => {
  return (
    <CommandPaletteProvider>
      <div className="min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        <Header />
        {/* At least one viewport tall (minus the 4rem header): while a lazy page
            loads, the Footer stays below the fold instead of showing and then
            jumping down when the content arrives (a CLS hit on every load). */}
        <main id="main-content" className="flex-1 flex flex-col bg-gradient-hero min-h-[calc(100vh-4rem)]">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </CommandPaletteProvider>
  );
};
