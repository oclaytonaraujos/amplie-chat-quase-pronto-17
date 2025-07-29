
import { useEffect, useRef } from 'react';

interface UseSidebarGesturesProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose?: () => void;
}

export function useSidebarGestures({ isMobile, isOpen, onClose }: UseSidebarGesturesProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobile || !isOpen) return;

    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        currentX = e.touches[0].clientX;
        isDragging = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      currentX = touch.clientX;

      // Calculate swipe distance
      const deltaX = touch.clientX - startX;

      // Only allow left swipe (negative deltaX) to close
      if (deltaX < 0 && sidebarRef.current) {
        const progress = Math.min(Math.abs(deltaX) / 200, 1);
        sidebarRef.current.style.transform = `translateX(${deltaX}px)`;
        sidebarRef.current.style.opacity = `${1 - progress * 0.5}`;
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      const deltaX = currentX - startX;

      // Close sidebar if swiped left more than 100px
      if (deltaX < -100 && onClose) {
        onClose();
      }

      // Reset transform
      if (sidebarRef.current) {
        sidebarRef.current.style.transform = '';
        sidebarRef.current.style.opacity = '';
      }
    };

    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
      sidebar.addEventListener('touchmove', handleTouchMove, { passive: false });
      sidebar.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (sidebar) {
        sidebar.removeEventListener('touchstart', handleTouchStart);
        sidebar.removeEventListener('touchmove', handleTouchMove);
        sidebar.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isMobile, isOpen, onClose]);

  return sidebarRef;
}
