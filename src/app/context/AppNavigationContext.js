import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { Animated, Dimensions, Easing } from 'react-native';
import {
  MAIN_TAB_SCREEN_KEYS,
  MORE_HUB_NAV_BAR_FADE_MS,
  MORE_HUB_SLIDE_CLOSE_MS,
  MORE_HUB_SLIDE_MS,
  SCREEN_TRANSITION_MS,
  isMoreHubSlideOverlay,
  shouldUseMoreHubSlideTransition,
  shouldUseSubscreenSlideTransition,
} from '../../constants/layout';
import { useAppStorage } from './AppStorageContext';

const AppNavigationContext = createContext(null);

export function useAppNavigation() {
  const ctx = useContext(AppNavigationContext);
  if (!ctx) {
    throw new Error('useAppNavigation must be used within AppNavigationProvider');
  }
  return ctx;
}

export function AppNavigationProvider({ children, currentScreen, setCurrentScreen }) {
  const { syncProfileDraftFromSaved, profileGoalWeightLb, setProfileGoalDraft } = useAppStorage();

  const screenTransitionOpacity = useRef(new Animated.Value(1)).current;
  const hasSkippedInitialScreenFade = useRef(false);
  const previousScreenRef = useRef('menu');
  const subNavigatorReturnRef = useRef('menu');
  const moreHubScrollViewRef = useRef(null);
  const moreHubScrollYRef = useRef(0);
  const moreSubscreenSlideX = useRef(new Animated.Value(0)).current;
  const moreHubNavBarOpacity = useRef(new Animated.Value(1)).current;
  const windowWidthRef = useRef(Dimensions.get('window').width);

  const fadeMoreHubNavBarOut = useCallback(() => {
    moreHubNavBarOpacity.stopAnimation();
    Animated.timing(moreHubNavBarOpacity, {
      toValue: 0,
      duration: MORE_HUB_NAV_BAR_FADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [moreHubNavBarOpacity]);

  const fadeMoreHubNavBarIn = useCallback(() => {
    moreHubNavBarOpacity.stopAnimation();
    Animated.timing(moreHubNavBarOpacity, {
      toValue: 1,
      duration: MORE_HUB_NAV_BAR_FADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [moreHubNavBarOpacity]);

  const animateMoreHubSubscreenEnter = useCallback(() => {
    fadeMoreHubNavBarOut();
    const width = windowWidthRef.current;
    moreSubscreenSlideX.stopAnimation();
    moreSubscreenSlideX.setValue(width);
    Animated.timing(moreSubscreenSlideX, {
      toValue: 0,
      duration: MORE_HUB_SLIDE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [moreSubscreenSlideX, fadeMoreHubNavBarOut]);

  const runMoreSubscreenPop = useCallback(
    (onComplete) => {
      fadeMoreHubNavBarIn();
      const width = windowWidthRef.current;
      moreSubscreenSlideX.stopAnimation();
      Animated.timing(moreSubscreenSlideX, {
        toValue: width,
        duration: MORE_HUB_SLIDE_CLOSE_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          return;
        }
        onComplete();
      });
    },
    [moreSubscreenSlideX, fadeMoreHubNavBarIn],
  );

  useLayoutEffect(() => {
    const previousScreen = previousScreenRef.current;
    previousScreenRef.current = currentScreen;

    if (!hasSkippedInitialScreenFade.current) {
      hasSkippedInitialScreenFade.current = true;
      return;
    }

    const isMainTabSwitch =
      MAIN_TAB_SCREEN_KEYS.has(previousScreen) && MAIN_TAB_SCREEN_KEYS.has(currentScreen);

    if (isMainTabSwitch) {
      screenTransitionOpacity.setValue(1);
      return;
    }

    const isSubscreenPush =
      (previousScreen === 'settings' &&
        shouldUseSubscreenSlideTransition(currentScreen, 'settings')) ||
      (previousScreen === 'history' && shouldUseSubscreenSlideTransition(currentScreen, 'history'));

    const returnTab = subNavigatorReturnRef.current;
    const isSubscreenPop =
      shouldUseSubscreenSlideTransition(previousScreen, returnTab) &&
      currentScreen === returnTab;

    if (isSubscreenPush) {
      screenTransitionOpacity.setValue(1);
      animateMoreHubSubscreenEnter();
      return;
    }

    if (isSubscreenPop) {
      screenTransitionOpacity.setValue(1);
      moreHubNavBarOpacity.setValue(1);
      return;
    }

    screenTransitionOpacity.setValue(0);
    Animated.timing(screenTransitionOpacity, {
      toValue: 1,
      duration: SCREEN_TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [currentScreen, screenTransitionOpacity, moreHubNavBarOpacity, animateMoreHubSubscreenEnter]);

  const handleMoreHubScroll = useCallback((event) => {
    moreHubScrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const restoreMoreHubScrollPosition = useCallback(() => {
    const y = moreHubScrollYRef.current;
    if (y <= 0) return;
    moreHubScrollViewRef.current?.scrollTo({ y, animated: false });
  }, []);

  useLayoutEffect(() => {
    if (currentScreen !== 'settings') return undefined;
    restoreMoreHubScrollPosition();
    const id = requestAnimationFrame(() => restoreMoreHubScrollPosition());
    return () => cancelAnimationFrame(id);
  }, [currentScreen, restoreMoreHubScrollPosition]);

  const handleReturnToMenu = useCallback(() => {
    setCurrentScreen('menu');
  }, [setCurrentScreen]);

  const handleOpenHistory = useCallback(() => {
    subNavigatorReturnRef.current = 'menu';
    setCurrentScreen('history');
  }, [setCurrentScreen]);

  const handlePressMusclesTab = useCallback(() => {
    setCurrentScreen('muscles');
  }, [setCurrentScreen]);

  const handleOpenSettings = useCallback(() => {
    setCurrentScreen('settings');
  }, [setCurrentScreen]);

  const handleOpenProfile = useCallback(() => {
    subNavigatorReturnRef.current = 'menu';
    syncProfileDraftFromSaved();
    setCurrentScreen('profile');
  }, [syncProfileDraftFromSaved, setCurrentScreen]);

  const handleOpenProfileFromMore = useCallback(() => {
    subNavigatorReturnRef.current = 'settings';
    syncProfileDraftFromSaved();
    setCurrentScreen('profile');
  }, [syncProfileDraftFromSaved, setCurrentScreen]);

  const handleOpenMoreGoals = useCallback(() => {
    subNavigatorReturnRef.current = 'settings';
    setProfileGoalDraft(
      profileGoalWeightLb != null ? String(Math.round(profileGoalWeightLb * 100) / 100) : '',
    );
    setCurrentScreen('moreGoals');
  }, [profileGoalWeightLb, setProfileGoalDraft, setCurrentScreen]);

  const handleOpenStreakSubscreen = useCallback(() => {
    subNavigatorReturnRef.current = 'settings';
    setCurrentScreen('streak');
  }, [setCurrentScreen]);

  const handleOpenAppearance = useCallback(() => {
    subNavigatorReturnRef.current = 'settings';
    setCurrentScreen('appearance');
  }, [setCurrentScreen]);

  const handleOpenMovementsFromMore = useCallback(() => {
    subNavigatorReturnRef.current = 'settings';
    setCurrentScreen('strengthMovements');
  }, [setCurrentScreen]);

  const handleOpenSplitPlannerFromHome = useCallback(() => {
    subNavigatorReturnRef.current = 'menu';
    setCurrentScreen('splitPlanner');
  }, [setCurrentScreen]);

  const handleOpenSplitPlannerFromMore = useCallback(() => {
    subNavigatorReturnRef.current = 'settings';
    setCurrentScreen('splitPlanner');
  }, [setCurrentScreen]);

  const handleCloseSplitPlanner = useCallback(() => {
    const dest = subNavigatorReturnRef.current;
    if (dest === 'settings' && shouldUseMoreHubSlideTransition('splitPlanner', 'settings')) {
      runMoreSubscreenPop(() => setCurrentScreen('settings'));
      return;
    }
    if (dest === 'settings') setCurrentScreen('settings');
    else setCurrentScreen('menu');
  }, [setCurrentScreen, runMoreSubscreenPop]);

  const handleOpenStrengthMovements = useCallback(() => {
    subNavigatorReturnRef.current = 'history';
    setCurrentScreen('strengthMovements');
  }, [setCurrentScreen]);

  const handleCloseStrengthMovements = useCallback(() => {
    const dest = subNavigatorReturnRef.current;
    if (dest === 'settings' && shouldUseMoreHubSlideTransition('strengthMovements', 'settings')) {
      runMoreSubscreenPop(() => setCurrentScreen('settings'));
      return;
    }
    if (dest === 'settings') setCurrentScreen('settings');
    else if (dest === 'history') setCurrentScreen('history');
    else setCurrentScreen('menu');
  }, [setCurrentScreen, runMoreSubscreenPop]);

  const handleOpenStrengthScoreHistory = useCallback(() => {
    subNavigatorReturnRef.current = 'history';
    setCurrentScreen('strengthScoreHistory');
  }, [setCurrentScreen]);

  const handleCloseStrengthScoreHistory = useCallback(() => {
    const dest = subNavigatorReturnRef.current;
    if (dest === 'history' && shouldUseSubscreenSlideTransition('strengthScoreHistory', 'history')) {
      runMoreSubscreenPop(() => setCurrentScreen('history'));
      return;
    }
    if (dest === 'history') setCurrentScreen('history');
    else setCurrentScreen('menu');
  }, [setCurrentScreen, runMoreSubscreenPop]);

  const mainTabsDisplayedScreen = MAIN_TAB_SCREEN_KEYS.has(currentScreen)
    ? currentScreen
    : isMoreHubSlideOverlay(currentScreen, subNavigatorReturnRef.current)
      ? MAIN_TAB_SCREEN_KEYS.has(subNavigatorReturnRef.current)
        ? subNavigatorReturnRef.current
        : 'settings'
      : currentScreen;

  const value = useMemo(
    () => ({
      currentScreen,
      mainTabsDisplayedScreen,
      setCurrentScreen,
      screenTransitionOpacity,
      moreSubscreenSlideX,
      moreHubNavBarOpacity,
      runMoreSubscreenPop,
      subNavigatorReturnRef,
      moreHubScrollViewRef,
      handleMoreHubScroll,
      restoreMoreHubScrollPosition,
      handleReturnToMenu,
      handleOpenHistory,
      handlePressMusclesTab,
      handleOpenSettings,
      handleOpenProfile,
      handleOpenProfileFromMore,
      handleOpenMoreGoals,
      handleOpenStreakSubscreen,
      handleOpenAppearance,
      handleOpenMovementsFromMore,
      handleOpenSplitPlannerFromHome,
      handleOpenSplitPlannerFromMore,
      handleCloseSplitPlanner,
      handleOpenStrengthMovements,
      handleCloseStrengthMovements,
      handleOpenStrengthScoreHistory,
      handleCloseStrengthScoreHistory,
    }),
    [
      currentScreen,
      mainTabsDisplayedScreen,
      setCurrentScreen,
      screenTransitionOpacity,
      moreSubscreenSlideX,
      moreHubNavBarOpacity,
      runMoreSubscreenPop,
      handleMoreHubScroll,
      restoreMoreHubScrollPosition,
      handleReturnToMenu,
      handleOpenHistory,
      handlePressMusclesTab,
      handleOpenSettings,
      handleOpenProfile,
      handleOpenProfileFromMore,
      handleOpenMoreGoals,
      handleOpenStreakSubscreen,
      handleOpenAppearance,
      handleOpenMovementsFromMore,
      handleOpenSplitPlannerFromHome,
      handleOpenSplitPlannerFromMore,
      handleCloseSplitPlanner,
      handleOpenStrengthMovements,
      handleCloseStrengthMovements,
      handleOpenStrengthScoreHistory,
      handleCloseStrengthScoreHistory,
    ],
  );

  return <AppNavigationContext.Provider value={value}>{children}</AppNavigationContext.Provider>;
}
