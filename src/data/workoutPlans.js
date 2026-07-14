import { EXERCISE_DATABASE } from '../../data/exerciseDatabase';
import { isSplitPlanTrainingDay, normalizeWeeklySplitPlan, SPLIT_DAY_TYPE_LABELS } from './weeklySplitPlanner';

export const PLAN_DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_PLAN_ID_PREFIX = 'default:';

/** @param {string} movement @param {number} targetSets @param {number} targetReps */
function exerciseTemplate(movement, targetSets = 3, targetReps = 8) {
  return { movement, targetSets, targetReps };
}

/** Built-in workout templates keyed by split day type. */
const DEFAULT_WORKOUT_TEMPLATES = {
  push: {
    name: 'Push Day',
    exercises: [
      exerciseTemplate('Bench Press', 4, 6),
      exerciseTemplate('Overhead Press', 3, 8),
      exerciseTemplate('Incline Bench Press', 3, 10),
      exerciseTemplate('Lateral Raise', 3, 12),
      exerciseTemplate('Triceps Pushdown', 3, 12),
    ],
  },
  pull: {
    name: 'Pull Day',
    exercises: [
      exerciseTemplate('Deadlift', 4, 5),
      exerciseTemplate('Barbell Row', 4, 8),
      exerciseTemplate('Lat Pulldown', 3, 10),
      exerciseTemplate('Face Pull', 3, 15),
      exerciseTemplate('Barbell Curl', 3, 10),
    ],
  },
  legs: {
    name: 'Leg Day',
    exercises: [
      exerciseTemplate('Squat', 4, 5),
      exerciseTemplate('Front Squat', 3, 8),
      exerciseTemplate('Romanian Deadlift', 3, 10),
      exerciseTemplate('Leg Press', 3, 12),
      exerciseTemplate('Standing Calf Raise', 4, 15),
    ],
  },
  upper: {
    name: 'Upper Day',
    exercises: [
      exerciseTemplate('Bench Press', 4, 6),
      exerciseTemplate('Barbell Row', 4, 8),
      exerciseTemplate('Overhead Press', 3, 8),
      exerciseTemplate('Lat Pulldown', 3, 10),
      exerciseTemplate('Lateral Raise', 3, 12),
    ],
  },
  lower: {
    name: 'Lower Day',
    exercises: [
      exerciseTemplate('Squat', 4, 6),
      exerciseTemplate('Romanian Deadlift', 3, 10),
      exerciseTemplate('Leg Press', 3, 12),
      exerciseTemplate('Hip Thrust', 3, 12),
      exerciseTemplate('Standing Calf Raise', 4, 15),
    ],
  },
  full: {
    name: 'Full Body',
    exercises: [
      exerciseTemplate('Squat', 3, 8),
      exerciseTemplate('Bench Press', 3, 8),
      exerciseTemplate('Barbell Row', 3, 10),
      exerciseTemplate('Overhead Press', 3, 10),
      exerciseTemplate('Romanian Deadlift', 3, 10),
    ],
  },
};

/**
 * @param {{ id?: string; name?: string; isDefault?: boolean } | null | undefined} plan
 */
export function isDefaultWorkoutPlan(plan) {
  if (!plan) return false;
  if (plan.isDefault === true) return true;
  return typeof plan.id === 'string' && plan.id.startsWith(DEFAULT_PLAN_ID_PREFIX);
}

/**
 * @param {{ type: string; mixedMuscles?: string[] } | null | undefined} dayEntry
 */
export function getDefaultWorkoutPlanForDayEntry(dayEntry) {
  if (!isSplitPlanTrainingDay(dayEntry)) return null;

  if (dayEntry.type === 'mixed') {
    const muscles = new Set(dayEntry.mixedMuscles ?? []);
    if (muscles.size === 0) return null;

    const seen = new Set();
    const exercises = EXERCISE_DATABASE.map((exercise) => {
      const primary = Array.isArray(exercise.primaryMuscles) ? exercise.primaryMuscles : [];
      const overlap = primary.filter((muscle) => muscles.has(muscle)).length;
      return { exercise, overlap };
    })
      .filter((item) => item.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .map((item) => item.exercise)
      .filter((exercise) => {
        const key = exercise.name.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5)
      .map((exercise) => exerciseTemplate(exercise.name, 3, 10));

    if (exercises.length === 0) return null;

    return {
      id: `${DEFAULT_PLAN_ID_PREFIX}mixed`,
      name: 'Mixed Day',
      exercises,
      isDefault: true,
    };
  }

  const template = DEFAULT_WORKOUT_TEMPLATES[dayEntry.type];
  if (!template) return null;

  const label = SPLIT_DAY_TYPE_LABELS[dayEntry.type] ?? 'Workout';
  return {
    id: `${DEFAULT_PLAN_ID_PREFIX}${dayEntry.type}`,
    name: template.name ?? `${label} Day`,
    exercises: template.exercises.map((item) => ({ ...item })),
    isDefault: true,
  };
}

function normalizeExerciseEntry(raw) {
  const movement = typeof raw?.movement === 'string' ? raw.movement.trim() : '';
  const targetSets = Number.parseInt(String(raw?.targetSets ?? ''), 10);
  const targetReps = Number.parseInt(String(raw?.targetReps ?? ''), 10);

  if (!movement) return null;

  return {
    movement,
    targetSets: Number.isFinite(targetSets) && targetSets > 0 ? targetSets : null,
    targetReps: Number.isFinite(targetReps) && targetReps > 0 ? targetReps : null,
  };
}

/**
 * @param {unknown} raw
 * @returns {{ id: string; name: string; exercises: { movement: string; targetSets: number | null; targetReps: number | null }[]; createdAt: string; updatedAt: string }[]}
 */
export function normalizeSavedWorkoutPlans(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, idx) => {
      const id = typeof item?.id === 'string' && item.id.trim() ? item.id.trim() : `plan-${idx}`;
      const name =
        typeof item?.name === 'string' && item.name.trim()
          ? item.name.trim()
          : `Workout ${idx + 1}`;
      const createdAt = typeof item?.createdAt === 'string' && item.createdAt ? item.createdAt : new Date(0).toISOString();
      const updatedAt = typeof item?.updatedAt === 'string' && item.updatedAt ? item.updatedAt : createdAt;
      const exercises = Array.isArray(item?.exercises) ? item.exercises.map(normalizeExerciseEntry).filter(Boolean) : [];

      return {
        id,
        name,
        exercises,
        createdAt,
        updatedAt,
      };
    })
    .filter((item) => item.name);
}

