import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { buildExerciseLookup, EXERCISE_DATABASE } from '../data/exerciseDatabase';
import {
  buildMonthlyDailyVolume,
  buildYearlyMonthlyVolume,
  getDaysInMonth,
  getWorkoutVolumeLb,
  inchesToProfileHeightPickers,
  profileHeightPickersToInches,
  PROFILE_HEIGHT_FT_SENTINEL,
} from '../utils/workoutStats';

import {
  aggregateSingleWorkoutPplBreakdown,
  aggregateWeeklySetsByPpl,
  aggregateWeeklySetsBySubcategory,
  getMondayStartOfWeekLocal,
} from './utils/weeklyPplSetTotals';

import {
  HISTORY_STORAGE_KEY,
  THEME_STORAGE_KEY,
  PROFILE_NAME_STORAGE_KEY,
  PROFILE_BODY_STORAGE_KEY,
  WEIGHT_LOGS_STORAGE_KEY,
  WEEKLY_SPLIT_PLAN_STORAGE_KEY,
  STRENGTH_SCORE_DISPLAYED_KEY,
} from './constants/storageKeys';
import { computeStrengthScoreSummary } from './data/strengthScore';
import {
  MAIN_TAB_NAV_BAR_HEIGHT,
  MAIN_TAB_SCREEN_KEYS,
  MAIN_TAB_SHELL_BG,
  SCREEN_TRANSITION_MS,
} from './constants/layout';
import { WORKOUT_THEME } from './theme/workoutTheme';
import {
  getDefaultWeeklySplitPlan,
  getSplitWeekWorkoutProgress,
  normalizeWeeklySplitPlan,
  weeklySplitPlanIsConfigured,
} from './data/weeklySplitPlanner';
import { computeConsecutivePerfectWeekStreak } from './utils/consecutivePerfectWeekStreak';
import { computeConsecutiveTrainingWeekStreak } from './utils/consecutiveWeekStreak';
import { isBodyweightOnlyExercise, formatTime } from './utils/formatWorkout';
import { styles } from './styles';
import MainTabsLayout from './navigation/MainTabsLayout';
import MainBottomTabBar from './navigation/bottomTabBar/MainBottomTabBar';
import MenuHomeTabScreen from './screens/MenuHomeTabScreen';
import MoreHubTabScreen from './screens/MoreHubTabScreen';
import StreakScreen from './screens/StreakScreen';
import MoreGoalsScreen from './screens/MoreGoalsScreen';
import AppearanceScreen from './screens/AppearanceScreen';
import ProfileScreen from './screens/ProfileScreen';
import SummaryScreen from './screens/SummaryScreen';
import HistoryTabScreen from './screens/HistoryTabScreen';
import HistoryDayWorkoutsScreen from './screens/HistoryDayWorkoutsScreen';
import StrengthMovementsScreen from './screens/StrengthMovementsScreen';
import {
  loadFavoriteMovements,
  saveFavoriteMovements,
  toggleFavoriteMovement,
} from './utils/movementFavorites';
import MuscleMapTabScreen from './screens/MuscleMapTabScreen';
import WeeklySplitPlannerScreen from './screens/WeeklySplitPlannerScreen';
import MainTabsWeightLogModal from './screens/MainTabsWeightLogModal';
import WorkoutScreen from './screens/WorkoutScreen';
import { useWorkoutWallClockTimer } from './hooks/useWorkoutWallClockTimer';
import { useBodyweightRepsAutofocus } from './hooks/useBodyweightRepsAutofocus';
import {
  formatWeightForNotepadInput,
  getMostRecentSetForMovementName,
} from './utils/movementSetHistory';
import { createWorkoutSlotId, mergeWorkoutSlotsToExerciseMap } from './utils/workoutSlots';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const nowForDefaults = new Date();
  const insets = useSafeAreaInsets();
  const mainTabBottomReserve = MAIN_TAB_NAV_BAR_HEIGHT + insets.bottom;
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [historySelectedMonth, setHistorySelectedMonth] = useState(nowForDefaults.getMonth());
  const [historySelectedYear, setHistorySelectedYear] = useState(nowForDefaults.getFullYear());
  /** Month shown on the Past workouts calendar only (volume chart uses `historySelectedMonth`). */
  const [historyCalendarMonth, setHistoryCalendarMonth] = useState(nowForDefaults.getMonth());
  const [historyCalendarYear, setHistoryCalendarYear] = useState(nowForDefaults.getFullYear());
  const [historyChartMode, setHistoryChartMode] = useState('month');
  const [theme, setTheme] = useState('light');
  const [hasLoadedTheme, setHasLoadedTheme] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [profileHeightIn, setProfileHeightIn] = useState(null);
  const [profileGoalWeightLb, setProfileGoalWeightLb] = useState(null);
  const [profileHeightPickFeet, setProfileHeightPickFeet] = useState(PROFILE_HEIGHT_FT_SENTINEL);
  const [profileHeightPickInches, setProfileHeightPickInches] = useState(0);
  const [profileHeightEditorOpen, setProfileHeightEditorOpen] = useState(false);
  const [profileGoalDraft, setProfileGoalDraft] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  /** When set, workout elapsed time = (Date.now() - this) / 1000 so the timer stays correct in the background. */
  const workoutTimerOriginMsRef = useRef(null);
  const [selectedMovement, setSelectedMovement] = useState('');
  const [customMovementName, setCustomMovementName] = useState('');
  const [notepadWeightInput, setNotepadWeightInput] = useState('');
  const [notepadRepsInput, setNotepadRepsInput] = useState('');
  const notepadWeightInputRef = useRef(null);
  const notepadRepsRef = useRef(null);
  /** Split planner back target: `menu` (home) or `muscles` (targets tab). */
  const splitPlannerReturnScreenRef = useRef('muscles');
  /** After Profile, History, Database, etc.: return to `menu` (Home) or `settings` (More tab). */
  const subNavigatorReturnRef = useRef('menu');
  /** More hub list: keep scroll position when opening a subscreen and coming back. */
  const moreHubScrollViewRef = useRef(null);
  const moreHubScrollYRef = useRef(0);
  const [useCustomMovement, setUseCustomMovement] = useState(false);
  const [editingSetKey, setEditingSetKey] = useState(null);
  const [editingReps, setEditingReps] = useState('0');
  const [editingWeight, setEditingWeight] = useState('0');
  const screenTransitionOpacity = useRef(new Animated.Value(1)).current;
  const hasSkippedInitialScreenFade = useRef(false);
  const previousScreenRef = useRef('menu');
  const [workoutTimerPaused, setWorkoutTimerPaused] = useState(false);
  /** Ordered list of movements in the active workout (`{ id, name }` per row; same name allowed more than once). */
  const [workoutMovementOrder, setWorkoutMovementOrder] = useState([]);
  const [addMovementSheetVisible, setAddMovementSheetVisible] = useState(false);
  const [logSetSheetExercise, setLogSetSheetExercise] = useState(null);
  /** Most recently logged set in the active workout (for Repeat on the log sheet). */
  const [lastLoggedSet, setLastLoggedSet] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [favoriteMovements, setFavoriteMovements] = useState(() => new Set());
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [weightLogs, setWeightLogs] = useState([]);
  const [hasLoadedWeightLogs, setHasLoadedWeightLogs] = useState(false);
  const [isWeightLogModalVisible, setIsWeightLogModalVisible] = useState(false);
  const [weightLogDraftValue, setWeightLogDraftValue] = useState('');
  const [weightLogDraftDate, setWeightLogDraftDate] = useState('');
  /** When set, the weight modal updates this log id instead of creating a new entry. */
  const [editingWeightLogId, setEditingWeightLogId] = useState(null);
  /** Progress sub-screen: overview (calendar), weight, or strength (volume). */
  const [historyProgressSection, setHistoryProgressSection] = useState('overview');
  /** Last smoothed strength score — ref avoids re-render loops when persisting. */
  const strengthScorePersistedRef = useRef(null);
  /** When set, `HistoryDayWorkoutsScreen` shows workouts completed on that local calendar day. */
  const [historyDayPick, setHistoryDayPick] = useState(null);
  const [isWeightDatePickerVisible, setIsWeightDatePickerVisible] = useState(false);
  const [weightDatePickYear, setWeightDatePickYear] = useState(nowForDefaults.getFullYear());
  const [weightDatePickMonth, setWeightDatePickMonth] = useState(nowForDefaults.getMonth() + 1);
  const [weightDatePickDay, setWeightDatePickDay] = useState(nowForDefaults.getDate());
  const [weeklySplitPlan, setWeeklySplitPlan] = useState(() => getDefaultWeeklySplitPlan());
  const [hasLoadedWeeklySplitPlan, setHasLoadedWeeklySplitPlan] = useState(false);
  // Save a full history array to AsyncStorage.
  // We keep this in one helper so save logic is easy to reuse.
  async function saveHistoryToStorage(historyArray) {
    if (__DEV__) {
      console.log('Saving history to AsyncStorage...');
    }
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyArray));
    if (__DEV__) {
      console.log(`Saved ${historyArray.length} workouts to AsyncStorage`);
    }
  }

  // Load history from AsyncStorage when app opens.
  // If nothing is saved yet, return an empty list.
  async function loadHistoryFromStorage() {
    if (__DEV__) {
      console.log('Loading history from AsyncStorage...');
    }
    const savedHistoryJson = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!savedHistoryJson) return [];

    const parsedHistory = JSON.parse(savedHistoryJson);
    if (!Array.isArray(parsedHistory)) return [];
    return parsedHistory;
  }

  async function saveWeightLogsToStorage(logsArray) {
    await AsyncStorage.setItem(WEIGHT_LOGS_STORAGE_KEY, JSON.stringify(logsArray));
  }

  async function loadWeightLogsFromStorage() {
    const raw = await AsyncStorage.getItem(WEIGHT_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === 'object');
  }


  // We store sets grouped by movement name:
  // {
  //   "Bench Press": [{ reps: 10, elapsedSeconds: 75 }, ...],
  //   "Pull Up": [{ reps: 12, elapsedSeconds: 220 }]
  // }
  const [setsByMovement, setSetsByMovement] = useState({});
  const exerciseLookup = useMemo(() => buildExerciseLookup(EXERCISE_DATABASE), []);
  const weekStartMondayForTargets = useMemo(() => getMondayStartOfWeekLocal(new Date()), []);
  const weeklyPplCounts = useMemo(
    () => aggregateWeeklySetsByPpl(workoutHistory, exerciseLookup, new Date()),
    [workoutHistory, exerciseLookup],
  );
  const weeklySubcategorySetCounts = useMemo(
    () => aggregateWeeklySetsBySubcategory(workoutHistory, exerciseLookup, new Date()),
    [workoutHistory, exerciseLookup],
  );
  const activeMovementName = useCustomMovement ? customMovementName.trim() : selectedMovement.trim();

  const activeIsBodyweightOnly = isBodyweightOnlyExercise(activeMovementName, exerciseLookup);

  const isLightTheme = theme === 'light';
  const colors = (
    isLightTheme
    ? {
        screenBackground: '#EDEDED',
        menuBackground: '#EDEDED',
        dashboardCard: '#3B73BB',
        dashboardText: '#EAF0FF',
        streakValue: '#F4F8FF',
        menuPanel: '#C8D1E0',
        menuActionButton: '#F4F4F5',
        menuActionText: '#151266',
        primaryButton: '#3B73BB',
        primaryButtonText: '#FFFFFF',
        secondaryButton: '#C8D1E0',
        secondaryButtonText: '#151266',
        textPrimary: '#151266',
        textSecondary: '#2F343C',
        inputBg: '#FFFFFF',
        inputText: '#1B1E23',
        inputBorder: '#C8D1E0',
        cardBg: '#FFFFFF',
        setText: '#2F343C',
        deleteText: '#B42318',
        weightButton: '#DDE3EF',
        arrowButton: '#DDE3EF',
      }
    : {
        screenBackground: '#111214',
        menuBackground: '#111214',
        dashboardCard: '#2F66AD',
        dashboardText: '#EAF1FF',
        streakValue: '#F2F6FF',
        menuPanel: '#171A1F',
        menuActionButton: '#252A32',
        menuActionText: '#E6E8EC',
        primaryButton: '#3B82F6',
        primaryButtonText: '#FFFFFF',
        secondaryButton: '#252A32',
        secondaryButtonText: '#E6E8EC',
        textPrimary: '#FFFFFF',
        textSecondary: '#B7BCC5',
        inputBg: '#1B1E23',
        inputText: '#FFFFFF',
        inputBorder: '#2F343C',
        cardBg: '#1E232B',
        setText: '#D8DDE6',
        deleteText: '#FF7C7C',
        weightButton: '#2A2F38',
        arrowButton: '#2A2F38',
      }
  );

  useWorkoutWallClockTimer(currentScreen, setElapsedSeconds, workoutTimerOriginMsRef, workoutTimerPaused);
  useBodyweightRepsAutofocus({
    currentScreen,
    useCustomMovement,
    selectedMovement,
    exerciseLookup,
    notepadRepsRef,
  });

  // On first app load, read saved workouts from device storage
  // and place them into local React state.
  useEffect(() => {
    async function loadWorkoutHistory() {
      try {
        const loadedHistory = await loadHistoryFromStorage();
        setWorkoutHistory(loadedHistory);
        if (__DEV__) {
          console.log(`Number of workouts loaded: ${loadedHistory.length}`);
        }
      } catch (error) {
        console.warn('Failed to load workout history', error);
      } finally {
        setHasLoadedHistory(true);
      }
    }

    loadWorkoutHistory();
  }, []);

  useEffect(() => {
    async function loadFavorites() {
      const loaded = await loadFavoriteMovements();
      setFavoriteMovements(loaded);
    }
    loadFavorites();
  }, []);

  useEffect(() => {
    async function loadStrengthScoreDisplayed() {
      try {
        const raw = await AsyncStorage.getItem(STRENGTH_SCORE_DISPLAYED_KEY);
        if (raw == null) return;
        const n = Number.parseFloat(raw);
        if (Number.isFinite(n) && n >= 0) strengthScorePersistedRef.current = n;
      } catch (error) {
        console.warn('Failed to load strength score', error);
      }
    }
    loadStrengthScoreDisplayed();
  }, []);

  useEffect(() => {
    async function loadWeightLogs() {
      try {
        const loadedLogs = await loadWeightLogsFromStorage();
        setWeightLogs(loadedLogs);
      } catch (error) {
        console.warn('Failed to load weight logs', error);
      } finally {
        setHasLoadedWeightLogs(true);
      }
    }

    loadWeightLogs();
  }, []);

  useEffect(() => {
    async function loadWeeklySplitPlan() {
      try {
        const raw = await AsyncStorage.getItem(WEEKLY_SPLIT_PLAN_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setWeeklySplitPlan(normalizeWeeklySplitPlan(parsed));
        }
      } catch (error) {
        console.warn('Failed to load weekly split plan', error);
      } finally {
        setHasLoadedWeeklySplitPlan(true);
      }
    }

    loadWeeklySplitPlan();
  }, []);

  // Load saved theme preference on app launch.
  useEffect(() => {
    async function loadThemePreference() {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.warn('Failed to load theme preference', error);
      } finally {
        setHasLoadedTheme(true);
      }
    }

    loadThemePreference();
  }, []);

  // Load saved profile once on app launch.
  useEffect(() => {
    async function loadProfile() {
      try {
        const savedProfileName = await AsyncStorage.getItem(PROFILE_NAME_STORAGE_KEY);
        if (savedProfileName) {
          setProfileName(savedProfileName);
          setProfileNameDraft(savedProfileName);
        }
      } catch (error) {
        console.warn('Failed to load profile name', error);
      }
      try {
        const savedBodyRaw = await AsyncStorage.getItem(PROFILE_BODY_STORAGE_KEY);
        if (savedBodyRaw) {
          const body = JSON.parse(savedBodyRaw);
          const hin = typeof body.heightIn === 'number' ? body.heightIn : null;
          const glb = typeof body.goalWeightLb === 'number' ? body.goalWeightLb : null;
          setProfileHeightIn(hin !== null && !Number.isNaN(hin) && hin > 0 ? hin : null);
          setProfileGoalWeightLb(glb !== null && !Number.isNaN(glb) && glb > 0 ? glb : null);
          {
            const heightPick =
              hin !== null && !Number.isNaN(hin) && hin > 0
                ? inchesToProfileHeightPickers(hin)
                : inchesToProfileHeightPickers(null);
            setProfileHeightPickFeet(heightPick.feet);
            setProfileHeightPickInches(heightPick.inches);
          }
          setProfileGoalDraft(
            glb !== null && !Number.isNaN(glb) && glb > 0 ? String(Math.round(glb * 100) / 100) : '',
          );
        }
      } catch (error) {
        console.warn('Failed to load profile body', error);
      }
    }

    loadProfile();
  }, []);

  // Persist automatically whenever history changes.
  // We wait until initial load finishes so we do not overwrite storage
  // with an empty array before reading existing data.
  useEffect(() => {
    if (!hasLoadedHistory) return;

    async function persistHistory() {
      try {
        await saveHistoryToStorage(workoutHistory);
      } catch (error) {
        console.warn('Failed to auto-save workout history', error);
      }
    }

    persistHistory();
  }, [workoutHistory, hasLoadedHistory]);

  useEffect(() => {
    if (!hasLoadedWeightLogs) return;

    async function persistWeightLogs() {
      try {
        await saveWeightLogsToStorage(weightLogs);
      } catch (error) {
        console.warn('Failed to auto-save weight logs', error);
      }
    }

    persistWeightLogs();
  }, [weightLogs, hasLoadedWeightLogs]);

  useEffect(() => {
    if (!hasLoadedWeeklySplitPlan) return;

    async function persistWeeklySplitPlan() {
      try {
        await AsyncStorage.setItem(WEEKLY_SPLIT_PLAN_STORAGE_KEY, JSON.stringify(weeklySplitPlan));
      } catch (error) {
        console.warn('Failed to save weekly split plan', error);
      }
    }

    persistWeeklySplitPlan();
  }, [weeklySplitPlan, hasLoadedWeeklySplitPlan]);

  // Persist theme whenever it changes.
  useEffect(() => {
    if (!hasLoadedTheme) return;

    async function persistThemePreference() {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (error) {
        console.warn('Failed to save theme preference', error);
      }
    }

    persistThemePreference();
  }, [theme, hasLoadedTheme]);

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

    screenTransitionOpacity.setValue(0);
    Animated.timing(screenTransitionOpacity, {
      toValue: 1,
      duration: SCREEN_TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [currentScreen, screenTransitionOpacity]);

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

  function getSafeWeightValue(weightText) {
    const numericValue = Number.parseFloat(weightText);
    if (Number.isNaN(numericValue) || numericValue < 0) return 0;
    return numericValue;
  }

  function appendSetForExercise(workoutSlotId, setWeight, setReps, timeSeconds) {
    const originMs = workoutTimerOriginMsRef.current;
    const resolvedElapsed =
      typeof timeSeconds === 'number'
        ? timeSeconds
        : originMs != null
          ? Math.max(0, Math.floor((Date.now() - originMs) / 1000))
          : elapsedSeconds;
    const newSet = {
      reps: setReps,
      weight: setWeight,
      elapsedSeconds: resolvedElapsed,
    };
    setSetsByMovement((previousValue) => {
      const existingSets = previousValue[workoutSlotId] || [];
      return {
        ...previousValue,
        [workoutSlotId]: [...existingSets, newSet],
      };
    });
    setLastLoggedSet({ movement: workoutSlotId, weight: setWeight, reps: setReps });
  }

  function sanitizeNotepadWeight(text) {
    let out = '';
    let sawDot = false;
    for (let i = 0; i < text.length; i += 1) {
      const c = text[i];
      if (c >= '0' && c <= '9') {
        out += c;
      } else if (c === '.' && !sawDot) {
        sawDot = true;
        out += c;
      }
    }
    return out;
  }

  function sanitizeNotepadReps(text) {
    return text.replace(/\D/g, '');
  }

  function resetNotepadInput() {
    setNotepadWeightInput('');
    setNotepadRepsInput('');
  }

  function applyNotepadPrefillForExercise(exerciseName) {
    const name = String(exerciseName || '').trim();
    if (!name) {
      resetNotepadInput();
      return;
    }
    const last = getMostRecentSetForMovementName(
      name,
      setsByMovement,
      workoutMovementOrder,
      workoutHistory,
    );
    if (!last) {
      resetNotepadInput();
      return;
    }
    setNotepadRepsInput('');
    if (isBodyweightOnlyExercise(name, exerciseLookup)) {
      setNotepadWeightInput('');
      return;
    }
    setNotepadWeightInput(formatWeightForNotepadInput(last.weight));
  }

  function focusNotepadRepsField() {
    notepadRepsRef.current?.focus();
  }

  /** Space in the weight field jumps to reps (also strips any spaces / non-numeric except one dot). */
  function handleNotepadWeightChange(text) {
    if (/\s/.test(text)) {
      const beforeSpace = text.split(/\s/)[0];
      setNotepadWeightInput(sanitizeNotepadWeight(beforeSpace));
      focusNotepadRepsField();
      return;
    }
    setNotepadWeightInput(sanitizeNotepadWeight(text));
  }

  /** Enter / newline in the reps field saves the set. */
  function handleNotepadRepsChange(text) {
    if (text.includes('\n')) {
      const cleaned = sanitizeNotepadReps(text.replace(/\n/g, ''));
      setNotepadRepsInput(cleaned);
      commitNotepadSet(undefined, cleaned);
      return;
    }
    setNotepadRepsInput(sanitizeNotepadReps(text));
  }

  function commitNotepadSet(weightOverride, repsOverride) {
    const exercise = activeMovementName.trim();
    const slotId = logSetSheetExercise;
    if (!exercise) {
      Alert.alert('Exercise Required', 'Choose an exercise below before saving a set.');
      return;
    }
    if (!slotId) {
      Alert.alert('Exercise Required', 'Open an exercise from your workout list before saving a set.');
      return;
    }
    const needsWeight = !isBodyweightOnlyExercise(exercise, exerciseLookup);
    const w = (weightOverride !== undefined ? weightOverride : notepadWeightInput).trim();
    const r = (repsOverride !== undefined ? repsOverride : notepadRepsInput).trim();
    if (needsWeight) {
      if (!w || !r) {
        Alert.alert('Incomplete set', 'Enter weight and reps, then press Enter.');
        return;
      }
    } else if (!r) {
      Alert.alert('Incomplete set', 'Enter reps, then press Enter.');
      return;
    }
    const parsedWeight = needsWeight ? Number.parseFloat(w) : 0;
    const parsedReps = Number.parseInt(r, 10);
    if (needsWeight) {
      if (Number.isNaN(parsedWeight) || parsedWeight < 0 || Number.isNaN(parsedReps) || parsedReps < 0) {
        Alert.alert('Invalid numbers', 'Weight must be 0 or more. Reps must be 0 or more.');
        return;
      }
    } else if (Number.isNaN(parsedReps) || parsedReps < 0) {
      Alert.alert('Invalid numbers', 'Reps must be 0 or more.');
      return;
    }
    appendSetForExercise(slotId, parsedWeight, parsedReps);
    if (needsWeight) {
      setNotepadRepsInput('');
      requestAnimationFrame(() => {
        notepadRepsRef.current?.focus();
      });
    } else {
      resetNotepadInput();
      requestAnimationFrame(() => {
        notepadRepsRef.current?.focus();
      });
    }
  }

  function handleRepeatLastSet() {
    if (!lastLoggedSet || !logSetSheetExercise || lastLoggedSet.movement !== logSetSheetExercise) {
      return;
    }
    const slotId = logSetSheetExercise;
    appendSetForExercise(slotId, lastLoggedSet.weight, lastLoggedSet.reps);
    const needsWeight = !isBodyweightOnlyExercise(activeMovementName.trim(), exerciseLookup);
    if (needsWeight) {
      setNotepadRepsInput('');
      requestAnimationFrame(() => {
        notepadRepsRef.current?.focus();
      });
    } else {
      resetNotepadInput();
      requestAnimationFrame(() => {
        notepadRepsRef.current?.focus();
      });
    }
  }

  const repeatLastSetEnabled = Boolean(
    lastLoggedSet && logSetSheetExercise && lastLoggedSet.movement === logSetSheetExercise,
  );

  async function handleEndWorkout() {
    setWorkoutTimerPaused(false);
    setAddMovementSheetVisible(false);
    setLogSetSheetExercise(null);
    const originMs = workoutTimerOriginMsRef.current;
    const finalElapsedSeconds =
      originMs != null ? Math.max(0, Math.floor((Date.now() - originMs) / 1000)) : elapsedSeconds;
    const setsForHistory = mergeWorkoutSlotsToExerciseMap(workoutMovementOrder, setsByMovement);
    const historyTotalReps = Object.values(setsForHistory).reduce((sum, movementSets) => {
      if (!Array.isArray(movementSets)) return sum;
      return (
        sum +
        movementSets.reduce((innerSum, setItem) => innerSum + (Number(setItem.reps) || 0), 0)
      );
    }, 0);
    const completedWorkout = {
      id: `${Date.now()}`,
      completedAt: new Date().toISOString(),
      elapsedSeconds: finalElapsedSeconds,
      setsByMovement: setsForHistory,
      totalReps: historyTotalReps,
    };

    try {
      const updatedHistory = [completedWorkout, ...workoutHistory];
      setWorkoutHistory(updatedHistory);
      // Save immediately when workout ends so it still exists
      // after app close/reopen.
      await saveHistoryToStorage(updatedHistory);
    } catch (error) {
      console.warn('Failed to save workout history', error);
      Alert.alert('Save Failed', 'Workout ended, but history could not be saved this time.');
    }

    setSetsByMovement(setsForHistory);
    setWorkoutMovementOrder([]);
    setCurrentScreen('summary');
  }

  function handleStartNewWorkout() {
    setElapsedSeconds(0);
    setSelectedMovement('');
    setCustomMovementName('');
    setUseCustomMovement(false);
    setSetsByMovement({});
    setWorkoutMovementOrder([]);
    setWorkoutTimerPaused(false);
    setAddMovementSheetVisible(false);
    setLogSetSheetExercise(null);
    setLastLoggedSet(null);
    workoutTimerOriginMsRef.current = null;
    resetNotepadInput();
    setCurrentScreen('workout');
  }

  function handleReturnToMenu() {
    setCurrentScreen('menu');
  }

  function handleReturnFromSubscreen() {
    setHistoryDayPick(null);
    setCurrentScreen(subNavigatorReturnRef.current === 'settings' ? 'settings' : 'menu');
  }

  function prepareProfileDraftsForEdit() {
    setProfileNameDraft(profileName);
    {
      const heightPick =
        profileHeightIn != null
          ? inchesToProfileHeightPickers(profileHeightIn)
          : inchesToProfileHeightPickers(null);
      setProfileHeightPickFeet(heightPick.feet);
      setProfileHeightPickInches(heightPick.inches);
    }
    setProfileGoalDraft(
      profileGoalWeightLb != null ? String(Math.round(profileGoalWeightLb * 100) / 100) : '',
    );
    setProfileHeightEditorOpen(false);
  }

  function handleOpenHistory() {
    subNavigatorReturnRef.current = 'menu';
    const now = new Date();
    setHistorySelectedMonth(now.getMonth());
    setHistorySelectedYear(now.getFullYear());
    setHistoryCalendarMonth(now.getMonth());
    setHistoryCalendarYear(now.getFullYear());
    setHistoryChartMode('month');
    setHistoryProgressSection('overview');
    setCurrentScreen('history');
  }

  function handleOpenHistoryFromMore() {
    subNavigatorReturnRef.current = 'settings';
    const now = new Date();
    setHistorySelectedMonth(now.getMonth());
    setHistorySelectedYear(now.getFullYear());
    setHistoryCalendarMonth(now.getMonth());
    setHistoryCalendarYear(now.getFullYear());
    setHistoryChartMode('month');
    setHistoryProgressSection('overview');
    setCurrentScreen('history');
  }

  function handleOpenHistoryDayDetail(pick) {
    setHistoryDayPick({ y: pick.y, m: pick.m, d: pick.d });
    setCurrentScreen('historyDay');
  }

  function handleCloseHistoryDayDetail() {
    setHistoryDayPick(null);
    setCurrentScreen('history');
  }

  function handleOpenStrengthMovements() {
    subNavigatorReturnRef.current = 'history';
    setCurrentScreen('strengthMovements');
  }

  function handleOpenMovementsFromMore() {
    subNavigatorReturnRef.current = 'settings';
    setCurrentScreen('strengthMovements');
  }

  function handleCloseStrengthMovements() {
    const dest = subNavigatorReturnRef.current;
    if (dest === 'settings') setCurrentScreen('settings');
    else if (dest === 'history') setCurrentScreen('history');
    else setCurrentScreen('menu');
  }

  const handleToggleFavoriteMovement = useCallback((movementName) => {
    setFavoriteMovements((prev) => {
      const next = toggleFavoriteMovement(prev, movementName);
      saveFavoriteMovements(next).catch((error) => {
        console.warn('Failed to save favorite movements', error);
      });
      return next;
    });
  }, []);

  function handleOpenSettings() {
    setCurrentScreen('settings');
  }

  function handleOpenProfile() {
    subNavigatorReturnRef.current = 'menu';
    prepareProfileDraftsForEdit();
    setCurrentScreen('profile');
  }

  function handleOpenProfileFromMore() {
    subNavigatorReturnRef.current = 'settings';
    prepareProfileDraftsForEdit();
    setCurrentScreen('profile');
  }

  function handleOpenMoreGoals() {
    subNavigatorReturnRef.current = 'settings';
    setProfileGoalDraft(
      profileGoalWeightLb != null ? String(Math.round(profileGoalWeightLb * 100) / 100) : '',
    );
    setCurrentScreen('moreGoals');
  }

  function handleOpenStreakSubscreen() {
    subNavigatorReturnRef.current = 'settings';
    setCurrentScreen('streak');
  }

  function handleOpenAppearance() {
    subNavigatorReturnRef.current = 'settings';
    setCurrentScreen('appearance');
  }

  function handleOpenMuscleMapFromMore() {
    setCurrentScreen('muscles');
  }

  function handleOpenSplitPlanner() {
    splitPlannerReturnScreenRef.current = 'muscles';
    setCurrentScreen('splitPlanner');
  }

  function handleOpenSplitPlannerFromHome() {
    splitPlannerReturnScreenRef.current = 'menu';
    setCurrentScreen('splitPlanner');
  }

  function handleCloseSplitPlanner() {
    setCurrentScreen(splitPlannerReturnScreenRef.current);
  }

  const handleChangeWeeklySplitPlan = useCallback((nextPlan) => {
    setWeeklySplitPlan(normalizeWeeklySplitPlan(nextPlan));
  }, []);

  async function handleSaveProfile() {
    const cleanName = profileNameDraft.trim();

    function parseOptionalPositive(draft, label) {
      const t = draft.trim();
      if (!t) return { ok: true, value: null };
      const n = Number.parseFloat(t);
      if (Number.isNaN(n) || n <= 0) {
        return { ok: false, message: `${label} must be a positive number, or leave the field blank.` };
      }
      return { ok: true, value: n };
    }

    const parsedHeightIn = profileHeightPickersToInches(
      profileHeightPickFeet,
      profileHeightPickInches,
    );
    const goalRes = parseOptionalPositive(profileGoalDraft, 'Goal weight');
    if (!goalRes.ok) {
      Alert.alert('Check goal weight', goalRes.message);
      return;
    }

    const body = {
      heightIn: parsedHeightIn,
      weightLb: null,
      goalWeightLb: goalRes.value,
    };

    try {
      await AsyncStorage.setItem(PROFILE_NAME_STORAGE_KEY, cleanName);
      await AsyncStorage.setItem(PROFILE_BODY_STORAGE_KEY, JSON.stringify(body));
      setProfileName(cleanName);
      setProfileHeightIn(parsedHeightIn);
      setProfileGoalWeightLb(goalRes.value);
      {
        const hp = inchesToProfileHeightPickers(parsedHeightIn);
        setProfileHeightPickFeet(hp.feet);
        setProfileHeightPickInches(hp.inches);
      }
      setProfileGoalDraft(goalRes.value != null ? String(Math.round(goalRes.value * 100) / 100) : '');
      setProfileHeightEditorOpen(false);
      Alert.alert('Saved', 'Your profile was updated.');
      handleReturnFromSubscreen();
    } catch (error) {
      console.warn('Failed to save profile', error);
      Alert.alert('Save Failed', 'Could not save your profile this time.');
    }
  }

  async function handleSaveGoalsOnly() {
    const trimmed = profileGoalDraft.trim();
    let goalVal = null;
    if (trimmed) {
      const n = Number.parseFloat(trimmed);
      if (Number.isNaN(n) || n <= 0) {
        Alert.alert('Check goal weight', 'Enter a positive number, or leave the field blank to clear your goal.');
        return;
      }
      goalVal = n;
    }
    try {
      const savedBodyRaw = await AsyncStorage.getItem(PROFILE_BODY_STORAGE_KEY);
      let body = {
        heightIn: profileHeightIn,
        weightLb: null,
        goalWeightLb: goalVal,
      };
      if (savedBodyRaw) {
        const parsed = JSON.parse(savedBodyRaw);
        const parsedHeight =
          typeof parsed.heightIn === 'number' && !Number.isNaN(parsed.heightIn)
            ? parsed.heightIn
            : null;
        body = {
          heightIn: parsedHeight ?? profileHeightIn ?? null,
          weightLb: parsed.weightLb ?? null,
          goalWeightLb: goalVal,
        };
      }
      await AsyncStorage.setItem(PROFILE_BODY_STORAGE_KEY, JSON.stringify(body));
      setProfileGoalWeightLb(goalVal);
      setProfileGoalDraft(goalVal != null ? String(Math.round(goalVal * 100) / 100) : '');
      Alert.alert('Saved', 'Your goal weight was updated.');
      handleReturnFromSubscreen();
    } catch (error) {
      console.warn('Failed to save goal weight', error);
      Alert.alert('Save failed', 'Could not save your goal this time.');
    }
  }

  function getTodayDateInputValue() {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatWeightLogDateForInput(dateISO) {
    const d = new Date(dateISO || '');
    if (Number.isNaN(d.getTime())) return getTodayDateInputValue();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function closeWeightLogModal() {
    setIsWeightDatePickerVisible(false);
    setIsWeightLogModalVisible(false);
    setEditingWeightLogId(null);
  }

  function openWeightLogModal() {
    const now = new Date();
    setEditingWeightLogId(null);
    setWeightLogDraftValue('');
    setWeightLogDraftDate(getTodayDateInputValue());
    setWeightDatePickYear(now.getFullYear());
    setWeightDatePickMonth(now.getMonth() + 1);
    setWeightDatePickDay(now.getDate());
    setIsWeightLogModalVisible(true);
  }

  function openWeightLogModalForEdit(entry) {
    if (!entry?.id) return;
    const parsed = new Date(entry.dateISO || '');
    const dateForPickers = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    setEditingWeightLogId(entry.id);
    setWeightLogDraftValue(String(entry.weightLb ?? ''));
    setWeightLogDraftDate(formatWeightLogDateForInput(entry.dateISO));
    setWeightDatePickYear(dateForPickers.getFullYear());
    setWeightDatePickMonth(dateForPickers.getMonth() + 1);
    setWeightDatePickDay(dateForPickers.getDate());
    setIsWeightLogModalVisible(true);
  }

  function parseDateInputOrToday(text) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(text || '')) {
      const parsed = new Date(`${text}T12:00:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }

  function openWeightDatePicker() {
    Keyboard.dismiss();
    const parsed = parseDateInputOrToday(weightLogDraftDate);
    setWeightDatePickYear(parsed.getFullYear());
    setWeightDatePickMonth(parsed.getMonth() + 1);
    setWeightDatePickDay(parsed.getDate());
    setIsWeightDatePickerVisible(true);
  }

  function applyWeightDatePickerSelection() {
    const maxDay = getDaysInMonth(weightDatePickYear, weightDatePickMonth - 1);
    const clampedDay = Math.max(1, Math.min(maxDay, weightDatePickDay));
    const yyyy = String(weightDatePickYear);
    const mm = String(weightDatePickMonth).padStart(2, '0');
    const dd = String(clampedDay).padStart(2, '0');
    setWeightLogDraftDate(`${yyyy}-${mm}-${dd}`);
    setWeightDatePickDay(clampedDay);
    setIsWeightDatePickerVisible(false);
  }

  function saveWeightLogEntry() {
    const valueText = weightLogDraftValue.trim();
    if (!valueText) {
      Alert.alert('Missing weight', 'Enter your body weight before saving.');
      return;
    }
    const parsedWeight = Number.parseFloat(valueText);
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert('Invalid weight', 'Weight must be a positive number.');
      return;
    }

    const dateText = weightLogDraftDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
      Alert.alert('Invalid date', 'Use date format YYYY-MM-DD.');
      return;
    }
    const parsedDate = new Date(`${dateText}T12:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert('Invalid date', 'Please enter a real calendar date.');
      return;
    }
    const today = new Date();
    const todayKeyDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const pickedKeyDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    if (pickedKeyDate.getTime() > todayKeyDate.getTime()) {
      Alert.alert('Future date not allowed', 'Please choose today or an earlier date.');
      return;
    }

    if (editingWeightLogId) {
      setWeightLogs((previousLogs) =>
        previousLogs.map((entry) =>
          entry.id === editingWeightLogId
            ? { ...entry, dateISO: parsedDate.toISOString(), weightLb: parsedWeight }
            : entry,
        ),
      );
    } else {
      setWeightLogs((previousLogs) => [
        ...previousLogs,
        {
          id: `${Date.now()}`,
          dateISO: parsedDate.toISOString(),
          weightLb: parsedWeight,
        },
      ]);
    }
    closeWeightLogModal();
  }

  function handleDeleteWeightLogEntry(weightLogId) {
    Alert.alert('Delete entry?', 'Remove this weight entry?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setWeightLogs((previousLogs) => previousLogs.filter((entry) => entry.id !== weightLogId));
        },
      },
    ]);
  }

  function resetCurrentWorkoutFields() {
    setElapsedSeconds(0);
    setSelectedMovement('');
    setCustomMovementName('');
    setUseCustomMovement(false);
    setSetsByMovement({});
    setWorkoutMovementOrder([]);
    setWorkoutTimerPaused(false);
    setAddMovementSheetVisible(false);
    setLogSetSheetExercise(null);
    setLastLoggedSet(null);
    workoutTimerOriginMsRef.current = null;
    resetNotepadInput();
    cancelEditingStoredSet();
  }

  function handleCancelWorkout() {
    const hasAnyLoggedSets = Object.values(setsByMovement).some(
      (movementSets) => Array.isArray(movementSets) && movementSets.length > 0,
    );
    if (!hasAnyLoggedSets) {
      resetCurrentWorkoutFields();
      setCurrentScreen('menu');
      return;
    }
    Alert.alert('Cancel Workout?', 'This workout will not be saved to history.', [
      { text: 'Keep Workout', style: 'cancel' },
      {
        text: 'Cancel Workout',
        style: 'destructive',
        onPress: () => {
          resetCurrentWorkoutFields();
          setCurrentScreen('menu');
        },
      },
    ]);
  }

  function handleToggleWorkoutPause() {
    if (workoutTimerPaused) {
      const origin = workoutTimerOriginMsRef.current;
      const e =
        origin != null
          ? Math.max(0, Math.floor((Date.now() - origin) / 1000))
          : elapsedSeconds;
      workoutTimerOriginMsRef.current = Date.now() - e * 1000;
      setWorkoutTimerPaused(false);
    } else {
      const origin = workoutTimerOriginMsRef.current;
      const e =
        origin != null
          ? Math.max(0, Math.floor((Date.now() - origin) / 1000))
          : elapsedSeconds;
      setElapsedSeconds(e);
      workoutTimerOriginMsRef.current = null;
      setWorkoutTimerPaused(true);
    }
  }

  function handlePickExerciseForWorkout(exerciseName) {
    const trimmed = String(exerciseName || '').trim();
    if (!trimmed) return;
    const slot = { id: createWorkoutSlotId(), name: trimmed };
    setWorkoutMovementOrder((prev) => [...prev, slot]);
  }

  function handleOpenLogSetSheet(workoutSlotId) {
    const id = String(workoutSlotId || '').trim();
    if (!id) return;
    const slot = workoutMovementOrder.find((s) => s.id === id);
    if (!slot) return;
    setUseCustomMovement(false);
    setSelectedMovement(slot.name);
    applyNotepadPrefillForExercise(slot.name);
    setLogSetSheetExercise(id);
  }

  function handleCloseLogSetSheet() {
    setLogSetSheetExercise(null);
    setSelectedMovement('');
    resetNotepadInput();
  }

  function removeMovementFromWorkout(workoutSlotId) {
    const id = String(workoutSlotId || '').trim();
    if (!id) return;
    setWorkoutMovementOrder((prev) => prev.filter((slot) => slot.id !== id));
    setSetsByMovement((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
    if (logSetSheetExercise === id) {
      setLogSetSheetExercise(null);
      setSelectedMovement('');
      resetNotepadInput();
    }
    if (editingSetKey?.startsWith(`${id}::`)) {
      cancelEditingStoredSet();
    }
  }

  function handleRequestRemoveMovementFromWorkout(movementName) {
    removeMovementFromWorkout(movementName);
  }

  function handleRequestCompleteWorkout() {
    Alert.alert('Complete workout?', 'This workout will be saved to your history.', [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Complete', style: 'default', onPress: () => handleEndWorkout() },
    ]);
  }

  function handleDeleteWorkout(workoutId) {
    Alert.alert('Delete Workout?', 'Remove this workout from history?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setWorkoutHistory((previousHistory) =>
            previousHistory.filter((workoutItem) => workoutItem.id !== workoutId),
          );
        },
      },
    ]);
  }

  function startEditingStoredSet(movement, setIndex, setItem) {
    setEditingSetKey(`${movement}::${setIndex}`);
    setEditingReps(String(setItem.reps));
    setEditingWeight(String(setItem.weight));
  }

  function cancelEditingStoredSet() {
    setEditingSetKey(null);
    setEditingReps('0');
    setEditingWeight('0');
  }

  function saveEditingStoredSet(movement, setIndex) {
    const safeReps = Math.max(0, Number.parseInt(editingReps || '0', 10) || 0);
    const safeWeight = getSafeWeightValue(editingWeight);

    setSetsByMovement((previousValue) => {
      const movementSets = previousValue[movement] || [];
      const updatedSets = movementSets.map((setItem, index) => {
        if (index !== setIndex) return setItem;
        return {
          ...setItem,
          reps: safeReps,
          weight: safeWeight,
        };
      });

      return {
        ...previousValue,
        [movement]: updatedSets,
      };
    });

    cancelEditingStoredSet();
  }

  function deleteStoredSet(movement, setIndex) {
    setSetsByMovement((previousValue) => {
      const movementSets = previousValue[movement] || [];
      const updatedSets = movementSets.filter((_, index) => index !== setIndex);

      if (updatedSets.length === 0) {
        const { [movement]: _removedMovement, ...restMovements } = previousValue;
        return restMovements;
      }

      return {
        ...previousValue,
        [movement]: updatedSets,
      };
    });

    if (editingSetKey === `${movement}::${setIndex}`) {
      cancelEditingStoredSet();
    }
  }

  function renderWorkoutStoredSetsForMovement(storageKey, exerciseDisplayName) {
    const wt = WORKOUT_THEME;
    const nameForMeta = String(exerciseDisplayName || storageKey || '').trim();
    const movementSets = setsByMovement[storageKey] || [];
    if (movementSets.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: wt.textMuted }]}>No sets for this exercise yet.</Text>
      );
    }
    return movementSets.map((setItem, index) => {
      const isLast = index === movementSets.length - 1;
      const hideWeightWhileEditing =
        isBodyweightOnlyExercise(nameForMeta, exerciseLookup) && Number(setItem.weight) === 0;
      const wNum = Number(setItem.weight ?? 0);
      const weightDisplay =
        isBodyweightOnlyExercise(nameForMeta, exerciseLookup) && wNum === 0
          ? 'BW'
          : Number.isFinite(wNum) && !Number.isNaN(wNum) && Math.abs(wNum - Math.round(wNum)) < 1e-6
            ? String(Math.round(wNum))
            : String(setItem.weight ?? '');
      return (
        <View
          key={`${storageKey}-${index}`}
          style={[
            styles.logSheetSetListRow,
            isLast && { borderBottomWidth: 0, marginBottom: 4, paddingBottom: 0 },
          ]}>
          <Text style={styles.logSheetSetListNumber}>{index + 1}</Text>
          <View style={styles.logSheetSetListMain}>
            <View style={styles.logSheetSetListValuesRow}>
              <View style={styles.logSheetSetListFieldCol}>
                <Text style={[styles.logSheetSetListFieldLabel, { color: wt.textMuted }]}>Reps</Text>
                <View
                  style={[
                    styles.logSheetSetListValueBox,
                    {
                      backgroundColor: wt.splitModalInnerBg,
                      borderColor: wt.inputBorder,
                    },
                  ]}>
                  <Text style={[styles.logSheetSetListValueText, { color: wt.textPrimary }]}>{setItem.reps}</Text>
                </View>
              </View>
              <Text style={[styles.logSheetSetListAt, { color: wt.textSecondary }]}>@</Text>
              <View style={styles.logSheetSetListFieldCol}>
                <Text style={[styles.logSheetSetListFieldLabel, { color: wt.textMuted }]}>Weight</Text>
                <View
                  style={[
                    styles.logSheetSetListValueBox,
                    {
                      backgroundColor: wt.splitModalInnerBg,
                      borderColor: wt.inputBorder,
                    },
                  ]}>
                  <Text style={[styles.logSheetSetListValueText, { color: wt.textPrimary }]}>
                    {weightDisplay}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.logSheetSetListMeta, { color: wt.textMuted }]}>
              {formatTime(setItem.elapsedSeconds)}
            </Text>
            <View style={styles.logSheetSetListActions}>
              <TouchableOpacity
                style={[styles.smallActionButton, { backgroundColor: wt.secondaryButtonBg }]}
                onPress={() => startEditingStoredSet(storageKey, index, setItem)}>
                <Text style={[styles.smallActionButtonText, { color: wt.secondaryButtonText }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallActionButton, styles.smallDeleteButton]}
                onPress={() => deleteStoredSet(storageKey, index)}>
                <Text style={styles.smallDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>

            {editingSetKey === `${storageKey}::${index}` ? (
              <View style={[styles.editSetPanel, { borderColor: wt.inputBorder }]}>
                <TextInput
                  value={editingReps}
                  onChangeText={setEditingReps}
                  keyboardType="number-pad"
                  placeholder="Reps"
                  placeholderTextColor={wt.placeholderText}
                  style={[
                    styles.editSetInput,
                    {
                      backgroundColor: wt.inputBg,
                      color: wt.inputText,
                      borderColor: wt.inputBorder,
                    },
                  ]}
                />
                {hideWeightWhileEditing ? null : (
                  <TextInput
                    value={editingWeight}
                    onChangeText={setEditingWeight}
                    keyboardType="decimal-pad"
                    placeholder="Weight"
                    placeholderTextColor={wt.placeholderText}
                    style={[
                      styles.editSetInput,
                      {
                        backgroundColor: wt.inputBg,
                        color: wt.inputText,
                        borderColor: wt.inputBorder,
                      },
                    ]}
                  />
                )}
                <View style={styles.editSetActions}>
                  <TouchableOpacity
                    style={[styles.smallActionButton, { backgroundColor: wt.primaryButtonBg }]}
                    onPress={() => saveEditingStoredSet(storageKey, index)}>
                    <Text style={[styles.smallActionButtonText, { color: wt.primaryButtonText }]}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallActionButton, { backgroundColor: wt.secondaryButtonBg }]}
                    onPress={cancelEditingStoredSet}>
                    <Text style={[styles.smallActionButtonText, { color: wt.secondaryButtonText }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      );
    });
  }

  const displaySetsByMovement = useMemo(() => {
    if (!workoutMovementOrder || workoutMovementOrder.length === 0) {
      return setsByMovement;
    }
    return mergeWorkoutSlotsToExerciseMap(workoutMovementOrder, setsByMovement);
  }, [workoutMovementOrder, setsByMovement]);

  /** Exercise cards: most recently logged set first so the current movement stays near the top. */
  const movementNamesNewestFirst = useMemo(() => {
    const names = Object.keys(displaySetsByMovement);
    return [...names].sort((a, b) => {
      const setsA = displaySetsByMovement[a] || [];
      const setsB = displaySetsByMovement[b] || [];
      const maxA = setsA.length === 0 ? -1 : Math.max(...setsA.map((s) => Number(s.elapsedSeconds) || 0));
      const maxB = setsB.length === 0 ? -1 : Math.max(...setsB.map((s) => Number(s.elapsedSeconds) || 0));
      if (maxB !== maxA) return maxB - maxA;
      return a.localeCompare(b);
    });
  }, [displaySetsByMovement]);

  const totalReps = useMemo(() => {
    return Object.values(setsByMovement).reduce((sum, movementSets) => {
      if (!Array.isArray(movementSets)) return sum;
      return (
        sum +
        movementSets.reduce((innerSum, setItem) => innerSum + (Number(setItem.reps) || 0), 0)
      );
    }, 0);
  }, [setsByMovement]);

  const historySelectedDate = useMemo(
    () => new Date(historySelectedYear, historySelectedMonth, 1),
    [historySelectedYear, historySelectedMonth],
  );

  const shiftHistoryMonth = useCallback((delta) => {
    const nextDate = new Date(historySelectedYear, historySelectedMonth + delta, 1);
    setHistorySelectedMonth(nextDate.getMonth());
    setHistorySelectedYear(nextDate.getFullYear());
  }, [historySelectedMonth, historySelectedYear]);

  const shiftHistoryYear = useCallback((delta) => {
    setHistorySelectedYear((previousYear) => previousYear + delta);
  }, []);

  const shiftHistoryCalendarMonth = useCallback((delta) => {
    const nextDate = new Date(historyCalendarYear, historyCalendarMonth + delta, 1);
    setHistoryCalendarMonth(nextDate.getMonth());
    setHistoryCalendarYear(nextDate.getFullYear());
  }, [historyCalendarMonth, historyCalendarYear]);

  /** All weight logs, newest first — used in the Progress “Entries” list. */
  const historyAllWeightLogsSorted = useMemo(() => {
    return [...weightLogs]
      .filter((logItem) => logItem && logItem.dateISO)
      .filter((logItem) => !Number.isNaN(new Date(logItem.dateISO).getTime()))
      .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  }, [weightLogs]);

  const monthlyVolumeStats = useMemo(
    () => buildMonthlyDailyVolume(workoutHistory, historySelectedDate),
    [workoutHistory, historySelectedDate],
  );
  const yearlyVolumeStats = useMemo(
    () => buildYearlyMonthlyVolume(workoutHistory, historySelectedYear),
    [workoutHistory, historySelectedYear],
  );

  const historyMonthLabel = useMemo(() => {
    return historySelectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [historySelectedDate]);
  const historyYearLabel = useMemo(() => `${historySelectedYear}`, [historySelectedYear]);
  const historyMonthXAxisLabels = useMemo(
    () => monthlyVolumeStats.byDay.map((_, index) => `${index + 1}`),
    [monthlyVolumeStats.byDay],
  );
  const weightDatePickerYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, index) => currentYear - 10 + index);
  }, []);
  const weightDatePickerMonthOptions = useMemo(() => {
    const today = new Date();
    const maxMonth = weightDatePickYear === today.getFullYear() ? today.getMonth() + 1 : 12;
    return Array.from({ length: maxMonth }, (_, index) => index + 1);
  }, [weightDatePickYear]);
  const weightDatePickerDayOptions = useMemo(() => {
    const today = new Date();
    let dayCount = getDaysInMonth(weightDatePickYear, weightDatePickMonth - 1);
    if (
      weightDatePickYear === today.getFullYear() &&
      weightDatePickMonth === today.getMonth() + 1
    ) {
      dayCount = Math.min(dayCount, today.getDate());
    }
    return Array.from({ length: dayCount }, (_, index) => index + 1);
  }, [weightDatePickMonth, weightDatePickYear]);

  useEffect(() => {
    const today = new Date();
    if (
      weightDatePickYear === today.getFullYear() &&
      weightDatePickMonth > today.getMonth() + 1
    ) {
      setWeightDatePickMonth(today.getMonth() + 1);
      return;
    }
    const maxDay = getDaysInMonth(weightDatePickYear, weightDatePickMonth - 1);
    const todayMaxDay =
      weightDatePickYear === today.getFullYear() &&
      weightDatePickMonth === today.getMonth() + 1
        ? today.getDate()
        : maxDay;
    if (weightDatePickDay > todayMaxDay) setWeightDatePickDay(todayMaxDay);
  }, [weightDatePickYear, weightDatePickMonth, weightDatePickDay]);

  const historyYearXAxisLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, monthIdx) =>
        new Date(2026, monthIdx, 1).toLocaleDateString(undefined, { month: 'short' }),
      ),
    [],
  );
  const historyChartValues = historyChartMode === 'year' ? yearlyVolumeStats.byMonth : monthlyVolumeStats.byDay;
  const historyChartMax = historyChartMode === 'year' ? yearlyVolumeStats.maxVolume : monthlyVolumeStats.maxVolume;
  const workoutsForHistoryDay = useMemo(() => {
    if (!historyDayPick) return [];
    return workoutHistory
      .filter((workoutItem) => {
        if (!workoutItem?.completedAt) return false;
        const t = new Date(workoutItem.completedAt);
        if (Number.isNaN(t.getTime())) return false;
        return (
          t.getFullYear() === historyDayPick.y &&
          t.getMonth() === historyDayPick.m &&
          t.getDate() === historyDayPick.d
        );
      })
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [workoutHistory, historyDayPick]);

  const historyDayScreenTitle = useMemo(() => {
    if (!historyDayPick) return '';
    return new Date(historyDayPick.y, historyDayPick.m, historyDayPick.d).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [historyDayPick]);

  /** Every weigh-in, oldest → newest; x-labels are month + day (adds year if logs span multiple years). */
  const historyWeightChartPoints = useMemo(() => {
    const valid = [...weightLogs].filter((logItem) => {
      if (!logItem?.dateISO) return false;
      const d = new Date(logItem.dateISO);
      return !Number.isNaN(d.getTime());
    });
    valid.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
    const years = new Set(valid.map((l) => new Date(l.dateISO).getFullYear()));
    const multiYear = years.size > 1;
    return valid.map((logItem) => {
      const d = new Date(logItem.dateISO);
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const label = multiYear ? `${m}/${day}/${String(d.getFullYear()).slice(-2)}` : `${m}/${day}`;
      return {
        label,
        value: Number(logItem.weightLb),
      };
    });
  }, [weightLogs]);

  const weeklyStreakDays = useMemo(() => {
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const now = new Date();
    const todayIdx = now.getDay();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - todayIdx);

    const dayKeysWithWorkout = new Set();
    workoutHistory.forEach((workoutItem) => {
      if (!workoutItem?.completedAt) return;
      const d = new Date(workoutItem.completedAt);
      if (Number.isNaN(d.getTime())) return;
      dayKeysWithWorkout.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });

    return labels.map((label, idx) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + idx);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const hasWorkout = dayKeysWithWorkout.has(key);
      const isToday = idx === todayIdx;
      return {
        key: `${label}-${key}`,
        label,
        hasWorkout,
        isToday,
      };
    });
  }, [workoutHistory]);

  const weeklyWorkoutsLoggedCount = useMemo(
    () => weeklyStreakDays.filter((dayItem) => dayItem.hasWorkout).length,
    [weeklyStreakDays],
  );

  /** Sun–Sat split-based progress when split is set (matches home week strip); else Sun–Sat logged days / 7. */
  const menuWeekGymProgress = useMemo(() => {
    if (weeklySplitPlanIsConfigured(weeklySplitPlan)) {
      return getSplitWeekWorkoutProgress(weeklySplitPlan, workoutHistory);
    }
    return { completed: weeklyWorkoutsLoggedCount, target: 7 };
  }, [weeklySplitPlan, workoutHistory, weeklyWorkoutsLoggedCount]);

  const consecutiveTrainingWeekStreak = useMemo(
    () => computeConsecutiveTrainingWeekStreak(workoutHistory),
    [workoutHistory],
  );

  const strengthScoreSummary = useMemo(
    () =>
      computeStrengthScoreSummary(
        workoutHistory,
        weightLogs,
        exerciseLookup,
        consecutiveTrainingWeekStreak,
        new Date(),
        strengthScorePersistedRef.current,
      ),
    [workoutHistory, weightLogs, exerciseLookup, consecutiveTrainingWeekStreak],
  );

  useEffect(() => {
    if (!strengthScoreSummary.hasData) return;
    const next = strengthScoreSummary.overallScore;
    if (strengthScorePersistedRef.current === next) return;
    strengthScorePersistedRef.current = next;
    AsyncStorage.setItem(STRENGTH_SCORE_DISPLAYED_KEY, String(next)).catch((error) => {
      console.warn('Failed to save strength score', error);
    });
  }, [strengthScoreSummary.hasData, strengthScoreSummary.overallScore]);

  const consecutivePerfectWeekStreak = useMemo(
    () => computeConsecutivePerfectWeekStreak(weeklySplitPlan, workoutHistory),
    [weeklySplitPlan, workoutHistory],
  );

  const lastWorkoutSummary = useMemo(() => {
    const last = workoutHistory[0];
    if (!last?.completedAt || !last.setsByMovement || typeof last.setsByMovement !== 'object') return null;
    const map = last.setsByMovement;
    let movementCount = 0;
    let setCount = 0;
    let repSum = 0;
    Object.keys(map).forEach((name) => {
      const arr = map[name];
      if (!Array.isArray(arr) || arr.length === 0) return;
      movementCount += 1;
      setCount += arr.length;
      arr.forEach((s) => {
        repSum += Number(s?.reps ?? 0) || 0;
      });
    });
    if (setCount === 0) return null;
    const completedAt = new Date(last.completedAt);
    if (Number.isNaN(completedAt.getTime())) return null;
    const dateStr = completedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const elapsed = Math.max(0, Math.floor(Number(last.elapsedSeconds) || 0));
    const minutes = Math.round(elapsed / 60);
    const durLabel = minutes < 1 ? '< 1 min' : `${minutes} min`;
    const vol = getWorkoutVolumeLb(last);
    const volLabel = vol >= 1000 ? `${(vol / 1000).toFixed(1)}k lb volume` : `${Math.round(vol)} lb volume`;
    return {
      titleLine: `${dateStr} · ${durLabel}`,
      detailLine: `${movementCount} ${movementCount === 1 ? 'exercise' : 'exercises'} · ${setCount} sets · ${repSum} reps · ${volLabel}`,
    };
  }, [workoutHistory]);

  const lastWorkoutPplBreakdown = useMemo(() => {
    const last = workoutHistory[0];
    return aggregateSingleWorkoutPplBreakdown(last, exerciseLookup);
  }, [workoutHistory, exerciseLookup]);

  const usesMainTabsNav =
    currentScreen === 'menu' ||
    currentScreen === 'history' ||
    currentScreen === 'settings' ||
    currentScreen === 'muscles';

  if (usesMainTabsNav) {
    const mainTabsSafeAreaStyle =
      currentScreen === 'menu' || currentScreen === 'history'
        ? styles.menuScreenWithHeaderSafeArea
        : currentScreen === 'muscles'
          ? [styles.safeArea, { backgroundColor: WORKOUT_THEME.screenBg }]
          : [styles.safeArea, { backgroundColor: MAIN_TAB_SHELL_BG }];

    const mainTabsBottomFadeColor =
      currentScreen === 'muscles' ? WORKOUT_THEME.screenBg : MAIN_TAB_SHELL_BG;
    const mainTabsBottomFadeHeight = Math.min(200, Math.round(mainTabBottomReserve + 48));

    return (
      <>
        <StatusBar
          barStyle={
            currentScreen === 'menu' ||
            currentScreen === 'settings' ||
            currentScreen === 'muscles' ||
            currentScreen === 'history'
              ? 'light-content'
              : isLightTheme
                ? 'dark-content'
                : 'light-content'
          }
        />
        <MainTabsLayout
          edges={['top', 'left', 'right']}
          safeAreaStyle={mainTabsSafeAreaStyle}
          screenTransitionOpacity={screenTransitionOpacity}
          bottomEdgeFadeColor={mainTabsBottomFadeColor}
          bottomEdgeFadeHeight={mainTabsBottomFadeHeight}
          bottomBar={
            <MainBottomTabBar
              currentScreen={currentScreen}
              bottomInset={insets.bottom}
              onPressHome={handleReturnToMenu}
              onPressHistory={handleOpenHistory}
              onPressSettings={handleOpenSettings}
              onPressMuscles={() => setCurrentScreen('muscles')}
              onPressStartWorkout={handleStartNewWorkout}
            />
          }
        >
        <View style={{ flex: 1 }}>
          {currentScreen === 'menu' ? (
            <MenuHomeTabScreen
              mainTabBottomReserve={mainTabBottomReserve}
              menuWeekGymProgress={menuWeekGymProgress}
              consecutiveTrainingWeekStreak={consecutiveTrainingWeekStreak}
              consecutivePerfectWeekStreak={consecutivePerfectWeekStreak}
              profileName={profileName}
              weeklyStreakDays={weeklyStreakDays}
              weeklySplitPlan={weeklySplitPlan}
              weeklySubcategorySetCounts={weeklySubcategorySetCounts}
              weeklyWorkoutsLoggedCount={weeklyWorkoutsLoggedCount}
              lastWorkoutSummary={lastWorkoutSummary}
              workoutHistory={workoutHistory}
              exerciseLookup={exerciseLookup}
              onOpenProfile={handleOpenProfile}
              onOpenSplitPlannerFromHome={handleOpenSplitPlannerFromHome}
            />
          ) : null}

          {currentScreen === 'settings' ? (
            <MoreHubTabScreen
              moreHubScrollViewRef={moreHubScrollViewRef}
              mainTabBottomReserve={mainTabBottomReserve}
              handleMoreHubScroll={handleMoreHubScroll}
              restoreMoreHubScrollPosition={restoreMoreHubScrollPosition}
              handleOpenProfileFromMore={handleOpenProfileFromMore}
              handleOpenMoreGoals={handleOpenMoreGoals}
              handleOpenMovementsFromMore={handleOpenMovementsFromMore}
              handleOpenMuscleMapFromMore={handleOpenMuscleMapFromMore}
              handleOpenStreakSubscreen={handleOpenStreakSubscreen}
              handleOpenHistoryFromMore={handleOpenHistoryFromMore}
              handleOpenAppearance={handleOpenAppearance}
            />
          ) : null}

          {currentScreen === 'history' ? (
            <HistoryTabScreen
              mainTabBottomReserve={mainTabBottomReserve}
              historyProgressSection={historyProgressSection}
              setHistoryProgressSection={setHistoryProgressSection}
              openWeightLogModal={openWeightLogModal}
              openWeightLogModalForEdit={openWeightLogModalForEdit}
              historyWeightChartPoints={historyWeightChartPoints}
              historyAllWeightLogsSorted={historyAllWeightLogsSorted}
              handleDeleteWeightLogEntry={handleDeleteWeightLogEntry}
              historyChartMode={historyChartMode}
              setHistoryChartMode={setHistoryChartMode}
              historyCalendarMonth={historyCalendarMonth}
              historyCalendarYear={historyCalendarYear}
              shiftHistoryCalendarMonth={shiftHistoryCalendarMonth}
              historySelectedMonth={historySelectedMonth}
              historySelectedYear={historySelectedYear}
              shiftHistoryMonth={shiftHistoryMonth}
              shiftHistoryYear={shiftHistoryYear}
              historyYearLabel={historyYearLabel}
              historyMonthLabel={historyMonthLabel}
              historyChartValues={historyChartValues}
              historyMonthXAxisLabels={historyMonthXAxisLabels}
              historyYearXAxisLabels={historyYearXAxisLabels}
              historyChartMax={historyChartMax}
              workoutHistory={workoutHistory}
              strengthScoreSummary={strengthScoreSummary}
              onOpenStrengthMovements={handleOpenStrengthMovements}
              handleReturnFromSubscreen={handleReturnFromSubscreen}
              onOpenDayWorkouts={handleOpenHistoryDayDetail}
            />
          ) : null}

          {currentScreen === 'muscles' ? (
            <MuscleMapTabScreen
              mainTabBottomReserve={mainTabBottomReserve}
              weeklyPplCounts={weeklyPplCounts}
              weeklySubcategorySetCounts={weeklySubcategorySetCounts}
              lastWorkoutPplBreakdown={lastWorkoutPplBreakdown}
              weekStartMonday={weekStartMondayForTargets}
              weeklySplitPlan={weeklySplitPlan}
              onOpenSplitPlanner={handleOpenSplitPlanner}
            />
          ) : null}

          <MainTabsWeightLogModal
            colors={colors}
            isWeightLogModalVisible={isWeightLogModalVisible}
            closeWeightLogModal={closeWeightLogModal}
            isEditingWeightLog={Boolean(editingWeightLogId)}
            setIsWeightDatePickerVisible={setIsWeightDatePickerVisible}
            weightLogDraftValue={weightLogDraftValue}
            setWeightLogDraftValue={setWeightLogDraftValue}
            weightLogDraftDate={weightLogDraftDate}
            getTodayDateInputValue={getTodayDateInputValue}
            openWeightDatePicker={openWeightDatePicker}
            saveWeightLogEntry={saveWeightLogEntry}
            isWeightDatePickerVisible={isWeightDatePickerVisible}
            weightDatePickMonth={weightDatePickMonth}
            setWeightDatePickMonth={setWeightDatePickMonth}
            weightDatePickDay={weightDatePickDay}
            setWeightDatePickDay={setWeightDatePickDay}
            weightDatePickYear={weightDatePickYear}
            setWeightDatePickYear={setWeightDatePickYear}
            weightDatePickerMonthOptions={weightDatePickerMonthOptions}
            weightDatePickerDayOptions={weightDatePickerDayOptions}
            weightDatePickerYearOptions={weightDatePickerYearOptions}
            applyWeightDatePickerSelection={applyWeightDatePickerSelection}
          />
        </View>
      </MainTabsLayout>
      </>
    );
  }

  if (currentScreen === 'splitPlanner') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <WeeklySplitPlannerScreen
          screenTransitionOpacity={screenTransitionOpacity}
          onBack={handleCloseSplitPlanner}
          weeklySplitPlan={weeklySplitPlan}
          onChangeWeeklySplitPlan={handleChangeWeeklySplitPlan}
        />
      </>
    );
  }

  if (currentScreen === 'strengthMovements') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <StrengthMovementsScreen
          screenTransitionOpacity={screenTransitionOpacity}
          onBack={handleCloseStrengthMovements}
          workoutHistory={workoutHistory}
          exerciseLookup={exerciseLookup}
          favoriteMovements={favoriteMovements}
          onToggleFavoriteMovement={handleToggleFavoriteMovement}
        />
      </>
    );
  }

  if (currentScreen === 'historyDay') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <HistoryDayWorkoutsScreen
          screenTransitionOpacity={screenTransitionOpacity}
          onBack={handleCloseHistoryDayDetail}
          dayTitleLabel={historyDayScreenTitle}
          workoutsForDay={workoutsForHistoryDay}
          exerciseLookup={exerciseLookup}
          handleDeleteWorkout={handleDeleteWorkout}
          textPrimary="#EEF1FF"
          setText="#D8DDE6"
          deleteText="#FF7C7C"
          cardBg="#1E232B"
        />
      </>
    );
  }

  if (currentScreen === 'streak') {
    return (
      <StreakScreen
        screenTransitionOpacity={screenTransitionOpacity}
        onBack={handleReturnFromSubscreen}
        weeklyWorkoutsLoggedCount={weeklyWorkoutsLoggedCount}
        weeklyStreakDays={weeklyStreakDays}
        weeklySplitPlan={weeklySplitPlan}
        consecutiveTrainingWeekStreak={consecutiveTrainingWeekStreak}
      />
    );
  }

  if (currentScreen === 'moreGoals') {
    return (
      <MoreGoalsScreen
        screenTransitionOpacity={screenTransitionOpacity}
        onBack={handleReturnFromSubscreen}
        profileGoalDraft={profileGoalDraft}
        setProfileGoalDraft={setProfileGoalDraft}
        onSaveGoal={handleSaveGoalsOnly}
      />
    );
  }

  if (currentScreen === 'appearance') {
    return (
      <AppearanceScreen screenTransitionOpacity={screenTransitionOpacity} onBack={handleReturnFromSubscreen} />
    );
  }

  if (currentScreen === 'profile') {
    return (
      <ProfileScreen
        screenTransitionOpacity={screenTransitionOpacity}
        onBack={handleReturnFromSubscreen}
        profileNameDraft={profileNameDraft}
        setProfileNameDraft={setProfileNameDraft}
        profileHeightPickFeet={profileHeightPickFeet}
        setProfileHeightPickFeet={setProfileHeightPickFeet}
        profileHeightPickInches={profileHeightPickInches}
        setProfileHeightPickInches={setProfileHeightPickInches}
        profileHeightEditorOpen={profileHeightEditorOpen}
        setProfileHeightEditorOpen={setProfileHeightEditorOpen}
        profileGoalDraft={profileGoalDraft}
        setProfileGoalDraft={setProfileGoalDraft}
        onSaveProfile={handleSaveProfile}
      />
    );
  }

  // Summary screen after ending workout.
  if (currentScreen === 'summary') {
    return (
      <SummaryScreen
        colors={colors}
        screenTransitionOpacity={screenTransitionOpacity}
        elapsedSeconds={elapsedSeconds}
        totalReps={totalReps}
        movementNamesNewestFirst={movementNamesNewestFirst}
        setsByMovement={displaySetsByMovement}
        exerciseLookup={exerciseLookup}
        editingSetKey={editingSetKey}
        editingReps={editingReps}
        setEditingReps={setEditingReps}
        editingWeight={editingWeight}
        setEditingWeight={setEditingWeight}
        startEditingStoredSet={startEditingStoredSet}
        deleteStoredSet={deleteStoredSet}
        saveEditingStoredSet={saveEditingStoredSet}
        cancelEditingStoredSet={cancelEditingStoredSet}
        onStartNewWorkout={handleStartNewWorkout}
        onReturnToMenu={handleReturnToMenu}
      />
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: WORKOUT_THEME.screenBg }} edges={['left', 'right', 'bottom']}>
        <WorkoutScreen
          screenTransitionOpacity={screenTransitionOpacity}
          elapsedSeconds={elapsedSeconds}
          activeIsBodyweightOnly={activeIsBodyweightOnly}
          notepadRepsRef={notepadRepsRef}
          notepadWeightInputRef={notepadWeightInputRef}
          notepadRepsInput={notepadRepsInput}
          notepadWeightInput={notepadWeightInput}
          handleNotepadRepsChange={handleNotepadRepsChange}
          handleNotepadWeightChange={handleNotepadWeightChange}
          commitNotepadSet={commitNotepadSet}
          focusNotepadRepsField={focusNotepadRepsField}
          handleCancelWorkout={handleCancelWorkout}
          workoutMovementOrder={workoutMovementOrder}
          setsByMovement={setsByMovement}
          exerciseLookup={exerciseLookup}
          addMovementSheetVisible={addMovementSheetVisible}
          onOpenAddMovementSheet={() => setAddMovementSheetVisible(true)}
          onCloseAddMovementSheet={() => setAddMovementSheetVisible(false)}
          onPickExerciseForWorkout={handlePickExerciseForWorkout}
          logSetSheetExercise={logSetSheetExercise}
          onOpenLogSetSheet={handleOpenLogSetSheet}
          onCloseLogSetSheet={handleCloseLogSetSheet}
          onRequestRemoveMovementFromWorkout={handleRequestRemoveMovementFromWorkout}
          repeatLastSetEnabled={repeatLastSetEnabled}
          onRepeatLastSet={handleRepeatLastSet}
          workoutTimerPaused={workoutTimerPaused}
          onToggleWorkoutPause={handleToggleWorkoutPause}
          hasAnyLoggedSets={Object.values(setsByMovement).some(
            (arr) => Array.isArray(arr) && arr.length > 0,
          )}
          onRequestCompleteWorkout={handleRequestCompleteWorkout}
          renderWorkoutStoredSetsForMovement={renderWorkoutStoredSetsForMovement}
          weeklyPplCounts={weeklyPplCounts}
          weeklySubcategorySetCounts={weeklySubcategorySetCounts}
        />
      </SafeAreaView>
    </>
  );
}

