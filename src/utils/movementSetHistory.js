import { isBodyweightOnlyExercise } from './formatWorkout';

/**
 * @typedef {Object} MovementSetRecord
 * @property {string} movement
 * @property {number} reps
 * @property {number} weightLb
 * @property {string} completedAtISO
 * @property {number} sortKey
 */

/**
 * @typedef {Object} MovementHistorySummary
 * @property {string} movement
 * @property {number} maxWeightLb
 * @property {number} maxReps
 * @property {MovementSetRecord[]} recentSets
 */

/**
 * @typedef {{ weight: number; reps: number }} LastMovementSetSnapshot
 */

/**
 * Most recent logged set for an exercise name (this workout first, then saved history).
 * @param {string} exerciseName
 * @param {Record<string, unknown[]>} setsByMovement slot id → sets in active workout
 * @param {{ id: string; name: string }[]} workoutMovementOrder
 * @param {unknown[]} workoutHistory
 * @returns {LastMovementSetSnapshot | null}
 */
export function getMostRecentSetForMovementName(
  exerciseName,
  setsByMovement,
  workoutMovementOrder,
  workoutHistory,
) {
  const key = String(exerciseName || '').trim().toLowerCase();
  if (!key) return null;

  let sessionSortKey = -1;
  /** @type {LastMovementSetSnapshot | null} */
  let fromSession = null;

  if (Array.isArray(workoutMovementOrder)) {
    for (let i = 0; i < workoutMovementOrder.length; i += 1) {
      const slot = workoutMovementOrder[i];
      if (!slot?.name || slot.name.trim().toLowerCase() !== key) continue;
      const sets = setsByMovement?.[slot.id];
      if (!Array.isArray(sets) || sets.length === 0) continue;
      const lastSet = sets[sets.length - 1];
      const reps = Number.parseInt(String(lastSet?.reps), 10) || 0;
      if (reps <= 0) continue;
      const sortKey = Number(lastSet.elapsedSeconds) || 0;
      if (sortKey >= sessionSortKey) {
        sessionSortKey = sortKey;
        fromSession = {
          weight: Number(lastSet.weight) || 0,
          reps,
        };
      }
    }
  }

  if (fromSession) return fromSession;

  if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) return null;

  const workoutsNewestFirst = [...workoutHistory]
    .filter((w) => w?.completedAt && w.setsByMovement && typeof w.setsByMovement === 'object')
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  for (let w = 0; w < workoutsNewestFirst.length; w += 1) {
    const workout = workoutsNewestFirst[w];
    const map = workout.setsByMovement;
    const movementNames = Object.keys(map);
    for (let m = 0; m < movementNames.length; m += 1) {
      const movement = movementNames[m];
      if (movement.trim().toLowerCase() !== key) continue;
      const sets = map[movement];
      if (!Array.isArray(sets) || sets.length === 0) continue;
      const lastSet = sets[sets.length - 1];
      const reps = Number.parseInt(String(lastSet?.reps), 10) || 0;
      if (reps <= 0) continue;
      return {
        weight: Number(lastSet.weight) || 0,
        reps,
      };
    }
  }

  return null;
}

/** String for the workout log weight field (whole numbers without ".0"). */
export function formatWeightForNotepadInput(weight) {
  const wNum = Number(weight);
  if (!Number.isFinite(wNum) || Number.isNaN(wNum)) return '';
  if (Math.abs(wNum - Math.round(wNum)) < 1e-6) return String(Math.round(wNum));
  return String(wNum);
}

/**
 * Flatten all sets from workout history, newest first per movement.
 * @param {unknown[]} workoutHistory
 * @returns {MovementHistorySummary[]}
 */
