import { buildExerciseLookup, EXERCISE_DATABASE } from '../../../data/exerciseDatabase';
import { computeStrengthScoreSummary } from './index';

const lookup = buildExerciseLookup(EXERCISE_DATABASE);

/** Sample workouts for manual verification in dev tools. */
export const SAMPLE_WORKOUTS_FOR_STRENGTH = [
  {
    id: 'sample-1',
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    setsByMovement: {
      'Bench Press': [
        { reps: 5, weight: 185, elapsedSeconds: 60 },
        { reps: 5, weight: 185, elapsedSeconds: 65 },
      ],
      Squat: [{ reps: 5, weight: 225, elapsedSeconds: 90 }],
      Deadlift: [{ reps: 3, weight: 315, elapsedSeconds: 120 }],
    },
  },
  {
    id: 'sample-2',
    completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    setsByMovement: {
      'Bench Press': [{ reps: 8, weight: 175, elapsedSeconds: 55 }],
      'Pull Up': [
        { reps: 8, weight: 0, elapsedSeconds: 50 },
        { reps: 6, weight: 0, elapsedSeconds: 55 },
      ],
      'Barbell Row': [{ reps: 8, weight: 155, elapsedSeconds: 70 }],
    },
  },
  {
    id: 'sample-3',
    completedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    setsByMovement: {
      'Leg Press': [{ reps: 12, weight: 360, elapsedSeconds: 80 }],
      'Lateral Raise': [{ reps: 12, weight: 20, elapsedSeconds: 40 }],
    },
  },
];

const SAMPLE_WEIGHT_LOGS = [
  { id: 'w1', dateISO: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), weightLb: 175 },
  { id: 'w2', dateISO: new Date().toISOString(), weightLb: 178 },
];

/**
 * Logs example scores to console (dev only).
 * @returns {import('./index').StrengthScoreSummary}
 */
export function runStrengthScoreExamples() {
  const summary = computeStrengthScoreSummary(
    SAMPLE_WORKOUTS_FOR_STRENGTH,
    SAMPLE_WEIGHT_LOGS,
    lookup,
    4,
    new Date(),
    null,
  );
  if (__DEV__) {
    console.log('[StrengthScore] example summary:', summary);
  }
  return summary;
}
