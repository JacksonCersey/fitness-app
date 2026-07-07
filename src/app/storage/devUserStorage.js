import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEV_ACTIVE_USER_STORAGE_KEY,
  FAVORITE_MOVEMENTS_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  ONBOARDING_COMPLETED_STORAGE_KEY,
  PROFILE_BODY_STORAGE_KEY,
  PROFILE_NAME_STORAGE_KEY,
  STRENGTH_SCORE_DISPLAYED_KEY,
  WEIGHT_LOGS_STORAGE_KEY,
  WEEKLY_SPLIT_PLAN_STORAGE_KEY,
} from '../../constants/storageKeys';
import { getDevUserFixture } from '../../data/devFixtures/devUsers';
import { getDefaultWeeklySplitPlan, normalizeWeeklySplitPlan } from '../../data/weeklySplitPlanner';
import { movementFavoriteKey } from '../../utils/movementFavorites';
import { resolveUserDataStorageKey } from './storageNamespace';
import { loadHistoryFromStorage, loadWeightLogsFromStorage } from './persistedStorage';

/**
 * @typedef {{
 *   profileName: string;
 *   profileHeightIn: number | null;
 *   profileGoalWeightLb: number | null;
 *   workoutHistory: unknown[];
 *   weightLogs: unknown[];
 *   weeklySplitPlan: ReturnType<typeof getDefaultWeeklySplitPlan>;
 *   favoriteMovements: string[];
 *   onboardingComplete: boolean;
 *   strengthScoreDisplayed: number | null;
 * }} DevUserSnapshot
 */

const USER_DATA_KEYS = [
  ONBOARDING_COMPLETED_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  PROFILE_NAME_STORAGE_KEY,
  PROFILE_BODY_STORAGE_KEY,
  WEIGHT_LOGS_STORAGE_KEY,
  WEEKLY_SPLIT_PLAN_STORAGE_KEY,
  STRENGTH_SCORE_DISPLAYED_KEY,
  FAVORITE_MOVEMENTS_STORAGE_KEY,
];

/**
 * @param {string | null | undefined} devUserId
 */
export async function loadActiveDevUserId() {
  if (!__DEV__) return null;
  try {
    const saved = await AsyncStorage.getItem(DEV_ACTIVE_USER_STORAGE_KEY);
    if (!saved) return null;
    return saved;
  } catch (error) {
    console.warn('Failed to load active dev user', error);
    return null;
  }
}

/**
 * @param {string | null} devUserId
 */
