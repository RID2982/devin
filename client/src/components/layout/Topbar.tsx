import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Moon, Sun, Command as CommandIcon, Plus, LogOut, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useUiStore } from '@/stores/uiStore';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';
import { useAuth } from '@/auth/AuthProvider';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Logo } from '@/components/shared/Logo';
import { LOGO_SRC } from '@/config/brand';
import { Breadcrumbs } from './Breadcrumbs';
import { Smartphone } from 'lucide-react';

export function Topbar() {
  const [query, setQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useUiStore();
  const { toggle } = useCommandPaletteStore();
  const { user, signOut } = useAuth();
  const { installApp, isInstallable } = usePwaInstall();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setMobileSearchOpen(false);
    }
  }

  function toggleDark() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  const initials = (user?.name ?? user?.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
      {/* Mobile: logo mark + page context */}
      <div className="flex items-center gap-2 lg:hidden">
        <Logo src={LOGO_SRC} className="h-7 w-7" iconOnly />
      </div>

      <div className="hidden lg:block">
        <Breadcrumbs />
      </div>

      <form onSubmit={submitSearch} className="ml-auto hidden max-w-sm flex-1 items-center gap-2 lg:flex">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, tasks, people…"
            className="pl-8"
          />
        </div>
      </form>

      <Button variant="outline" size="sm" onClick={toggle} className="hidden gap-1.5 md:inline-flex">
        <CommandIcon className="h-3.5 w-3.5" /> K
      </Button>

      <Button size="sm" onClick={() => navigate('/events?create=1')} className="hidden gap-1.5 lg:inline-flex">
        <Plus className="h-4 w-4" /> Quick Add
      </Button>

      {/* Mobile: icon-only search trigger */}
      <Button variant="ghost" size="icon" onClick={() => setMobileSearchOpen(true)} className="ml-auto lg:hidden">
        <Search className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" onClick={toggleDark}>
        {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.name ?? user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isInstallable && (
            <DropdownMenuItem onSelect={() => installApp()} className="text-primary font-medium">
              <Smartphone className="mr-2 h-4 w-4" /> Install Mobile App
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => navigate('/settings')}>Settings</DropdownMenuItem>
          <DropdownMenuItem onSelect={signOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mobile full-width search overlay */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-card px-4 lg:hidden"
          >
            <form onSubmit={submitSearch} className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, tasks, people…"
                className="border-none px-0 shadow-none focus-visible:ring-0"
              />
            </form>
            <button onClick={() => setMobileSearchOpen(false)} className="text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
