import { DEFAULT_BODYWEIGHT_LB } from '../data/strengthScore/constants';
import {
  estimateOneRepMax,
  getBestWorkingSet,
  getEffectiveLoadLb,
  isWorkingSet,
} from '../data/strengthScore/e1rm';
import { isBodyweightOnlyExercise } from './formatWorkout';

/** @typedef {'e1rm_pr' | 'weight_pr' | 'rep_pr' | 'session_milestone' | 'workout_start'} CelebrationKind */

/**
 * @typedef {Object} WorkoutCelebrationEvent
 * @property {CelebrationKind} kind
 * @property {string} title
 * @property {string} subtitle
 * @property {string} [dedupeKey] once per workout (e.g. workout_start)
 */

const E1RM_PR_EPSILON = 0.25;
/** First set uses `workout_start` when applicable; 1 omitted here to avoid duplicate banners. */
const SESSION_SET_MILESTONES = [5, 10, 15, 20];

/**
 * @param {Record<string, unknown[]>} setsByMovement
 * @returns {number}
 */
export function countSessionLoggedSets(setsByMovement) {
  if (!setsByMovement || typeof setsByMovement !== 'object') return 0;
  return Object.values(setsByMovement).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0,
  );
}

/**
 * @param {string} exerciseName
 * @param {unknown[]} workoutHistory
 * @param {Record<string, unknown[]>} setsByMovement
 * @param {{ id: string; name: string }[]} workoutMovementOrder
 * @returns {Array<{ weight?: number; reps?: number }>}
 */
function collectPriorSetsForMovement(exerciseName, workoutHistory, setsByMovement, workoutMovementOrder) {
  const key = String(exerciseName || '').trim().toLowerCase();
  if (!key) return [];

  /** @type {Array<{ weight?: number; reps?: number }>} */
  const prior = [];

  if (Array.isArray(workoutHistory)) {
    for (let w = 0; w < workoutHistory.length; w += 1) {
      const workout = workoutHistory[w];
      const map = workout?.setsByMovement;
      if (!map || typeof map !== 'object') continue;
      const names = Object.keys(map);
      for (let m = 0; m < names.length; m += 1) {
        const movement = names[m];
        if (movement.trim().toLowerCase() !== key) continue;
        const sets = map[movement];
        if (Array.isArray(sets)) prior.push(...sets);
      }
    }
  }

  if (Array.isArray(workoutMovementOrder)) {
    for (let i = 0; i < workoutMovementOrder.length; i += 1) {
      const slot = workoutMovementOrder[i];
      if (!slot?.name || slot.name.trim().toLowerCase() !== key) continue;
      const sets = setsByMovement?.[slot.id];
      if (Array.isArray(sets)) prior.push(...sets);
    }
  }

  return prior;
}

function formatLb(value) {
  const n = Number(value) || 0;
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  return String(Math.round(n * 10) / 10);
}

/**
 * Decide what (if anything) to celebrate after the user logs a set.
 * Call before appending the new set to state.
 *
 * @param {{
 *   exerciseName: string;
 *   weightLb: number;
 *   reps: number;
 *   workoutHistory: unknown[];
 *   setsByMovement: Record<string, unknown[]>;
 *   workoutMovementOrder: { id: string; name: string }[];
 *   exerciseLookup: Record<string, { bodyweightOnly?: boolean }>;
 *   sessionSetCountBefore: number;
 *   bodyweightLb?: number;
 * }} params
 * @returns {WorkoutCelebrationEvent | null}
 */
export function evaluateSetCelebration({
  exerciseName,
  weightLb,
  reps,
  workoutHistory,
  setsByMovement,
  workoutMovementOrder,
  exerciseLookup,
  sessionSetCountBefore,
  bodyweightLb = DEFAULT_BODYWEIGHT_LB,
}) {
  const name = String(exerciseName || '').trim();
  if (!name) return null;

  const parsedReps = Number.parseInt(String(reps), 10) || 0;
  const parsedWeight = Number(weightLb) || 0;
  if (parsedReps <= 0) return null;

  const bw = isBodyweightOnlyExercise(name, exerciseLookup);
  const load = getEffectiveLoadLb(name, { weight: parsedWeight, reps: parsedReps }, bodyweightLb, exerciseLookup);
  if (!isWorkingSet(parsedReps, load)) return null;

  const priorSets = collectPriorSetsForMovement(
    name,
    workoutHistory,
    setsByMovement,
    workoutMovementOrder,
  );

  const sessionSetCountAfter = sessionSetCountBefore + 1;

  if (priorSets.length === 0) {
    if (sessionSetCountBefore === 0) {
      return {
        kind: 'workout_start',
        dedupeKey: 'workout_start',
        title: "Let's go!",
        subtitle: 'First set of this workout — keep stacking wins.',
      };
    }
    return {
      kind: 'e1rm_pr',
      title: 'New movement logged',
      subtitle: `Nice work starting ${name} in this app.`,
    };
  }

  const newE1rm = estimateOneRepMax(load, parsedReps);
  const priorBest = getBestWorkingSet(name, priorSets, bodyweightLb, exerciseLookup);
  const priorBestE1rm = priorBest?.estimated1Rm ?? 0;

  if (newE1rm > priorBestE1rm + E1RM_PR_EPSILON) {
    return {
      kind: 'e1rm_pr',
      title: 'New strength PR',
      subtitle: `${name} — estimated max is up from your previous best.`,
    };
  }

  if (!bw) {
    let priorMaxWeight = 0;
    for (let i = 0; i < priorSets.length; i += 1) {
      const w = Number(priorSets[i]?.weight) || 0;
      const r = Number(priorSets[i]?.reps) || 0;
      if (r > 0 && w > priorMaxWeight) priorMaxWeight = w;
    }
    if (parsedWeight > priorMaxWeight + 1e-6) {
      return {
        kind: 'weight_pr',
        title: 'New weight PR',
        subtitle: `${formatLb(parsedWeight)} lb on ${name} — heaviest you've logged.`,
      };
    }
  } else {
    let priorMaxReps = 0;
    for (let i = 0; i < priorSets.length; i += 1) {
      const r = Number(priorSets[i]?.reps) || 0;
      if (r > priorMaxReps) priorMaxReps = r;
    }
    if (parsedReps > priorMaxReps) {
      const loadLabel =
        parsedWeight > 0 ? `${parsedReps} reps @ +${formatLb(parsedWeight)} lb` : `${parsedReps} reps`;
      return {
        kind: 'rep_pr',
        title: 'New rep PR',
        subtitle: `${loadLabel} on ${name} — most reps you've hit.`,
      };
    }
  }

  if (SESSION_SET_MILESTONES.includes(sessionSetCountAfter)) {
    const milestoneMessages = {
      1: { title: 'First set!', subtitle: 'Great start — momentum builds from here.' },
      5: { title: '5 sets deep', subtitle: "You're in the groove. Keep it up." },
      10: { title: '10 sets logged', subtitle: 'Solid volume this session.' },
      15: { title: '15 sets logged', subtitle: 'Strong work — stay focused.' },
      20: { title: '20 sets logged', subtitle: 'Beast mode — finish strong.' },
    };
    const msg = milestoneMessages[sessionSetCountAfter];
    if (msg) {
      return {
        kind: 'session_milestone',
        dedupeKey: `session_set_${sessionSetCountAfter}`,
        title: msg.title,
        subtitle: msg.subtitle,
      };
    }
  }

  return null;
}
