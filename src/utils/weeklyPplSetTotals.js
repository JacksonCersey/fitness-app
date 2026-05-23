import { EXERCISE_DATABASE } from '../../data/exerciseDatabase';
import { WEEKLY_SUBCATEGORY_GROUPS } from '../data/weeklyTargetSubcategories';

/** Weekly set targets for Push / Pull / Legs (PPL) on the Targets tab. */
export const WEEKLY_SET_TARGETS = {
  push: 24,
  pull: 18,
  legs: 21,
};

/** @typedef {{ push: number; pull: number; legs: number }} WeeklyPplCounts */

/**
 * Monday 00:00:00 local time for the week that contains `referenceDate`.
 * @param {Date} referenceDate
 * @returns {Date}
 */
export function getMondayStartOfWeekLocal(referenceDate) {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offsetToMonday, 0, 0, 0, 0);
  return monday;
}

/** Sunday 00:00:00 local — matches home week strip & split planner column order (S … S). */
export function getSundayStartOfWeekLocal(referenceDate) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/**
 * @param {Date} completedAt
 * @param {Date} weekStartMonday
 * @returns {boolean}
 */
function isTimestampInWeek(completedAt, weekStartMonday) {
  const t = completedAt.getTime();
  const start = weekStartMonday.getTime();
  const weekEnd = start + 7 * 24 * 60 * 60 * 1000;
  return t >= start && t < weekEnd;
}

/**
 * @returns {Record<string, Record<string, number>>}
 */
function emptyWeeklySubcategoryCounts() {
  /** @type {Record<string, Record<string, number>>} */
  const out = { push: {}, pull: {}, legs: {} };
  const cats = ['push', 'pull', 'legs'];
  for (let c = 0; c < cats.length; c += 1) {
    const cat = cats[c];
    const subs = WEEKLY_SUBCATEGORY_GROUPS[cat];
    for (let s = 0; s < subs.length; s += 1) {
      out[cat][subs[s].id] = 0;
    }
  }
  return out;
}

/**
 * Sum logged sets this local week by PPL subcategory.
 * @param {unknown[]} workoutHistory
 * @param {Record<string, { weeklyCategory?: string; weeklySubcategory?: string }>} exerciseLookup
 * @param {Date} [referenceDate]
 * @returns {Record<string, Record<string, number>>}
 */
export function aggregateWeeklySetsBySubcategory(workoutHistory, exerciseLookup, referenceDate = new Date()) {
  const counts = emptyWeeklySubcategoryCounts();
  const weekStart = getMondayStartOfWeekLocal(referenceDate);

  if (!Array.isArray(workoutHistory)) return counts;

  for (let w = 0; w < workoutHistory.length; w += 1) {
    const workout = workoutHistory[w];
    if (!workout || typeof workout !== 'object') continue;
    const completedRaw = workout.completedAt;
    if (!completedRaw) continue;
    const completedAt = new Date(completedRaw);
    if (Number.isNaN(completedAt.getTime())) continue;
    if (!isTimestampInWeek(completedAt, weekStart)) continue;

    const setsByMovement = workout.setsByMovement;
    if (!setsByMovement || typeof setsByMovement !== 'object') continue;

    const names = Object.keys(setsByMovement);
    for (let i = 0; i < names.length; i += 1) {
      const movementName = names[i];
      const sets = setsByMovement[movementName];
      if (!Array.isArray(sets) || sets.length === 0) continue;

      const key = String(movementName).trim().toLowerCase();
      const exercise = exerciseLookup[key];
      const cat = exercise?.weeklyCategory;
      if (cat !== 'push' && cat !== 'pull' && cat !== 'legs') continue;
      const sub = exercise?.weeklySubcategory;
      if (!sub || typeof counts[cat][sub] !== 'number') continue;

      counts[cat][sub] += sets.length;
    }
  }

  return counts;
}

/**
 * Count preset exercises per subcategory (drives estimated weekly set split).
 * @returns {Record<string, Record<string, number>>}
 */
function buildExerciseCountBySubcategory() {
  /** @type {Record<string, Record<string, number>>} */
  const counts = { push: {}, pull: {}, legs: {} };
  const cats = ['push', 'pull', 'legs'];
  for (let c = 0; c < cats.length; c += 1) {
    const cat = cats[c];
    WEEKLY_SUBCATEGORY_GROUPS[cat].forEach((sub) => {
      counts[cat][sub.id] = 0;
    });
  }
  EXERCISE_DATABASE.forEach((ex) => {
    const cat = ex.weeklyCategory;
    const sub = ex.weeklySubcategory;
    if (!cat || !sub || counts[cat] == null || typeof counts[cat][sub] !== 'number') return;
    counts[cat][sub] += 1;
  });
  return counts;
}

