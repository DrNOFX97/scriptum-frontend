import { useState, useEffect } from "react";

export type ScrollDirection = "up" | "down" | null;

interface UseScrollDirectionOptions {
  threshold?: number;
  debounce?: number;
}

export const useScrollDirection = ({
  threshold = 10,
  debounce = 100,
}: UseScrollDirectionOptions = {}): ScrollDirection => {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    let ticking = false;
    let debounceTimeout: NodeJS.Timeout;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;

      // Ignore small scrolls (threshold)
      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false;
        return;
      }

      // Determine direction
      const newDirection = scrollY > lastScrollY ? "down" : "up";

      // Only update if direction changed
      if (newDirection !== scrollDirection) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          setScrollDirection(newDirection);
        }, debounce);
      }

      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(debounceTimeout);
    };
  }, [scrollDirection, threshold, debounce]);

  return scrollDirection;
};
