import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAVORITE_MOVEMENTS_STORAGE_KEY } from '../constants/storageKeys';

/** @param {string} movementName */
export function movementFavoriteKey(movementName) {
  return String(movementName ?? '').trim().toLowerCase();
}

/** @returns {Promise<Set<string>>} */
export async function loadFavoriteMovements() {
  try {
    const raw = await AsyncStorage.getItem(FAVORITE_MOVEMENTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((name) => movementFavoriteKey(name)).filter(Boolean));
  } catch (error) {
    console.warn('Failed to load favorite movements', error);
    return new Set();
  }
}

/** @param {Set<string>} favorites */
export async function saveFavoriteMovements(favorites) {
  try {
    const list = [...favorites].sort((a, b) => a.localeCompare(b));
    await AsyncStorage.setItem(FAVORITE_MOVEMENTS_STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.warn('Failed to save favorite movements', error);
  }
}

/** @param {Set<string>} favorites @param {string} movementName */
export function toggleFavoriteMovement(favorites, movementName) {
  const key = movementFavoriteKey(movementName);
  const next = new Set(favorites);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

/** @param {Set<string>} favorites @param {string} movementName */
export function isFavoriteMovement(favorites, movementName) {
  return favorites.has(movementFavoriteKey(movementName));
}