const EXERCISE_COUNTS_BY_SUB = buildExerciseCountBySubcategory();

/**
 * Split `total` into integers proportional to positive weights (largest remainder / Hamilton).
 * @param {number[]} weights
 * @param {number} total
 * @returns {number[]}
 */
function distributeIntegersByWeights(weights, total) {
  const n = weights.length;
  if (n === 0 || total <= 0) return [];
  const wSum = weights.reduce((a, b) => a + b, 0);
  if (wSum <= 0) {
    const base = Math.floor(total / n);
    let rem = total - base * n;
    return weights.map((_, i) => base + (i < rem ? 1 : 0));
  }
  const raw = weights.map((w) => (total * w) / wSum);
  const floors = raw.map((x) => Math.floor(x));
  let rem = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, frac: x - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (let k = 0; k < rem; k += 1) {
    out[order[k].i] += 1;
  }
  return out;
}

/**
 * @param {'push'|'pull'|'legs'} categoryKey
 * @returns {Record<string, number>}
 */
function computeEstimatedSubcategoryTargetsForCategory(categoryKey) {
  const subs = WEEKLY_SUBCATEGORY_GROUPS[categoryKey];
  const total = WEEKLY_SET_TARGETS[categoryKey];
  const counts = EXERCISE_COUNTS_BY_SUB[categoryKey];
  const weights = subs.map((s) => Math.max(1, counts[s.id] ?? 0));
  const parts = distributeIntegersByWeights(weights, total);
  /** @type {Record<string, number>} */
  const out = {};
  subs.forEach((s, i) => {
    out[s.id] = parts[i] ?? 0;
  });
  return out;
}

/**
 * Estimated weekly set targets per subcategory (sums to each PPL weekly goal).
 * Based on how many exercises in the database fall under each subcategory.
 */
export const ESTIMATED_WEEKLY_SUBTARGETS = {
  push: computeEstimatedSubcategoryTargetsForCategory('push'),
  pull: computeEstimatedSubcategoryTargetsForCategory('pull'),
  legs: computeEstimatedSubcategoryTargetsForCategory('legs'),
};

/**
 * Sum logged sets this local week by PPL category. Only exercises with `weeklyCategory` in the lookup count.
 * @param {unknown[]} workoutHistory
 * @param {Record<string, { weeklyCategory?: string }>} exerciseLookup lowercased movement name → exercise
 * @param {Date} [referenceDate]
 * @returns {WeeklyPplCounts}
 */
export function aggregateWeeklySetsByPpl(workoutHistory, exerciseLookup, referenceDate = new Date()) {
  /** @type {WeeklyPplCounts} */
  const counts = { push: 0, pull: 0, legs: 0 };
  const weekStart = getMondayStartOfWeekLocal(referenceDate);

  if (!Array.isArray(workoutHistory)) return counts;

  for (let w = 0; w < workoutHistory.length; w += 1) {
    const workout = workoutHistory[w];
    if (!workout || typeof workout !== 'object') continue;
    const completedRaw = workout.completedAt;
    if (!completedRaw) continue;
    const completedAt = new Date(completedRaw);
    if (Number.isNaN(completedAt.getTime())) continue;
    if (!isTimestampInWeek(completedAt, weekStart)) continue;

    const setsByMovement = workout.setsByMovement;
    if (!setsByMovement || typeof setsByMovement !== 'object') continue;

    const names = Object.keys(setsByMovement);
    for (let i = 0; i < names.length; i += 1) {
      const movementName = names[i];
      const sets = setsByMovement[movementName];
      if (!Array.isArray(sets) || sets.length === 0) continue;

      const key = String(movementName).trim().toLowerCase();
      const exercise = exerciseLookup[key];
      const cat = exercise?.weeklyCategory;
      if (cat !== 'push' && cat !== 'pull' && cat !== 'legs') continue;

      counts[cat] += sets.length;
    }
  }

  return counts;
}

/**
 * Sets and distinct movement names per PPL group for one workout.
 * @param {unknown} workout
 * @param {Record<string, { weeklyCategory?: string }>} exerciseLookup
 * @returns {{ sets: WeeklyPplCounts; movements: WeeklyPplCounts }}
 */
