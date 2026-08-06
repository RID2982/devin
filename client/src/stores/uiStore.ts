import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: true,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      accentColor: '#b42244',
      setAccentColor: (accentColor) => set({ accentColor }),
    }),
    { name: 'ui-preferences' },
  ),
);
