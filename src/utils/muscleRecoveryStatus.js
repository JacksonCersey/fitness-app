import { exerciseMuscleMap, getMuscleActivations, MUSCLE_GROUPS } from '../../data/exerciseMuscleMap';
import { DISPLAY_LABEL_TO_SLUGS } from '../../data/workoutMuscleHeat';

const SYNTH_PRIMARY = 0.62;
const SYNTH_SECONDARY = 0.38;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_48H = 2 * MS_PER_DAY;
const MS_7D = 7 * MS_PER_DAY;

/** Minimum per-set stress to count as “worked” for last-hit tracking. */
const MIN_SET_STRESS = 0.25;

/**
 * @typedef {'rested' | 'moderate' | 'fatigued'} MuscleRecoveryStatus
 */

/**
 * @param {Record<string, unknown[]> | null | undefined} setsByMovement
 * @param {Record<string, { primaryMuscles?: string[]; secondaryMuscles?: string[] }>} exerciseLookup
 * @returns {Record<string, number>}
 */
function rawStressBySlugFromSets(setsByMovement, exerciseLookup) {
  /** @type {Record<string, number>} */
  const accumulated = {};
  MUSCLE_GROUPS.forEach((g) => {
    accumulated[g] = 0;
  });

  if (!setsByMovement || typeof setsByMovement !== 'object') return accumulated;

  Object.entries(setsByMovement).forEach(([name, setsArr]) => {
    const n = Array.isArray(setsArr) ? setsArr.length : 0;
    if (n <= 0) return;

    const detailed = exerciseMuscleMap[name];
    if (detailed) {
      const full = getMuscleActivations(name);
      MUSCLE_GROUPS.forEach((g) => {
        accumulated[g] += (full[g] ?? 0) * n;
      });
      return;
    }

    const db = exerciseLookup[name.toLowerCase()];
    if (!db) return;

    /** @type {Record<string, number>} */
    const slugBump = {};
    MUSCLE_GROUPS.forEach((g) => {
      slugBump[g] = 0;
    });
    (db.primaryMuscles ?? []).forEach((label) => {
      const slugs = DISPLAY_LABEL_TO_SLUGS[label];
      if (!slugs) return;
      slugs.forEach((s) => {
        slugBump[s] = Math.max(slugBump[s], SYNTH_PRIMARY);
      });
    });
    (db.secondaryMuscles ?? []).forEach((label) => {
      const slugs = DISPLAY_LABEL_TO_SLUGS[label];
      if (!slugs) return;
      slugs.forEach((s) => {
        slugBump[s] = Math.max(slugBump[s], SYNTH_SECONDARY);
      });
    });
    MUSCLE_GROUPS.forEach((g) => {
      accumulated[g] += slugBump[g] * n;
    });
  });

  return accumulated;
}

/**
 * Recovery status per muscle slug from logged workout history.
 * - rested (green): ready for a full workout
 * - moderate (gray): OK for moderate volume
 * - fatigued (red): needs more recovery
 *
 * @param {unknown[]} workoutHistory
 * @param {Record<string, { primaryMuscles?: string[]; secondaryMuscles?: string[] }>} exerciseLookup
 * @param {Date} [referenceDate]
 * @returns {Record<string, MuscleRecoveryStatus>}
 */
export function computeMuscleRecoveryStatusBySlug(workoutHistory, exerciseLookup, referenceDate = new Date()) {
  const now = referenceDate.getTime();

  /** @type {Record<string, number | null>} */
  const lastWorkedMs = {};
  /** @type {Record<string, number>} */
  const stress48h = {};
  /** @type {Record<string, number>} */
  const stress7d = {};

  MUSCLE_GROUPS.forEach((g) => {
    lastWorkedMs[g] = null;
    stress48h[g] = 0;
    stress7d[g] = 0;
  });

  if (Array.isArray(workoutHistory)) {
    for (let w = 0; w < workoutHistory.length; w += 1) {
      const workout = workoutHistory[w];
      if (!workout || typeof workout !== 'object') continue;
      const completedRaw = workout.completedAt;
      if (!completedRaw) continue;
      const completedAt = new Date(completedRaw);
      const t = completedAt.getTime();
      if (Number.isNaN(t)) continue;

      const ageMs = now - t;
      if (ageMs < 0 || ageMs > MS_7D) continue;

      const stress = rawStressBySlugFromSets(workout.setsByMovement, exerciseLookup);
      MUSCLE_GROUPS.forEach((g) => {
        const s = stress[g] ?? 0;
        if (s < MIN_SET_STRESS) return;
        if (ageMs <= MS_48H) stress48h[g] += s;
        stress7d[g] += s;
        if (lastWorkedMs[g] === null || t > lastWorkedMs[g]) {
          lastWorkedMs[g] = t;
        }
      });
    }
  }

  /** @type {Record<string, MuscleRecoveryStatus>} */
  const out = {};
  MUSCLE_GROUPS.forEach((g) => {
    const last = lastWorkedMs[g];
    const daysSince = last === null ? null : (now - last) / MS_PER_DAY;
    const s48 = stress48h[g] ?? 0;
    const s7 = stress7d[g] ?? 0;

    if (daysSince !== null && daysSince < 2) {
      out[g] = 'fatigued';
      return;
    }
    if (s48 >= 5) {
      out[g] = 'fatigued';
      return;
    }
    if (daysSince !== null && daysSince < 4) {
      out[g] = 'moderate';
      return;
    }
    if (s7 >= 12 && daysSince !== null && daysSince < 7) {
      out[g] = 'moderate';
      return;
    }
    out[g] = 'rested';
  });

  return out;
}
