import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Moon, Sun, Plus, X, PartyPopper, CheckSquare, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useUiStore } from '@/stores/uiStore';
import { Logo } from '@/components/shared/Logo';
import { LOGO_SRC } from '@/config/brand';
import { Breadcrumbs } from './Breadcrumbs';
import { TemplateDialog } from './TemplateDialog';

export function Topbar() {
  const [query, setQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useUiStore();

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

  return (
    <header className="sticky top-3 z-30 flex h-14 items-center gap-3 rounded-2xl border border-border bg-card/85 px-4 shadow-lg backdrop-blur-md m-3 mb-3">
      {/* Mobile: logo mark + page context */}
      <div className="flex items-center gap-2 lg:hidden">
        <Logo src={LOGO_SRC} className="h-7 w-7 shrink-0" />
      </div>

      <div className="hidden lg:block">
        <Breadcrumbs />
      </div>

      <form onSubmit={submitSearch} className="ml-6 hidden max-w-xl flex-1 items-center gap-2 lg:flex">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, tasks, people…"
            className="pl-8 h-9 rounded-xl border-border/80 bg-card"
          />
        </div>
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="brand-gradient text-white border-0 shadow-sm hidden gap-1.5 lg:inline-flex font-semibold ml-auto">
            <Plus className="h-4 w-4" /> + New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => navigate('/events?create=1')}>
            <PartyPopper className="mr-2 h-4 w-4 text-primary" /> New Event
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/tasks?create=1')}>
            <CheckSquare className="mr-2 h-4 w-4 text-primary" /> New Task
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setTemplateOpen(true)}>
            <FileText className="mr-2 h-4 w-4 text-primary" /> Proposal & Template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mobile: icon-only search trigger */}
      <Button variant="ghost" size="icon" onClick={() => setMobileSearchOpen(true)} className="ml-auto lg:hidden">
        <Search className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" onClick={toggleDark}>
        {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </Button>

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

      <TemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} />
    </header>
  );
}
