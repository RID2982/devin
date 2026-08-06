import { useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarRange,
  PartyPopper,
  ListChecks,
  Users,
  FileStack,
  Calendar,
  BarChart3,
  Settings,
  AlertTriangle,
  Search,
  Plus,
} from 'lucide-react';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';

const PAGES = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/planner', label: 'Monthly Planner', icon: CalendarRange },
  { to: '/events', label: 'Events', icon: PartyPopper },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/people', label: 'People', icon: Users },
  { to: '/templates', label: 'Templates', icon: FileStack },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/attention', label: 'Attention Center', icon: AlertTriangle },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function CommandPalette() {
  const { open, setOpen, toggle } = useCommandPaletteStore();
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  function go(path: string) {
    navigate(path);
    setOpen(false);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Palette"
      className="fixed left-1/2 top-24 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
    >
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Command.Input
          placeholder="Search or jump to…"
          className="flex h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
        <Command.Group heading="Quick Add" className="px-2 py-1 text-xs font-medium text-muted-foreground">
          <Command.Item
            onSelect={() => go('/events?create=1')}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
          >
            <Plus className="h-4 w-4" /> New Event
          </Command.Item>
          <Command.Item
            onSelect={() => go('/tasks?create=1')}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
          >
            <Plus className="h-4 w-4" /> New Task
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Navigate" className="px-2 py-1 text-xs font-medium text-muted-foreground">
          {PAGES.map((p) => (
            <Command.Item
              key={p.to}
              onSelect={() => go(p.to)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
            >
              <p.icon className="h-4 w-4" /> {p.label}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
