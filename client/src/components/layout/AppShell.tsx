import { LogOut, Menu, UserCircle } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Summary', end: true },
  { to: '/recipes', label: 'Recipes' },
] as const;

export function AppShell() {
  const { user, logout } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
      isActive && 'bg-accent text-accent-foreground',
    );

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold tracking-tight">🍺 BrewLog</span>
            <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : undefined} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink to="/settings" className={navLinkClass}>
                  Settings
                </NavLink>
              )}
              <span
                className="cursor-not-allowed rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                title="Coming in a future phase"
                aria-disabled="true"
              >
                Cellar Inventory
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Open navigation menu"
                className="flex items-center justify-center rounded-md p-2 hover:bg-accent sm:hidden"
              >
                <Menu className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Navigate</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <NavLink to={item.to} end={'end' in item ? item.end : undefined}>
                      {item.label}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
                {user?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <NavLink to="/settings">Settings</NavLink>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent">
                <UserCircle className="size-5" />
                <span className="hidden sm:inline">{user?.displayName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/account">Account settings</NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void logout()}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

