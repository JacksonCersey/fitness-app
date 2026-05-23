import { useEffect } from 'react';
import { AppState } from 'react-native';

/**
 * Keeps workout elapsed seconds in sync with real wall-clock time (survives backgrounding).
 * When `workoutTimerPaused` is true, the interval stops; freeze elapsed before pausing by clearing
 * `workoutTimerOriginMsRef` and setting `elapsedSeconds` from the caller.
 */
export function useWorkoutWallClockTimer(
  currentScreen,
  setElapsedSeconds,
  workoutTimerOriginMsRef,
  workoutTimerPaused,
) {
  useEffect(() => {
    if (currentScreen !== 'workout') {
      workoutTimerOriginMsRef.current = null;
      return undefined;
    }

    if (workoutTimerPaused) {
      return undefined;
    }

    if (workoutTimerOriginMsRef.current == null) {
      workoutTimerOriginMsRef.current = Date.now();
    }

    function tickFromWallClock() {
      const originMs = workoutTimerOriginMsRef.current;
      if (originMs == null) return;
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - originMs) / 1000)));
    }

    tickFromWallClock();
    const timerId = setInterval(tickFromWallClock, 1000);
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') tickFromWallClock();
    });

    return () => {
      clearInterval(timerId);
      appStateSubscription.remove();
    };
  }, [currentScreen, workoutTimerPaused, setElapsedSeconds, workoutTimerOriginMsRef]);
}
