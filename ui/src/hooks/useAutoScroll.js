/**
 * Declarative hook for auto-scrolling chat window
 * Replaces imperative DOM manipulation with declarative React pattern
 */

import { useEffect, useRef } from "react";

/**
 * Auto-scrolls a ref element to bottom when dependencies change
 * @param {React.RefObject} scrollRef - Ref to the scrollable element
 * @param {Array} dependencies - Dependencies that trigger scroll
 */
export function useAutoScroll(scrollRef, dependencies) {
  useEffect(() => {
    if (scrollRef?.current) {
      try {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      } catch (e) {
        // Silently fail if scroll is not possible
      }
    }
  }, dependencies);
}

