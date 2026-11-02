import { Suspense, useState, type FormEvent } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Search, Upload, User as UserIcon } from 'lucide-react';
import { PageLoading } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/AppSidebar';
import { CommandPaletteProvider } from '@/components/common/CommandPalette';
import { ActiveOrgProvider } from '@/components/app/ActiveOrgContext';
import { OrgSwitcher } from '@/components/app/OrgSwitcher';
import { NotificationBell } from '@/components/app/NotificationBell';
import { notificationsEnabled } from '@/lib/features';
import { useAuth } from '@/auth/useAuth';

const UPLOAD_LINKS = [
  { label: 'Merge PDF', to: '/merge-pdf' },
  { label: 'Compress PDF', to: '/compress-pdf' },
  { label: 'PDF to Word', to: '/pdf-to-word' },
  { label: 'Convert to PDF', to: '/word-to-pdf' },
];

/**
 * Shell for the authenticated user workspace (/app/*): sidebar + a top bar with
 * global search, an Upload CTA, notifications, and a profile menu. Separate from
 * the marketing Layout and the AdminLayout.
 */
function WorkspaceShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');

  const displayName = user?.fullName || user?.email || 'You';
  const initial = displayName.charAt(0).toUpperCase();

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/app/documents?q=${encodeURIComponent(q)}` : '/app/documents');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />

          <OrgSwitcher />

          <form onSubmit={onSearch} className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, tags, content…"
              className="h-9 pl-9 pr-12"
              aria-label="Search documents"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 text-caption font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Upload className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Upload</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Start a task</DropdownMenuLabel>
                {UPLOAD_LINKS.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/all-tools">Browse all tools…</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {notificationsEnabled && <NotificationBell />}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Account menu">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {initial}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  <span className="block truncate">{displayName}</span>
                  {user?.email && <span className="block truncate text-caption font-normal text-muted-foreground">{user.email}</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/my-files">
                    <UserIcon className="mr-2 h-4 w-4" aria-hidden />
                    My files
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" aria-hidden />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Wraps the workspace shell in the command-palette provider so ⌘K works inside
 * /app (the marketing Layout provides its own instance separately).
 */
export function UserLayout() {
  return (
    <ActiveOrgProvider>
      <CommandPaletteProvider>
        <WorkspaceShell />
      </CommandPaletteProvider>
    </ActiveOrgProvider>
  );
}

export default UserLayout;
