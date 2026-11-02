import { Link } from 'react-router-dom';
import { History, LayoutDashboard, LogOut, Search, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCommandPalette } from '@/components/common/CommandPalette';
import { useAuth } from '@/auth/useAuth';
import { ToolsMegaMenu } from './ToolsMegaMenu';
import { MobileNav } from './MobileNav';
import { signupEnabled } from '@/lib/features';

const navLinkClass =
  'inline-flex h-10 items-center rounded-md px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground';

export const Header = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { setOpen: openPalette } = useCommandPalette();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-2">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Fyredocs home">
          <img src="/logo.png" alt="Fyredocs" className="h-16 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          <ToolsMegaMenu />
          {isAuthenticated && (
            <Link to="/dashboard" className={navLinkClass}>
              Dashboard
            </Link>
          )}
          <Link to="/pricing" className={navLinkClass}>
            Pricing
          </Link>
          <Link to="/docs" className={navLinkClass}>
            Docs
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => openPalette(true)}
            className="hidden h-9 w-44 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex lg:w-56"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="pointer-events-none rounded border bg-muted px-1.5 text-caption font-medium">⌘K</kbd>
          </button>

          <ThemeToggle />

          {!isLoading && !isAuthenticated && (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild>
                <Link to="/signin">Login</Link>
              </Button>
              {signupEnabled && (
                <Button asChild>
                  <Link to="/signup">Sign up</Link>
                </Button>
              )}
            </div>
          )}

          {!isLoading && isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.image || undefined} alt={user?.fullName ?? user?.email ?? 'Profile'} />
                    <AvatarFallback>
                      <User className="h-4 w-4" aria-hidden />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-72 max-w-[calc(100vw-2rem)] p-1.5">
                <div className="flex items-center gap-3 px-2 py-2.5">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.image || undefined} alt={user?.fullName ?? user?.email ?? 'Profile'} />
                    <AvatarFallback>
                      <User className="h-4 w-4" aria-hidden />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{user?.fullName ?? 'Signed in'}</div>
                    <div className="truncate text-xs text-muted-foreground">{user?.email?.trim() || '—'}</div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/activity">
                    <History className="mr-2 h-4 w-4" aria-hidden />
                    My Activity
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'super-admin' && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">
                      <Shield className="mr-2 h-4 w-4" aria-hidden />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => void logout()}>
                  <LogOut className="mr-2 h-4 w-4" aria-hidden />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <MobileNav />
        </div>
      </div>
    </header>
  );
};
