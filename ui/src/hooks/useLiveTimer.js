/**
 * Hook for live timer updates
 * Updates every second to show elapsed time
 */

import { useState, useEffect } from "react";

/**
 * Returns the current elapsed time in seconds from a start timestamp
 * Updates every second
 * @param {number|null} startTime - Start timestamp in milliseconds
 * @param {boolean} isActive - Whether the timer should be active
 * @returns {number} Elapsed time in seconds
 */
export function useLiveTimer(startTime, isActive) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsed(0);
      return;
    }

    // Update immediately
    setElapsed(Math.floor((Date.now() - startTime) / 1000));

    // Update every second
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  return elapsed;
}