export function buildMovementHistorySummaries(workoutHistory) {
  if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) return [];

  /** @type {Map<string, { movement: string, allSets: MovementSetRecord[] }>} */
  const byKey = new Map();

  const workoutsNewestFirst = [...workoutHistory]
    .filter((w) => w?.completedAt && w.setsByMovement && typeof w.setsByMovement === 'object')
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  for (let w = 0; w < workoutsNewestFirst.length; w += 1) {
    const workout = workoutsNewestFirst[w];
    const completedAtISO = workout.completedAt;
    const baseTime = new Date(completedAtISO).getTime();
    if (Number.isNaN(baseTime)) continue;

    const map = workout.setsByMovement;
    const movementNames = Object.keys(map);
    for (let m = 0; m < movementNames.length; m += 1) {
      const movement = movementNames[m];
      const sets = map[movement];
      if (!Array.isArray(sets) || sets.length === 0) continue;

      const key = movement.trim().toLowerCase();
      if (!byKey.has(key)) {
        byKey.set(key, { movement, allSets: [] });
      }
      const bucket = byKey.get(key);

      for (let s = 0; s < sets.length; s += 1) {
        const setItem = sets[s];
        const reps = Number(setItem?.reps) || 0;
        if (reps <= 0) continue;
        const weightLb = Number(setItem?.weight) || 0;
        bucket.allSets.push({
          movement,
          reps,
          weightLb,
          completedAtISO,
          sortKey: baseTime + s,
        });
      }
    }
  }

  const summaries = [];
  byKey.forEach((bucket) => {
    const sorted = [...bucket.allSets].sort((a, b) => b.sortKey - a.sortKey);
    let maxWeightLb = 0;
    let maxReps = 0;
    for (let i = 0; i < sorted.length; i += 1) {
      if (sorted[i].weightLb > maxWeightLb) maxWeightLb = sorted[i].weightLb;
      if (sorted[i].reps > maxReps) maxReps = sorted[i].reps;
    }
    summaries.push({
      movement: bucket.movement,
      maxWeightLb,
      maxReps,
      recentSets: sorted.slice(0, 3),
    });
  });

  summaries.sort((a, b) => a.movement.localeCompare(b.movement));
  return summaries;
}

/**
 * @typedef {Object} RecentCompletedMovement
 * @property {string} movement
 * @property {string} lastCompletedAtISO
 * @property {number} lastSortKey
 */

/**
 * Movements ordered by when they were last performed (newest workout first), up to `limit`.
 * @param {unknown[]} workoutHistory
 * @param {number} [limit]
 * @returns {RecentCompletedMovement[]}
 */
export function getMostRecentCompletedMovements(workoutHistory, limit = 15) {
  if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) return [];

  /** @type {Map<string, RecentCompletedMovement>} */
  const byKey = new Map();

  const workoutsNewestFirst = [...workoutHistory]
    .filter((w) => w?.completedAt && w.setsByMovement && typeof w.setsByMovement === 'object')
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  for (let w = 0; w < workoutsNewestFirst.length; w += 1) {
    const workout = workoutsNewestFirst[w];
    const completedAtISO = workout.completedAt;
    const baseTime = new Date(completedAtISO).getTime();
    if (Number.isNaN(baseTime)) continue;

    const map = workout.setsByMovement;
    const movementNames = Object.keys(map);
    for (let m = 0; m < movementNames.length; m += 1) {
      const movement = movementNames[m];
      const sets = map[movement];
      if (!Array.isArray(sets) || sets.length === 0) continue;
      const hasWorkingSet = sets.some((setItem) => (Number(setItem?.reps) || 0) > 0);
      if (!hasWorkingSet) continue;

      const key = movement.trim().toLowerCase();
      if (byKey.has(key)) continue;

      byKey.set(key, {
        movement,
        lastCompletedAtISO: completedAtISO,
        lastSortKey: baseTime,
      });
    }
  }

  return [...byKey.values()]
    .sort((a, b) => b.lastSortKey - a.lastSortKey)
    .slice(0, limit);
}

/**
 * @param {MovementHistorySummary} row
 * @param {Record<string, { bodyweightOnly?: boolean }>} exerciseLookup
 * @returns {string}
 */
export function formatMovementMaxLabel(row, exerciseLookup) {
  const display = getMovementMaxDisplay(row, exerciseLookup);
  if (display.suffix === 'reps') {
    return `Max: ${display.primary} ${display.suffix}`;
  }
  if (display.primary.startsWith('+')) {
    return `Max: ${display.primary} ${display.suffix}`;
  }
  return `Max: ${display.primary} ${display.suffix}`;
}

/**
 * Big-number display for the max subbox.
 * @param {MovementHistorySummary} row
 * @param {Record<string, { bodyweightOnly?: boolean }>} exerciseLookup
 * @returns {{ label: string, primary: string, suffix: string }}
 */
export function getMovementMaxDisplay(row, exerciseLookup) {
  const bw = isBodyweightOnlyExercise(row.movement, exerciseLookup);
  if (bw && row.maxWeightLb <= 0) {
    return { label: 'Max', primary: String(row.maxReps), suffix: 'reps' };
  }
  const w = Math.round(row.maxWeightLb * 10) / 10;
  if (bw && row.maxWeightLb > 0) {
    return { label: 'Max', primary: `+${w}`, suffix: 'lb' };
  }
  return { label: 'Max', primary: String(w), suffix: 'lb' };
}

