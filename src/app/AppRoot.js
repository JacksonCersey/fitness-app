import React, { useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppStorageProvider, useAppStorage } from './context/AppStorageContext';
import { ThemeStylesProvider, useGameTheme } from './context/ThemeStylesContext';
import { AppNavigationProvider } from './context/AppNavigationContext';
import { HistoryProgressProvider } from './context/HistoryProgressContext';
import { ActiveWorkoutProvider } from './context/ActiveWorkoutContext';
import { PlanSplitTransitionProvider } from './context/PlanSplitTransitionContext';
import AppNavigator from './navigation/AppNavigator';
import OnboardingFlow from '../screens/onboarding/OnboardingFlow';

function MainApp({ workoutStartRef, onReturnFromSubscreenRef, currentScreen, setCurrentScreen }) {
  return (
    <AppNavigationProvider currentScreen={currentScreen} setCurrentScreen={setCurrentScreen}>
      <PlanSplitTransitionProvider>
        <HistoryProgressProvider onReturnFromSubscreenRef={onReturnFromSubscreenRef}>
          <ActiveWorkoutProvider workoutStartRef={workoutStartRef}>
            <AppNavigator workoutStartRef={workoutStartRef} />
          </ActiveWorkoutProvider>
        </HistoryProgressProvider>
      </PlanSplitTransitionProvider>
    </AppNavigationProvider>
  );
}

function AppRootGate({ workoutStartRef, onReturnFromSubscreenRef, currentScreen, setCurrentScreen }) {
  const { hasLoadedInitialData, hasLoadedOnboarding, onboardingComplete } = useAppStorage();
  const theme = useGameTheme();

  if (!hasLoadedInitialData || !hasLoadedOnboarding) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.navAccent }}>
        <ActivityIndicator size="large" color={theme.primaryButtonText} />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <OnboardingFlow />;
  }

  return (
    <MainApp
      workoutStartRef={workoutStartRef}
      onReturnFromSubscreenRef={onReturnFromSubscreenRef}
      currentScreen={currentScreen}
      setCurrentScreen={setCurrentScreen}
    />
  );
}

export default function AppRoot() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const workoutStartRef = useRef(() => {});
  const onReturnFromSubscreenRef = useRef(() => {});

  return (
    <AppStorageProvider onReturnFromSubscreenRef={onReturnFromSubscreenRef}>
      <ThemeStylesProvider>
        <AppRootGate
          workoutStartRef={workoutStartRef}
          onReturnFromSubscreenRef={onReturnFromSubscreenRef}
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
        />
      </ThemeStylesProvider>
    </AppStorageProvider>
  );
}
