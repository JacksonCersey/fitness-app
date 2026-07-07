import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { buildExerciseLookup, EXERCISE_DATABASE } from '../../../data/exerciseDatabase';
import {
  PROFILE_NAME_STORAGE_KEY,
  PROFILE_BODY_STORAGE_KEY,
  WEEKLY_SPLIT_PLAN_STORAGE_KEY,
  STRENGTH_SCORE_DISPLAYED_KEY,
  ONBOARDING_COMPLETED_STORAGE_KEY,
} from '../../constants/storageKeys';
import { getDevUserOptions } from '../../data/devFixtures/devUsers';
import { computeStrengthScoreSummary } from '../../data/strengthScore';
import {
  computeAllTimeScheduledDayAdherence,
  getDefaultWeeklySplitPlan,
  getSplitWeekWorkoutProgress,
  normalizeWeeklySplitPlan,
  weeklySplitPlanIsConfigured,
} from '../../data/weeklySplitPlanner';
import { computeConsecutivePerfectWeekStreak } from '../../utils/consecutivePerfectWeekStreak';
import { computeConsecutiveTrainingWeekStreak } from '../../utils/consecutiveWeekStreak';
import {
  aggregateSingleWorkoutPplBreakdown,
  aggregateWeeklySetsByPpl,
  aggregateWeeklySetsBySubcategory,
  getMondayStartOfWeekLocal,
} from '../../utils/weeklyPplSetTotals';
import {
  inchesToProfileHeightPickers,
  profileHeightPickersToInches,
  PROFILE_HEIGHT_FT_SENTINEL,
  getWorkoutVolumeLb,
  getLifetimeVolumeLb,
} from '../../../utils/workoutStats';
import {
  loadFavoriteMovements,
  saveFavoriteMovements,
  toggleFavoriteMovement,
} from '../../utils/movementFavorites';
import {
  loadHistoryFromStorage,
  saveHistoryToStorage,
  loadWeightLogsFromStorage,
  saveWeightLogsToStorage,
  clearAllUserData,
  runScheduledUserDataWipeIfNeeded,
} from '../storage/persistedStorage';
import { getAppThemeColors } from '../theme/appThemeColors';
import {
  loadActiveDevUserId,
  loadUserDataSnapshot,
  resetAndSeedDevUserSnapshot,
  saveActiveDevUserId,
  saveUserDataSnapshot,
} from '../storage/devUserStorage';
import { resolveUserDataStorageKey } from '../storage/storageNamespace';

const AppStorageContext = createContext(null);

export function useAppStorage() {
  const ctx = useContext(AppStorageContext);
  if (!ctx) {
    throw new Error('useAppStorage must be used within AppStorageProvider');
  }
  return ctx;
}