/**
 * All past sets for one exercise from saved workouts, newest first.
 * @param {string} exerciseName
 * @param {unknown[]} workoutHistory
 * @param {number} [limit]
 * @returns {MovementSetRecord[]}
 */
export function getPastSetsForMovementName(exerciseName, workoutHistory, limit = 40) {
  const key = String(exerciseName || '').trim().toLowerCase();
  if (!key || !Array.isArray(workoutHistory) || workoutHistory.length === 0) return [];

  /** @type {MovementSetRecord[]} */
  const all = [];

  const workoutsNewestFirst = [...workoutHistory]
    .filter((w) => w?.completedAt && w.setsByMovement && typeof w.setsByMovement === 'object')
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  for (let w = 0; w < workoutsNewestFirst.length; w += 1) {
    const workout = workoutsNewestFirst[w];
    const completedAtISO = workout.completedAt;
    const baseTime = new Date(completedAtISO).getTime();
    if (Number.isNaN(baseTime)) continue;

    const map = workout.setsByMovement;
    const movementNames = Object.keys(map);
    for (let m = 0; m < movementNames.length; m += 1) {
      const movement = movementNames[m];
      if (movement.trim().toLowerCase() !== key) continue;
      const sets = map[movement];
      if (!Array.isArray(sets)) continue;
      for (let s = 0; s < sets.length; s += 1) {
        const setItem = sets[s];
        const reps = Number(setItem?.reps) || 0;
        if (reps <= 0) continue;
        all.push({
          movement,
          reps,
          weightLb: Number(setItem?.weight) || 0,
          completedAtISO,
          sortKey: baseTime + s,
        });
      }
    }
  }

  return all.sort((a, b) => b.sortKey - a.sortKey).slice(0, limit);
}

export function formatRecentSetLine(setRecord, movementName, exerciseLookup) {
  const bw = isBodyweightOnlyExercise(movementName, exerciseLookup);
  const reps = setRecord.reps;
  const w = setRecord.weightLb;
  const d = new Date(setRecord.completedAtISO);
  const dateLabel = Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });

  let loadPart;
  if (bw && w <= 0) {
    loadPart = `${reps} reps · body weight`;
  } else if (bw && w > 0) {
    loadPart = `${reps} reps @ +${w} lb`;
  } else {
    loadPart = `${reps} reps @ ${w} lb`;
  }

  return dateLabel ? `${loadPart} · ${dateLabel}` : loadPart;
}

/**
 * Average weight (lb) for each recent workout that includes a completed set of this movement.
 * Returned oldest → newest so sparklines read left-to-right over time.
 * @param {string} movementName
 * @param {unknown[]} workoutHistory
 * @param {number} [limit]
 * @returns {number[]}
 */
export function getRecentWorkoutAverageWeightsForMovement(movementName, workoutHistory, limit = 8) {
  const key = String(movementName || '').trim().toLowerCase();
  if (!key || !Array.isArray(workoutHistory) || workoutHistory.length === 0) return [];

  const workoutsNewestFirst = [...workoutHistory]
    .filter((w) => w?.completedAt && w.setsByMovement && typeof w.setsByMovement === 'object')
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  /** @type {number[]} */
  const averagesNewestFirst = [];

  for (let w = 0; w < workoutsNewestFirst.length; w += 1) {
    if (averagesNewestFirst.length >= limit) break;
    const workout = workoutsNewestFirst[w];
    const map = workout.setsByMovement;
    const movementNames = Object.keys(map);

    /** @type {number[]} */
    const weights = [];
    for (let m = 0; m < movementNames.length; m += 1) {
      const movement = movementNames[m];
      if (movement.trim().toLowerCase() !== key) continue;
      const sets = map[movement];
      if (!Array.isArray(sets)) continue;
      for (let s = 0; s < sets.length; s += 1) {
        const reps = Number(sets[s]?.reps) || 0;
        if (reps <= 0) continue;
        weights.push(Number(sets[s]?.weight) || 0);
      }
    }

    if (weights.length === 0) continue;
    const sum = weights.reduce((acc, value) => acc + value, 0);
    averagesNewestFirst.push(Math.round((sum / weights.length) * 10) / 10);
  }

  return averagesNewestFirst.reverse();
}
