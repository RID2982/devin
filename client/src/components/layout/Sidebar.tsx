import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarRange,
  PartyPopper,
  Users,
  Calendar,
  ClipboardCheck,
  Settings,
  LogOut,
  Smartphone,
} from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { Logo } from '@/components/shared/Logo';
import { LOGO_SRC } from '@/config/brand';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/AuthProvider';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/planner', label: 'Monthly Planner', icon: CalendarRange },
  { to: '/events', label: 'Events', icon: PartyPopper },
  { to: '/people', label: 'People', icon: Users },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 252;

export function Sidebar() {
  const { sidebarCollapsed } = useUiStore();
  const [hovering, setHovering] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { installApp, isInstallable } = usePwaInstall();

  // sidebarCollapsed = pinned-closed preference. Hovering always temporarily reveals labels.
  const expanded = !sidebarCollapsed || hovering;
  const initials = (user?.name ?? user?.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <motion.aside
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      animate={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
      className="sticky top-3 left-3 z-20 hidden h-[calc(100vh-24px)] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/85 shadow-lg backdrop-blur-md lg:flex m-3 mr-0"
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <Logo src={LOGO_SRC} className="h-8 w-8 shrink-0" />
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="truncate text-sm font-semibold"
            >
              Rotaract Club of Salem Midtown
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
            title={!expanded ? item.label : undefined}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User Profile and Sign Out dropdown at bottom of Sidebar */}
      <div className="p-3 border-t border-border mt-auto shrink-0 bg-muted/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full text-left p-1.5 rounded-xl hover:bg-muted/70 transition-colors focus:outline-none">
              <Avatar className="h-8.5 w-8.5 shrink-0 border border-border">
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-xs font-bold text-foreground truncate">{user?.name ?? 'Club Admin'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? 'admin@gmail.com'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-52 ml-2 rounded-2xl shadow-xl border-border/80">
            <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/40" />
            {isInstallable && (
              <DropdownMenuItem onSelect={() => installApp()} className="text-primary font-semibold text-xs py-2">
                <Smartphone className="mr-2 h-4 w-4" /> Install Mobile App
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => navigate('/settings')} className="text-xs font-semibold py-2">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuItem onSelect={signOut} className="text-destructive font-semibold text-xs py-2">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}
