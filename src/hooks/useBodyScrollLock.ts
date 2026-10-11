import { useEffect } from 'react';

/**
 * Bulletproof mobile-first body scroll lock for Android WebView and mobile browsers:
 * 1. Reference counting for nested modals and confirmation sheets
 * 2. Position-fixed body anchoring (physically eliminates rubberband/scroll drift underneath modals)
 * 3. Exact pixel scroll restoration upon modal dismissal
 * 4. Intercepts touchmove on backdrops and non-scrollable layers (passive: false)
 * 5. Disables overscroll chaining at documentElement level
 */

let activeLocks = 0;
let originalStyles = {
  overflow: '',
  position: '',
  top: '',
  left: '',
  right: '',
  width: '',
  overscrollBehavior: '',
  htmlOverflow: '',
  htmlOverscrollBehavior: '',
};
let savedScrollY = 0;

const handleTouchMove = (e: TouchEvent) => {
  const target = e.target as HTMLElement | null;
  if (!target) return;

  // Allow scrolling only if the touch is inside an explicitly scrollable container
  const scrollableParent = target.closest('[data-modal-scrollable="true"], .overflow-y-auto, .overflow-y-scroll, .overflow-auto');
  if (!scrollableParent) {
    if (e.cancelable) {
      e.preventDefault();
    }
  }
};

export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return;

    activeLocks++;

    if (activeLocks === 1) {
      // 1. Capture current scroll position
      savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

      // 2. Save original inline styles
      originalStyles = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
        overscrollBehavior: document.body.style.overscrollBehavior,
        htmlOverflow: document.documentElement.style.overflow,
        htmlOverscrollBehavior: document.documentElement.style.overscrollBehavior,
      };

      // 3. Freeze documentElement and anchor body to viewport
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';

      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';

      // 4. Block touchmove on background layers
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);

      if (activeLocks === 0) {
        document.removeEventListener('touchmove', handleTouchMove);

        // Restore original inline styles
        document.documentElement.style.overflow = originalStyles.htmlOverflow;
        document.documentElement.style.overscrollBehavior = originalStyles.htmlOverscrollBehavior;

        document.body.style.overflow = originalStyles.overflow;
        document.body.style.overscrollBehavior = originalStyles.overscrollBehavior;
        document.body.style.position = originalStyles.position;
        document.body.style.top = originalStyles.top;
        document.body.style.left = originalStyles.left;
        document.body.style.right = originalStyles.right;
        document.body.style.width = originalStyles.width;

        // Restore scroll position without animation glitch
        window.scrollTo({
          top: savedScrollY,
          left: 0,
          behavior: 'instant' as ScrollBehavior,
        });
      }
    };
  }, [isLocked]);
}