export async function saveActiveDevUserId(devUserId) {
  if (!__DEV__) return;
  try {
    if (devUserId == null || devUserId === '') {
      await AsyncStorage.removeItem(DEV_ACTIVE_USER_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(DEV_ACTIVE_USER_STORAGE_KEY, devUserId);
  } catch (error) {
    console.warn('Failed to save active dev user', error);
  }
}

/**
 * @param {string | null | undefined} devUserId
 * @returns {Promise<boolean>}
 */
export async function devUserSnapshotExists(devUserId) {
  if (!__DEV__ || !devUserId) return false;
  try {
    const raw = await AsyncStorage.getItem(resolveUserDataStorageKey(HISTORY_STORAGE_KEY, devUserId));
    return raw != null;
  } catch {
    return false;
  }
}

/**
 * @param {string | null | undefined} devUserId
 * @returns {Promise<DevUserSnapshot>}
 */
export async function loadUserDataSnapshot(devUserId) {
  const profileNameKey = resolveUserDataStorageKey(PROFILE_NAME_STORAGE_KEY, devUserId);
  const profileBodyKey = resolveUserDataStorageKey(PROFILE_BODY_STORAGE_KEY, devUserId);
  const splitKey = resolveUserDataStorageKey(WEEKLY_SPLIT_PLAN_STORAGE_KEY, devUserId);
  const onboardingKey = resolveUserDataStorageKey(ONBOARDING_COMPLETED_STORAGE_KEY, devUserId);
  const strengthKey = resolveUserDataStorageKey(STRENGTH_SCORE_DISPLAYED_KEY, devUserId);
  const favoritesKey = resolveUserDataStorageKey(FAVORITE_MOVEMENTS_STORAGE_KEY, devUserId);

  const [
    workoutHistory,
    weightLogs,
    profileNameRaw,
    profileBodyRaw,
    splitRaw,
    onboardingRaw,
    strengthRaw,
    favoritesRaw,
  ] = await Promise.all([
    loadHistoryFromStorage(devUserId),
    loadWeightLogsFromStorage(devUserId),
    AsyncStorage.getItem(profileNameKey),
    AsyncStorage.getItem(profileBodyKey),
    AsyncStorage.getItem(splitKey),
    AsyncStorage.getItem(onboardingKey),
    AsyncStorage.getItem(strengthKey),
    AsyncStorage.getItem(favoritesKey),
  ]);

  let profileHeightIn = null;
  let profileGoalWeightLb = null;
  if (profileBodyRaw) {
    try {
      const body = JSON.parse(profileBodyRaw);
      const hin = typeof body.heightIn === 'number' ? body.heightIn : null;
      const glb = typeof body.goalWeightLb === 'number' ? body.goalWeightLb : null;
      profileHeightIn = hin !== null && !Number.isNaN(hin) && hin > 0 ? hin : null;
      profileGoalWeightLb = glb !== null && !Number.isNaN(glb) && glb > 0 ? glb : null;
    } catch {
      // ignore malformed body
    }
  }

  let weeklySplitPlan = getDefaultWeeklySplitPlan();
  if (splitRaw) {
    try {
      weeklySplitPlan = normalizeWeeklySplitPlan(JSON.parse(splitRaw));
    } catch {
      // ignore malformed split
    }
  }

  let favoriteMovements = [];
  if (favoritesRaw) {
    try {
      const parsed = JSON.parse(favoritesRaw);
      if (Array.isArray(parsed)) {
        favoriteMovements = parsed.map((name) => movementFavoriteKey(name)).filter(Boolean);
      }
    } catch {
      // ignore malformed favorites
    }
  }

  let strengthScoreDisplayed = null;
  if (strengthRaw != null) {
    const n = Number.parseFloat(strengthRaw);
    if (Number.isFinite(n) && n >= 0) strengthScoreDisplayed = n;
  }

  return {
    profileName: profileNameRaw ?? '',
    profileHeightIn,
    profileGoalWeightLb,
    workoutHistory,
    weightLogs,
    weeklySplitPlan,
    favoriteMovements,
    onboardingComplete: onboardingRaw === 'true',
    strengthScoreDisplayed,
  };
}

/**
 * @param {string | null | undefined} devUserId
 * @param {DevUserSnapshot} snapshot
 */
export async function saveUserDataSnapshot(devUserId, snapshot) {
  const profileNameKey = resolveUserDataStorageKey(PROFILE_NAME_STORAGE_KEY, devUserId);
  const profileBodyKey = resolveUserDataStorageKey(PROFILE_BODY_STORAGE_KEY, devUserId);
  const splitKey = resolveUserDataStorageKey(WEEKLY_SPLIT_PLAN_STORAGE_KEY, devUserId);
  const onboardingKey = resolveUserDataStorageKey(ONBOARDING_COMPLETED_STORAGE_KEY, devUserId);
  const strengthKey = resolveUserDataStorageKey(STRENGTH_SCORE_DISPLAYED_KEY, devUserId);
  const favoritesKey = resolveUserDataStorageKey(FAVORITE_MOVEMENTS_STORAGE_KEY, devUserId);

  const body = {
    heightIn: snapshot.profileHeightIn,
    weightLb: null,
    goalWeightLb: snapshot.profileGoalWeightLb,
  };

  const writes = [
    AsyncStorage.setItem(profileNameKey, snapshot.profileName ?? ''),
    AsyncStorage.setItem(profileBodyKey, JSON.stringify(body)),
    AsyncStorage.setItem(splitKey, JSON.stringify(snapshot.weeklySplitPlan)),
    AsyncStorage.setItem(
      onboardingKey,
      snapshot.onboardingComplete ? 'true' : 'false',
    ),
    AsyncStorage.setItem(
      favoritesKey,
      JSON.stringify([...(snapshot.favoriteMovements ?? [])].sort((a, b) => a.localeCompare(b))),
    ),
  ];

  if (snapshot.strengthScoreDisplayed != null) {
    writes.push(AsyncStorage.setItem(strengthKey, String(snapshot.strengthScoreDisplayed)));
  } else {
    writes.push(AsyncStorage.removeItem(strengthKey));
  }

  await Promise.all(writes);
}

/**
 * Wipes stored data for a dev persona and writes the default fixture.
 * @param {string} devUserId
 * @returns {Promise<DevUserSnapshot>}
 */
export async function resetAndSeedDevUserSnapshot(devUserId) {
  const fixture = getDevUserFixture(devUserId);
  if (!fixture) {
    throw new Error(`Unknown dev user: ${devUserId}`);
  }
  await clearUserDataSnapshot(devUserId);
  await saveUserDataSnapshot(devUserId, fixture);
  const { saveHistoryToStorage, saveWeightLogsToStorage } = await import('./persistedStorage');
  await saveHistoryToStorage(fixture.workoutHistory, devUserId);
  await saveWeightLogsToStorage(fixture.weightLogs, devUserId);
  return fixture;
}

/**
 * @param {string} devUserId
 * @returns {Promise<DevUserSnapshot>}
 */
export async function loadOrSeedDevUserSnapshot(devUserId) {
  return resetAndSeedDevUserSnapshot(devUserId);
}

/**
 * @param {string | null | undefined} devUserId
 */
export async function clearUserDataSnapshot(devUserId) {
  const keys = USER_DATA_KEYS.map((baseKey) => resolveUserDataStorageKey(baseKey, devUserId));
  await AsyncStorage.multiRemove(keys);
}
