import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationTransitionStore } from '@/stores/navigationTransitionStore';

export function NavigationTransitionOverlay() {
  const { isTransitioning, targetPath, origin, completeTransition } = useNavigationTransitionStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isTransitioning && targetPath) {
      const timer = setTimeout(() => {
        navigate(targetPath);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, targetPath, navigate]);

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        completeTransition();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isTransitioning, completeTransition]);

  return (
    <AnimatePresence>
      {isTransitioning && origin && (
        <motion.div
          initial={{
            clipPath: `circle(0% at ${origin.x}px ${origin.y}px)`,
            opacity: 1,
          }}
          animate={{
            clipPath: `circle(150% at ${origin.x}px ${origin.y}px)`,
            opacity: 1,
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0.15, ease: 'easeIn' }
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-primary via-primary to-primary-foreground pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
}
