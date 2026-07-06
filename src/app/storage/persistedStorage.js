import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FAVORITE_MOVEMENTS_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  ONBOARDING_COMPLETED_STORAGE_KEY,
  PROFILE_BODY_STORAGE_KEY,
  PROFILE_NAME_STORAGE_KEY,
  STRENGTH_SCORE_DISPLAYED_KEY,
  THEME_STORAGE_KEY,
  WEIGHT_LOGS_STORAGE_KEY,
  WEEKLY_SPLIT_PLAN_STORAGE_KEY,
} from '../../constants/storageKeys';

/** Flip to true to wipe saved data once on the next app launch (for testing / fresh start). */
export const WIPE_USER_DATA_ON_NEXT_LAUNCH = true;

const WIPE_ALREADY_RAN_KEY = '__scheduled_user_data_wipe_done_v2';

export const ALL_USER_DATA_STORAGE_KEYS = [
  ONBOARDING_COMPLETED_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  THEME_STORAGE_KEY,
  PROFILE_NAME_STORAGE_KEY,
  PROFILE_BODY_STORAGE_KEY,
  WEIGHT_LOGS_STORAGE_KEY,
  WEEKLY_SPLIT_PLAN_STORAGE_KEY,
  STRENGTH_SCORE_DISPLAYED_KEY,
  FAVORITE_MOVEMENTS_STORAGE_KEY,
];

export async function clearAllUserData() {
  await AsyncStorage.multiRemove([...ALL_USER_DATA_STORAGE_KEYS, WIPE_ALREADY_RAN_KEY]);
}

/** Runs a one-time wipe when `WIPE_USER_DATA_ON_NEXT_LAUNCH` is true. */
export async function runScheduledUserDataWipeIfNeeded() {
  if (!WIPE_USER_DATA_ON_NEXT_LAUNCH) return false;
  try {
    const alreadyRan = await AsyncStorage.getItem(WIPE_ALREADY_RAN_KEY);
    if (alreadyRan === 'true') return false;
    await clearAllUserData();
    await AsyncStorage.setItem(WIPE_ALREADY_RAN_KEY, 'true');
    if (__DEV__) {
      console.log('Scheduled user data wipe completed.');
    }
    return true;
  } catch (error) {
    console.warn('Scheduled user data wipe failed', error);
    return false;
  }
}

export async function saveHistoryToStorage(historyArray) {
  if (__DEV__) {
    console.log('Saving history to AsyncStorage...');
  }
  await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyArray));
  if (__DEV__) {
    console.log(`Saved ${historyArray.length} workouts to AsyncStorage`);
  }
}

export async function loadHistoryFromStorage() {
  if (__DEV__) {
    console.log('Loading history from AsyncStorage...');
  }
  const savedHistoryJson = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
  if (!savedHistoryJson) return [];

  const parsedHistory = JSON.parse(savedHistoryJson);
  if (!Array.isArray(parsedHistory)) return [];
  return parsedHistory;
}

export async function saveWeightLogsToStorage(logsArray) {
  await AsyncStorage.setItem(WEIGHT_LOGS_STORAGE_KEY, JSON.stringify(logsArray));
}

export async function loadWeightLogsFromStorage() {
  const raw = await AsyncStorage.getItem(WEIGHT_LOGS_STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item) => item && typeof item === 'object');
}