/**
 * @param {unknown} raw
 * @returns {{ assignments: (string | null)[] }}
 */
export function normalizeDayWorkoutAssignments(raw) {
  const source = Array.isArray(raw?.assignments) ? raw.assignments : [];
  return {
    assignments: Array.from({ length: 7 }, (_, idx) => {
      const value = source[idx];
      return typeof value === 'string' && value.trim() ? value.trim() : null;
    }),
  };
}

/**
 * @param {string} [name]
 */
export function createEmptyWorkoutPlan(name = '') {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}`,
    name: String(name || '').trim(),
    exercises: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Saved plan assigned to this day, or the built-in default for that split type.
 * @param {{ assignments: (string | null)[] } | null | undefined} dayWorkoutAssignments
 * @param {{ id: string }[] | null | undefined} savedWorkoutPlans
 * @param {number} planIndex
 * @param {{ type: string; mixedMuscles?: string[] } | null | undefined} [dayEntry]
 */
export function getWorkoutPlanForDay(dayWorkoutAssignments, savedWorkoutPlans, planIndex, dayEntry = null) {
  const normalizedAssignments = normalizeDayWorkoutAssignments(dayWorkoutAssignments);
  const planId = normalizedAssignments.assignments[planIndex] ?? null;
  if (planId) {
    const plans = normalizeSavedWorkoutPlans(savedWorkoutPlans);
    const saved = plans.find((item) => item.id === planId) ?? null;
    if (saved) return { ...saved, isDefault: false };
  }

  if (!dayEntry) return null;
  return getDefaultWorkoutPlanForDayEntry(dayEntry);
}

/**
 * @param {{ assignments: (string | null)[] } | null | undefined} dayWorkoutAssignments
 * @param {number} planIndex
 * @param {string | null | undefined} workoutPlanId
 */
export function assignWorkoutPlanToDay(dayWorkoutAssignments, planIndex, workoutPlanId) {
  const next = normalizeDayWorkoutAssignments(dayWorkoutAssignments);
  if (planIndex < 0 || planIndex > 6) return next;
  next.assignments[planIndex] = typeof workoutPlanId === 'string' && workoutPlanId.trim() ? workoutPlanId.trim() : null;
  return next;
}

/**
 * @param {{ assignments: (string | null)[] } | null | undefined} dayWorkoutAssignments
 * @param {number} dayIndexA
 * @param {number} dayIndexB
 */
export function swapWorkoutAssignmentsBetweenDays(dayWorkoutAssignments, dayIndexA, dayIndexB) {
  const next = normalizeDayWorkoutAssignments(dayWorkoutAssignments);
  if (dayIndexA < 0 || dayIndexA > 6 || dayIndexB < 0 || dayIndexB > 6) return next;
  if (dayIndexA === dayIndexB) return next;
  const temp = next.assignments[dayIndexA];
  next.assignments[dayIndexA] = next.assignments[dayIndexB];
  next.assignments[dayIndexB] = temp;
  return next;
}

/**
 * Effective workout for each training day in the weekly split.
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] } | null | undefined} weeklySplitPlan
 * @param {{ assignments: (string | null)[] } | null | undefined} dayWorkoutAssignments
 * @param {{ id: string }[] | null | undefined} savedWorkoutPlans
 */
export function getSplitWorkoutSchedule(weeklySplitPlan, dayWorkoutAssignments, savedWorkoutPlans) {
  const plan = normalizeWeeklySplitPlan(weeklySplitPlan);
  const normalizedAssignments = normalizeDayWorkoutAssignments(dayWorkoutAssignments);
  const entries = [];

  for (let planIndex = 0; planIndex < 7; planIndex += 1) {
    const dayEntry = plan.days[planIndex];
    if (!isSplitPlanTrainingDay(dayEntry)) continue;
    const workoutPlan = getWorkoutPlanForDay(dayWorkoutAssignments, savedWorkoutPlans, planIndex, dayEntry);
    if (!workoutPlan) continue;
    entries.push({
      planIndex,
      dayLabel: PLAN_DAY_LABELS[planIndex],
      workoutPlan,
      assignmentId: normalizedAssignments.assignments[planIndex],
      isDefault: isDefaultWorkoutPlan(workoutPlan),
    });
  }

  return entries;
}