export function AppStorageProvider({ children, onReturnFromSubscreenRef }) {
  const [profileName, setProfileName] = useState('');
  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [profileHeightIn, setProfileHeightIn] = useState(null);
  const [profileGoalWeightLb, setProfileGoalWeightLb] = useState(null);
  const [profileHeightPickFeet, setProfileHeightPickFeet] = useState(PROFILE_HEIGHT_FT_SENTINEL);
  const [profileHeightPickInches, setProfileHeightPickInches] = useState(0);
  const [profileHeightEditorOpen, setProfileHeightEditorOpen] = useState(false);
  const [profileGoalDraft, setProfileGoalDraft] = useState('');
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [favoriteMovements, setFavoriteMovements] = useState(() => new Set());
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [weightLogs, setWeightLogs] = useState([]);
  const [hasLoadedWeightLogs, setHasLoadedWeightLogs] = useState(false);
  const [weeklySplitPlan, setWeeklySplitPlan] = useState(() => getDefaultWeeklySplitPlan());
  const [hasLoadedWeeklySplitPlan, setHasLoadedWeeklySplitPlan] = useState(false);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [hasLoadedOnboarding, setHasLoadedOnboarding] = useState(false);
  const [storageBootstrapDone, setStorageBootstrapDone] = useState(false);
  const [devUserContextReady, setDevUserContextReady] = useState(!__DEV__);
  const [activeDevUserId, setActiveDevUserId] = useState(null);
  const strengthScorePersistedRef = useRef(null);
  const activeDevUserIdRef = useRef(null);
  const isApplyingDevSwitchRef = useRef(false);

  useEffect(() => {
    async function bootstrapStorage() {
      try {
        await runScheduledUserDataWipeIfNeeded();
      } catch (error) {
        console.warn('Storage bootstrap failed', error);
      } finally {
        setStorageBootstrapDone(true);
      }
    }

    bootstrapStorage();
  }, []);

  useEffect(() => {
    if (!storageBootstrapDone || !__DEV__) return;

    async function initDevUserContext() {
      try {
        const savedDevUserId = await loadActiveDevUserId();
        activeDevUserIdRef.current = savedDevUserId;
        setActiveDevUserId(savedDevUserId);
        if (savedDevUserId) {
          await resetAndSeedDevUserSnapshot(savedDevUserId);
        }
      } catch (error) {
        console.warn('Failed to init dev user context', error);
      } finally {
        setDevUserContextReady(true);
      }
    }

    initDevUserContext();
  }, [storageBootstrapDone]);

  const devUserOptions = useMemo(() => (__DEV__ ? getDevUserOptions() : []), []);

  const hasLoadedInitialData =
    hasLoadedHistory &&
    hasLoadedWeightLogs &&
    hasLoadedWeeklySplitPlan &&
    hasLoadedProfile;

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

  const colors = useMemo(() => getAppThemeColors(), []);

  useEffect(() => {
    if (!storageBootstrapDone || !devUserContextReady) return;

    async function loadWorkoutHistory() {
      try {
        const loadedHistory = await loadHistoryFromStorage(activeDevUserIdRef.current);
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
  }, [storageBootstrapDone, devUserContextReady]);

  useEffect(() => {
    if (!storageBootstrapDone || !devUserContextReady) return;

    async function loadFavorites() {
      const loaded = await loadFavoriteMovements(activeDevUserIdRef.current);
      setFavoriteMovements(loaded);
    }
    loadFavorites();
  }, [storageBootstrapDone, devUserContextReady]);

  useEffect(() => {
    if (!storageBootstrapDone || !devUserContextReady) return;

    async function loadStrengthScoreDisplayed() {
      try {
        const key = resolveUserDataStorageKey(
          STRENGTH_SCORE_DISPLAYED_KEY,
          activeDevUserIdRef.current,
        );
        const raw = await AsyncStorage.getItem(key);
        if (raw == null) return;
        const n = Number.parseFloat(raw);
        if (Number.isFinite(n) && n >= 0) strengthScorePersistedRef.current = n;
      } catch (error) {
        console.warn('Failed to load strength score', error);
      }
    }
    loadStrengthScoreDisplayed();
  }, [storageBootstrapDone, devUserContextReady]);

  useEffect(() => {
    if (!storageBootstrapDone || !devUserContextReady) return;

    async function loadWeightLogs() {
      try {
        const loadedLogs = await loadWeightLogsFromStorage(activeDevUserIdRef.current);
        setWeightLogs(loadedLogs);
      } catch (error) {
        console.warn('Failed to load weight logs', error);
      } finally {
        setHasLoadedWeightLogs(true);
      }
    }

    loadWeightLogs();
  }, [storageBootstrapDone, devUserContextReady]);

  useEffect(() => {
    if (!storageBootstrapDone || !devUserContextReady) return;

    async function loadWeeklySplitPlan() {
      try {
        const splitKey = resolveUserDataStorageKey(
          WEEKLY_SPLIT_PLAN_STORAGE_KEY,
          activeDevUserIdRef.current,
        );
        const raw = await AsyncStorage.getItem(splitKey);
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
  }, [storageBootstrapDone, devUserContextReady]);

  useEffect(() => {
    if (!storageBootstrapDone || !devUserContextReady) return;

    async function loadProfile() {
      try {
        const profileNameKey = resolveUserDataStorageKey(
          PROFILE_NAME_STORAGE_KEY,
          activeDevUserIdRef.current,
        );
        const savedProfileName = await AsyncStorage.getItem(profileNameKey);
        if (savedProfileName) {
          setProfileName(savedProfileName);
          setProfileNameDraft(savedProfileName);
        }
      } catch (error) {
        console.warn('Failed to load profile name', error);
      }
      try {
        const profileBodyKey = resolveUserDataStorageKey(
          PROFILE_BODY_STORAGE_KEY,
          activeDevUserIdRef.current,
        );
        const savedBodyRaw = await AsyncStorage.getItem(profileBodyKey);
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
      } finally {
        setHasLoadedProfile(true);
      }
    }

    loadProfile();
  }, [storageBootstrapDone, devUserContextReady]);

  useEffect(() => {
    if (!hasLoadedInitialData || hasLoadedOnboarding) return;

    async function resolveOnboardingStatus() {
      try {
        const onboardingKey = resolveUserDataStorageKey(
          ONBOARDING_COMPLETED_STORAGE_KEY,
          activeDevUserIdRef.current,
        );
        const flag = await AsyncStorage.getItem(onboardingKey);
        if (flag === 'true') {
          setOnboardingComplete(true);
          return;
        }

        const hasExistingData =
          workoutHistory.length > 0 ||
          weightLogs.length > 0 ||
          profileName.trim().length > 0 ||
          profileHeightIn != null ||
          profileGoalWeightLb != null;

        if (hasExistingData) {
          await AsyncStorage.setItem(onboardingKey, 'true');
          setOnboardingComplete(true);
          return;
        }

        setOnboardingComplete(false);
      } catch (error) {
        console.warn('Failed to resolve onboarding status', error);
        setOnboardingComplete(true);
      } finally {
        setHasLoadedOnboarding(true);
      }
    }

    resolveOnboardingStatus();
  }, [
    hasLoadedInitialData,
    hasLoadedOnboarding,
    workoutHistory,
    weightLogs,
    profileName,
    profileHeightIn,
    profileGoalWeightLb,
    weeklySplitPlan,
  ]);

  useEffect(() => {
    if (!hasLoadedHistory || isApplyingDevSwitchRef.current) return;

    async function persistHistory() {
      try {
        await saveHistoryToStorage(workoutHistory, activeDevUserIdRef.current);
      } catch (error) {
        console.warn('Failed to auto-save workout history', error);
      }
    }

    persistHistory();
  }, [workoutHistory, hasLoadedHistory]);

  useEffect(() => {
    if (!hasLoadedWeightLogs || isApplyingDevSwitchRef.current) return;

    async function persistWeightLogs() {
      try {
        await saveWeightLogsToStorage(weightLogs, activeDevUserIdRef.current);
      } catch (error) {
        console.warn('Failed to auto-save weight logs', error);
      }
    }

    persistWeightLogs();
  }, [weightLogs, hasLoadedWeightLogs]);

  useEffect(() => {
    if (!hasLoadedWeeklySplitPlan || isApplyingDevSwitchRef.current) return;

    async function persistWeeklySplitPlan() {
      try {
        const splitKey = resolveUserDataStorageKey(
          WEEKLY_SPLIT_PLAN_STORAGE_KEY,
          activeDevUserIdRef.current,
        );
        await AsyncStorage.setItem(splitKey, JSON.stringify(weeklySplitPlan));
      } catch (error) {
        console.warn('Failed to save weekly split plan', error);
      }
    }

    persistWeeklySplitPlan();
  }, [weeklySplitPlan, hasLoadedWeeklySplitPlan]);

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

  const menuWeekGymProgress = useMemo(() => {
    if (weeklySplitPlanIsConfigured(weeklySplitPlan)) {
      return getSplitWeekWorkoutProgress(weeklySplitPlan, workoutHistory);
    }
    return { completed: weeklyWorkoutsLoggedCount, target: 7 };
  }, [weeklySplitPlan, workoutHistory, weeklyWorkoutsLoggedCount]);

  const scheduledDayAdherence = useMemo(
    () => computeAllTimeScheduledDayAdherence(weeklySplitPlan, workoutHistory),
    [weeklySplitPlan, workoutHistory],
  );

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
    const strengthKey = resolveUserDataStorageKey(
      STRENGTH_SCORE_DISPLAYED_KEY,
      activeDevUserIdRef.current,
    );
    AsyncStorage.setItem(strengthKey, String(next)).catch((error) => {
      console.warn('Failed to save strength score', error);
    });
  }, [strengthScoreSummary.hasData, strengthScoreSummary.overallScore]);

  const lifetimeVolumeLb = useMemo(
    () => getLifetimeVolumeLb(workoutHistory),
    [workoutHistory],
  );

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

  const handleToggleFavoriteMovement = useCallback((movementName) => {
    setFavoriteMovements((prev) => {
      const next = toggleFavoriteMovement(prev, movementName);
      saveFavoriteMovements(next, activeDevUserIdRef.current).catch((error) => {
        console.warn('Failed to save favorite movements', error);
      });
      return next;
    });
  }, []);

  const handleDeleteWorkout = useCallback((workoutId) => {
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
  }, []);

  const handleChangeWeeklySplitPlan = useCallback((nextPlan) => {
    setWeeklySplitPlan(normalizeWeeklySplitPlan(nextPlan));
  }, []);

  const addWeightLogEntry = useCallback(({ weightLb, dateISO }) => {
    setWeightLogs((previousLogs) => [
      ...previousLogs,
      {
        id: `${Date.now()}`,
        dateISO,
        weightLb,
      },
    ]);
  }, []);

  const applySnapshotToState = useCallback((snapshot) => {
    isApplyingDevSwitchRef.current = true;
    strengthScorePersistedRef.current = snapshot.strengthScoreDisplayed;

    const cleanName = snapshot.profileName ?? '';
    setProfileName(cleanName);
    setProfileNameDraft(cleanName);
    setProfileHeightIn(snapshot.profileHeightIn);
    setProfileGoalWeightLb(snapshot.profileGoalWeightLb);
    {
      const heightPick =
        snapshot.profileHeightIn != null
          ? inchesToProfileHeightPickers(snapshot.profileHeightIn)
          : inchesToProfileHeightPickers(null);
      setProfileHeightPickFeet(heightPick.feet);
      setProfileHeightPickInches(heightPick.inches);
    }
    setProfileGoalDraft(
      snapshot.profileGoalWeightLb != null
        ? String(Math.round(snapshot.profileGoalWeightLb * 100) / 100)
        : '',
    );
    setProfileHeightEditorOpen(false);
    setWorkoutHistory(Array.isArray(snapshot.workoutHistory) ? snapshot.workoutHistory : []);
    setWeightLogs(Array.isArray(snapshot.weightLogs) ? snapshot.weightLogs : []);
    setWeeklySplitPlan(normalizeWeeklySplitPlan(snapshot.weeklySplitPlan));
    setFavoriteMovements(new Set(snapshot.favoriteMovements ?? []));
    setOnboardingComplete(Boolean(snapshot.onboardingComplete));
    setHasLoadedOnboarding(true);

    setTimeout(() => {
      isApplyingDevSwitchRef.current = false;
    }, 0);
  }, []);

  const captureCurrentSnapshot = useCallback(
    () => ({
      profileName,
      profileHeightIn,
      profileGoalWeightLb,
      workoutHistory,
      weightLogs,
      weeklySplitPlan,
      favoriteMovements: [...favoriteMovements],
      onboardingComplete,
      strengthScoreDisplayed: strengthScorePersistedRef.current,
    }),
    [
      profileName,
      profileHeightIn,
      profileGoalWeightLb,
      workoutHistory,
      weightLogs,
      weeklySplitPlan,
      favoriteMovements,
      onboardingComplete,
    ],
  );

  const switchDevUser = useCallback(
    async (nextUserId) => {
      if (!__DEV__) return;

      const outgoingUserId = activeDevUserIdRef.current;
      try {
        isApplyingDevSwitchRef.current = true;
        await saveHistoryToStorage(workoutHistory, outgoingUserId);
        await saveWeightLogsToStorage(weightLogs, outgoingUserId);
        await saveUserDataSnapshot(outgoingUserId, captureCurrentSnapshot());

        activeDevUserIdRef.current = nextUserId;
        setActiveDevUserId(nextUserId);
        await saveActiveDevUserId(nextUserId);

        const snapshot = !nextUserId
          ? await loadUserDataSnapshot(null)
          : await resetAndSeedDevUserSnapshot(nextUserId);

        applySnapshotToState(snapshot);
        if (__DEV__) {
          const label = nextUserId ?? 'real data';
          console.log(`[Dev] Switched to user: ${label} (fresh dates)`);
        }
      } catch (error) {
        isApplyingDevSwitchRef.current = false;
        console.warn('Failed to switch dev user', error);
        Alert.alert('Switch failed', 'Could not load that test user. Try again.');
      }
    },
    [workoutHistory, weightLogs, captureCurrentSnapshot, applySnapshotToState],
  );

  const resetAllUserData = useCallback(async () => {
    await clearAllUserData();
    strengthScorePersistedRef.current = null;
    setProfileName('');
    setProfileNameDraft('');
    setProfileHeightIn(null);
    setProfileGoalWeightLb(null);
    setProfileHeightPickFeet(PROFILE_HEIGHT_FT_SENTINEL);
    setProfileHeightPickInches(0);
    setProfileHeightEditorOpen(false);
    setProfileGoalDraft('');
    setWorkoutHistory([]);
    setFavoriteMovements(new Set());
    setWeightLogs([]);
    setWeeklySplitPlan(getDefaultWeeklySplitPlan());
    setOnboardingComplete(false);
    setHasLoadedOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    const onboardingKey = resolveUserDataStorageKey(
      ONBOARDING_COMPLETED_STORAGE_KEY,
      activeDevUserIdRef.current,
    );
    await AsyncStorage.setItem(onboardingKey, 'true');
    setOnboardingComplete(true);
  }, []);

  const saveOnboardingProfile = useCallback(
    async ({ name, heightIn, goalWeightLb, currentWeightLb }) => {
      const cleanName = name.trim();
      const body = {
        heightIn,
        weightLb: null,
        goalWeightLb,
      };

      const profileNameKey = resolveUserDataStorageKey(
        PROFILE_NAME_STORAGE_KEY,
        activeDevUserIdRef.current,
      );
      const profileBodyKey = resolveUserDataStorageKey(
        PROFILE_BODY_STORAGE_KEY,
        activeDevUserIdRef.current,
      );

      await AsyncStorage.setItem(profileNameKey, cleanName);
      await AsyncStorage.setItem(profileBodyKey, JSON.stringify(body));

      setProfileName(cleanName);
      setProfileNameDraft(cleanName);
      setProfileHeightIn(heightIn);
      setProfileGoalWeightLb(goalWeightLb);
      {
        const heightPick = inchesToProfileHeightPickers(heightIn);
        setProfileHeightPickFeet(heightPick.feet);
        setProfileHeightPickInches(heightPick.inches);
      }
      setProfileGoalDraft(String(Math.round(goalWeightLb * 100) / 100));
      setProfileHeightEditorOpen(false);

      if (currentWeightLb != null && currentWeightLb > 0) {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        addWeightLogEntry({ weightLb: currentWeightLb, dateISO: today.toISOString() });
      }
    },
    [addWeightLogEntry],
  );

  const syncProfileDraftFromSaved = useCallback(() => {
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
  }, [profileName, profileHeightIn, profileGoalWeightLb]);

  const handleSaveProfile = useCallback(async () => {
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
      const profileNameKey = resolveUserDataStorageKey(
        PROFILE_NAME_STORAGE_KEY,
        activeDevUserIdRef.current,
      );
      const profileBodyKey = resolveUserDataStorageKey(
        PROFILE_BODY_STORAGE_KEY,
        activeDevUserIdRef.current,
      );

      await AsyncStorage.setItem(profileNameKey, cleanName);
      await AsyncStorage.setItem(profileBodyKey, JSON.stringify(body));
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
      onReturnFromSubscreenRef?.current?.();
    } catch (error) {
      console.warn('Failed to save profile', error);
      Alert.alert('Save Failed', 'Could not save your profile this time.');
    }
  }, [
    profileNameDraft,
    profileHeightPickFeet,
    profileHeightPickInches,
    profileGoalDraft,
    onReturnFromSubscreenRef,
  ]);

  const handleSaveGoalsOnly = useCallback(async () => {
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
      const profileBodyKey = resolveUserDataStorageKey(
        PROFILE_BODY_STORAGE_KEY,
        activeDevUserIdRef.current,
      );
      const savedBodyRaw = await AsyncStorage.getItem(profileBodyKey);
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
      await AsyncStorage.setItem(profileBodyKey, JSON.stringify(body));
      setProfileGoalWeightLb(goalVal);
      setProfileGoalDraft(goalVal != null ? String(Math.round(goalVal * 100) / 100) : '');
      Alert.alert('Saved', 'Your goal weight was updated.');
      onReturnFromSubscreenRef?.current?.();
    } catch (error) {
      console.warn('Failed to save goal weight', error);
      Alert.alert('Save failed', 'Could not save your goal this time.');
    }
  }, [profileGoalDraft, profileHeightIn, onReturnFromSubscreenRef]);

  const value = useMemo(
    () => ({
      colors,
      profileName,
      profileNameDraft,
      setProfileNameDraft,
      profileHeightIn,
      profileGoalWeightLb,
      profileHeightPickFeet,
      setProfileHeightPickFeet,
      profileHeightPickInches,
      setProfileHeightPickInches,
      profileHeightEditorOpen,
      setProfileHeightEditorOpen,
      profileGoalDraft,
      setProfileGoalDraft,
      workoutHistory,
      setWorkoutHistory,
      saveHistoryToStorage,
      weightLogs,
      setWeightLogs,
      favoriteMovements,
      weeklySplitPlan,
      exerciseLookup,
      weekStartMondayForTargets,
      weeklyPplCounts,
      weeklySubcategorySetCounts,
      weeklyStreakDays,
      weeklyWorkoutsLoggedCount,
      menuWeekGymProgress,
      scheduledDayAdherence,
      consecutiveTrainingWeekStreak,
      consecutivePerfectWeekStreak,
      strengthScoreSummary,
      lifetimeVolumeLb,
      lastWorkoutSummary,
      lastWorkoutPplBreakdown,
      handleToggleFavoriteMovement,
      handleDeleteWorkout,
      handleChangeWeeklySplitPlan,
      syncProfileDraftFromSaved,
      handleSaveProfile,
      handleSaveGoalsOnly,
      hasLoadedInitialData,
      hasLoadedOnboarding,
      onboardingComplete,
      completeOnboarding,
      saveOnboardingProfile,
      activeDevUserId,
      devUserOptions,
      switchDevUser,
      resetAllUserData,
      addWeightLogEntry,
    }),
    [
      colors,
      profileName,
      profileNameDraft,
      profileHeightIn,
      profileGoalWeightLb,
      profileHeightPickFeet,
      profileHeightPickInches,
      profileHeightEditorOpen,
      profileGoalDraft,
      workoutHistory,
      weightLogs,
      favoriteMovements,
      weeklySplitPlan,
      exerciseLookup,
      weekStartMondayForTargets,
      weeklyPplCounts,
      weeklySubcategorySetCounts,
      weeklyStreakDays,
      weeklyWorkoutsLoggedCount,
      menuWeekGymProgress,
      scheduledDayAdherence,
      consecutiveTrainingWeekStreak,
      consecutivePerfectWeekStreak,
      strengthScoreSummary,
      lifetimeVolumeLb,
      lastWorkoutSummary,
      lastWorkoutPplBreakdown,
      handleToggleFavoriteMovement,
      handleDeleteWorkout,
      handleChangeWeeklySplitPlan,
      syncProfileDraftFromSaved,
      handleSaveProfile,
      handleSaveGoalsOnly,
      hasLoadedInitialData,
      hasLoadedOnboarding,
      onboardingComplete,
      completeOnboarding,
      saveOnboardingProfile,
      activeDevUserId,
      devUserOptions,
      switchDevUser,
      resetAllUserData,
      addWeightLogEntry,
    ],
  );

  return <AppStorageContext.Provider value={value}>{children}</AppStorageContext.Provider>;
}
