import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * @typedef {{ x: number; y: number; width: number; height: number }} Frame
 * @typedef {{ accent: string; isRest: boolean; borderColor?: string }} DayStyle
 */

const PlanSplitTransitionContext = createContext(null);

export function usePlanSplitTransition() {
  const value = useContext(PlanSplitTransitionContext);
  if (!value) {
    throw new Error('usePlanSplitTransition must be used within PlanSplitTransitionProvider');
  }
  return value;
}

/** @returns {Frame[]} */
function emptyFrames() {
  return Array.from({ length: 7 }, () => ({ x: 0, y: 0, width: 22, height: 22 }));
}

export function PlanSplitTransitionProvider({ children }) {
  const [phase, setPhase] = useState('idle'); // idle | forward | reverse
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [planHeroActive, setPlanHeroActive] = useState(false);
  const [planDotsHidden, setPlanDotsHidden] = useState(false);
  const [timelineIconsHidden, setTimelineIconsHidden] = useState(false);
  const [timelineContentVisible, setTimelineContentVisible] = useState(true);
  const [keepPlanTabVisible, setKeepPlanTabVisible] = useState(false);
  const [morphProgress, setMorphProgress] = useState(0); // 0 = plan dots, 1 = timeline icons
  const [morphToken, setMorphToken] = useState(0);
  const [sourceFrames, setSourceFrames] = useState(emptyFrames);
  const [targetFrames, setTargetFrames] = useState(emptyFrames);
  const [dayStyles, setDayStyles] = useState(() =>
    Array.from({ length: 7 }, () => ({ accent: '#64748B', isRest: true })),
  );

  const pendingTargetsRef = useRef(null);
  const forwardReadyRef = useRef({ sources: false, targets: false });
  const reverseReadyRef = useRef({ sources: false, targets: false });
  const navigateToTimelineRef = useRef(null);
  const navigateHomeRef = useRef(null);
  const morphStartedRef = useRef(false);

  const resetToIdle = useCallback(() => {
    setPhase('idle');
    setOverlayVisible(false);
    setPlanHeroActive(false);
    setPlanDotsHidden(false);
    setTimelineIconsHidden(false);
    setTimelineContentVisible(true);
    setKeepPlanTabVisible(false);
    setMorphProgress(0);
    setMorphToken(0);
    pendingTargetsRef.current = null;
    forwardReadyRef.current = { sources: false, targets: false };
    reverseReadyRef.current = { sources: false, targets: false };
    morphStartedRef.current = false;
    navigateToTimelineRef.current = null;
    navigateHomeRef.current = null;
  }, []);

  const tryStartForwardMorph = useCallback(() => {
    if (morphStartedRef.current) return;
    if (!forwardReadyRef.current.sources || !forwardReadyRef.current.targets) return;
    morphStartedRef.current = true;
    requestAnimationFrame(() => {
      setMorphProgress(1);
      setMorphToken((token) => token + 1);
    });
  }, []);

  const tryStartReverseMorph = useCallback(() => {
    if (morphStartedRef.current) return;
    if (!reverseReadyRef.current.sources || !reverseReadyRef.current.targets) return;
    morphStartedRef.current = true;
    requestAnimationFrame(() => {
      setMorphProgress(0);
      setMorphToken((token) => token + 1);
    });
  }, []);

  const startForward = useCallback(
    ({ frames, styles: stylesIn, navigateToTimeline }) => {
      if (phase !== 'idle') return;
      navigateToTimelineRef.current = navigateToTimeline;
      forwardReadyRef.current = { sources: true, targets: false };
      morphStartedRef.current = false;
      setSourceFrames(frames);
      setDayStyles(stylesIn);
      setMorphProgress(0);
      setMorphToken(0);
      setPlanHeroActive(true);
      setPlanDotsHidden(true);
      setOverlayVisible(true);
      setTimelineIconsHidden(true);
      setTimelineContentVisible(false);
      setKeepPlanTabVisible(true);
      setPhase('forward');
      // Mount timeline under overlay.
      navigateToTimeline?.();
    },
    [phase],
  );

  const registerTimelineTargets = useCallback(
    (frames) => {
      setTargetFrames(frames);
      if (phase === 'forward') {
        forwardReadyRef.current.targets = true;
        tryStartForwardMorph();
      } else if (phase === 'reverse') {
        // Targets are the starting point for reverse (already set at startReverse).
      }
    },
    [phase, tryStartForwardMorph],
  );

  const registerPlanSources = useCallback(
    (frames) => {
      setSourceFrames(frames);
      if (phase === 'reverse') {
        reverseReadyRef.current.sources = true;
        tryStartReverseMorph();
      }
    },
    [phase, tryStartReverseMorph],
  );

  const onMorphAnimationComplete = useCallback(
    (progress) => {
      if (phase === 'forward' && progress >= 1) {
        setTimelineIconsHidden(false);
        setTimelineContentVisible(true);
        setOverlayVisible(false);
        setKeepPlanTabVisible(false);
        setPlanHeroActive(false);
        setPlanDotsHidden(false);
        setPhase('idle');
        morphStartedRef.current = false;
        forwardReadyRef.current = { sources: false, targets: false };
      } else if (phase === 'reverse' && progress <= 0) {
        setPlanDotsHidden(false);
        setPlanHeroActive(false);
        setOverlayVisible(false);
        setKeepPlanTabVisible(false);
        setTimelineIconsHidden(false);
        setTimelineContentVisible(true);
        const goHome = navigateHomeRef.current;
        setPhase('idle');
        morphStartedRef.current = false;
        reverseReadyRef.current = { sources: false, targets: false };
        goHome?.();
      }
    },
    [phase],
  );

  const startReverse = useCallback(
    ({ frames, styles: stylesIn, navigateHome }) => {
      if (phase !== 'idle') return;
      navigateHomeRef.current = navigateHome;
      reverseReadyRef.current = { sources: false, targets: true };
      morphStartedRef.current = false;
      setTargetFrames(frames);
      if (stylesIn) setDayStyles(stylesIn);
      setMorphProgress(1);
      setMorphToken(0);
      setTimelineIconsHidden(true);
      setTimelineContentVisible(false);
      setOverlayVisible(true);
      setKeepPlanTabVisible(true);
      setPlanHeroActive(true);
      setPlanDotsHidden(true);
      setPhase('reverse');
      // Plan tab becomes visible underneath; it will remeasure and register sources.
    },
    [phase],
  );

  const isBusy = phase !== 'idle';

  const value = useMemo(
    () => ({
      phase,
      isBusy,
      overlayVisible,
      planHeroActive,
      planDotsHidden,
      timelineIconsHidden,
      timelineContentVisible,
      keepPlanTabVisible,
      morphProgress,
      morphToken,
      sourceFrames,
      targetFrames,
      dayStyles,
      startForward,
      startReverse,
      registerTimelineTargets,
      registerPlanSources,
      onMorphAnimationComplete,
      resetToIdle,
    }),
    [
      phase,
      isBusy,
      overlayVisible,
      planHeroActive,
      planDotsHidden,
      timelineIconsHidden,
      timelineContentVisible,
      keepPlanTabVisible,
      morphProgress,
      morphToken,
      sourceFrames,
      targetFrames,
      dayStyles,
      startForward,
      startReverse,
      registerTimelineTargets,
      registerPlanSources,
      onMorphAnimationComplete,
      resetToIdle,
    ],
  );

  return (
    <PlanSplitTransitionContext.Provider value={value}>{children}</PlanSplitTransitionContext.Provider>
  );
}
