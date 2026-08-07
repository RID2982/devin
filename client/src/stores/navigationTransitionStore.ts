import { create } from 'zustand';

interface NavigationTransitionState {
  isTransitioning: boolean;
  targetPath: string | null;
  origin: { x: number; y: number } | null;
  startTransition: (to: string, originRect: DOMRect | null) => void;
  completeTransition: () => void;
}

export const useNavigationTransitionStore = create<NavigationTransitionState>((set) => ({
  isTransitioning: false,
  targetPath: null,
  origin: null,
  startTransition: (to, originRect) => {
    const x = originRect ? originRect.left + originRect.width / 2 : window.innerWidth / 2;
    const y = originRect ? originRect.top + originRect.height / 2 : window.innerHeight / 2;
    set({
      isTransitioning: true,
      targetPath: to,
      origin: { x, y },
    });
  },
  completeTransition: () => {
    set({
      isTransitioning: false,
      targetPath: null,
      origin: null,
    });
  },
}));