export function aggregateSingleWorkoutPplBreakdown(workout, exerciseLookup) {
  /** @type {WeeklyPplCounts} */
  const sets = { push: 0, pull: 0, legs: 0 };
  /** @type {Record<'push'|'pull'|'legs', Set<string>>} */
  const namesBy = {
    push: new Set(),
    pull: new Set(),
    legs: new Set(),
  };

  if (!workout || typeof workout !== 'object') {
    return { sets, movements: { push: 0, pull: 0, legs: 0 } };
  }
  const setsByMovement = workout.setsByMovement;
  if (!setsByMovement || typeof setsByMovement !== 'object') {
    return { sets, movements: { push: 0, pull: 0, legs: 0 } };
  }

  const names = Object.keys(setsByMovement);
  for (let i = 0; i < names.length; i += 1) {
    const movementName = names[i];
    const arr = setsByMovement[movementName];
    if (!Array.isArray(arr) || arr.length === 0) continue;

    const key = String(movementName).trim().toLowerCase();
    const exercise = exerciseLookup[key];
    const cat = exercise?.weeklyCategory;
    if (cat !== 'push' && cat !== 'pull' && cat !== 'legs') continue;

    sets[cat] += arr.length;
    namesBy[cat].add(String(movementName).trim());
  }

  return {
    sets,
    movements: {
      push: namesBy.push.size,
      pull: namesBy.pull.size,
      legs: namesBy.legs.size,
    },
  };
}

/**
 * PPL set counts for the in-progress workout only (preset exercises with weeklyCategory count).
 * @param {Record<string, unknown[]>} setsByMovement
 * @param {Record<string, { weeklyCategory?: string }>} exerciseLookup
 * @returns {WeeklyPplCounts}
 */
export function countActiveWorkoutSetsByPpl(setsByMovement, exerciseLookup) {
  /** @type {WeeklyPplCounts} */
  const counts = { push: 0, pull: 0, legs: 0 };
  if (!setsByMovement || typeof setsByMovement !== 'object') return counts;
  const names = Object.keys(setsByMovement);
  for (let i = 0; i < names.length; i += 1) {
    const movementName = names[i];
    const sets = setsByMovement[movementName];
    if (!Array.isArray(sets) || sets.length === 0) continue;
    const key = String(movementName).trim().toLowerCase();
    const exercise = exerciseLookup[key];
    const cat = exercise?.weeklyCategory;
    if (cat !== 'push' && cat !== 'pull' && cat !== 'legs') continue;
    counts[cat] += sets.length;
  }
  return counts;
}

/**
 * Weekly subcategory totals from history plus sets logged so far this session.
 * @param {Record<string, Record<string, number>>} baseCounts from aggregateWeeklySetsBySubcategory
 */
export function addSessionToSubcategoryCounts(baseCounts, setsByMovement, exerciseLookup) {
  /** @type {Record<string, Record<string, number>>} */
  const out = { push: {}, pull: {}, legs: {} };
  const cats = /** @type {const} */ (['push', 'pull', 'legs']);
  for (let c = 0; c < cats.length; c += 1) {
    const cat = cats[c];
    const subs = WEEKLY_SUBCATEGORY_GROUPS[cat];
    for (let s = 0; s < subs.length; s += 1) {
      const id = subs[s].id;
      out[cat][id] = baseCounts[cat]?.[id] ?? 0;
    }
  }
  if (!setsByMovement || typeof setsByMovement !== 'object') return out;
  const names = Object.keys(setsByMovement);
  for (let i = 0; i < names.length; i += 1) {
    const movementName = names[i];
    const sets = setsByMovement[movementName];
    if (!Array.isArray(sets) || sets.length === 0) continue;
    const key = String(movementName).trim().toLowerCase();
    const exercise = exerciseLookup[key];
    const cat = exercise?.weeklyCategory;
    const sub = exercise?.weeklySubcategory;
    if (!cat || !sub || typeof out[cat][sub] !== 'number') continue;
    out[cat][sub] += sets.length;
  }
  return out;
}

/**
 * @param {WeeklyPplCounts} weeklyFromHistory
 * @param {WeeklyPplCounts} sessionOnly
 * @returns {WeeklyPplCounts}
 */
export function mergeWeeklyPplWithSession(weeklyFromHistory, sessionOnly) {
  return {
    push: (weeklyFromHistory.push ?? 0) + (sessionOnly.push ?? 0),
    pull: (weeklyFromHistory.pull ?? 0) + (sessionOnly.pull ?? 0),
    legs: (weeklyFromHistory.legs ?? 0) + (sessionOnly.legs ?? 0),
  };
}
