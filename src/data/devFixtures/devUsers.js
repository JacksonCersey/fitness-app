import { getDefaultWeeklySplitPlan } from '../weeklySplitPlanner';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function dateDaysAgo(days, hour = 10, minute = 30) {
  const d = new Date(Date.now() - days * MS_PER_DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function makeWorkout(id, daysAgo, setsByMovement, elapsedSeconds = 3600) {
  return {
    id,
    completedAt: dateDaysAgo(daysAgo),
    setsByMovement,
    elapsedSeconds,
  };
}

function makeWeightLog(id, daysAgo, weightLb) {
  return { id, dateISO: dateDaysAgo(daysAgo), weightLb };
}

function getPushPullLegsSplit() {
  return {
    days: [
      { type: 'push', mixedMuscles: [] },
      { type: 'pull', mixedMuscles: [] },
      { type: 'legs', mixedMuscles: [] },
      { type: 'rest', mixedMuscles: [] },
      { type: 'push', mixedMuscles: [] },
      { type: 'pull', mixedMuscles: [] },
      { type: 'rest', mixedMuscles: [] },
    ],
  };
}

function buildWeeklyStreakWorkouts(weekCount) {
  const workouts = [];
  for (let week = 0; week < weekCount; week += 1) {
    const daysAgo = week * 7 + 2;
    workouts.push(
      makeWorkout(
        `streak-w${week}`,
        daysAgo,
        {
          'Bench Press': [{ reps: 8, weight: 135 + week * 2, elapsedSeconds: 60 }],
          Squat: [{ reps: 5, weight: 185 + week * 5, elapsedSeconds: 90 }],
        },
        2700 + week * 60,
      ),
    );
  }
  return workouts;
}

function buildLongHistoryWorkouts() {
  const templates = [
    {
      setsByMovement: {
        'Bench Press': [{ reps: 10, weight: 155, elapsedSeconds: 55 }],
        'Incline Bench Press': [{ reps: 10, weight: 50, elapsedSeconds: 50 }],
      },
    },
    {
      setsByMovement: {
        'Barbell Row': [{ reps: 8, weight: 135, elapsedSeconds: 65 }],
        'Pull Up': [{ reps: 6, weight: 0, elapsedSeconds: 45 }],
      },
    },
    {
      setsByMovement: {
        Squat: [{ reps: 5, weight: 205, elapsedSeconds: 95 }],
        'Leg Press': [{ reps: 12, weight: 320, elapsedSeconds: 75 }],
      },
    },
    {
      setsByMovement: {
        Deadlift: [{ reps: 3, weight: 275, elapsedSeconds: 120 }],
        'Romanian Deadlift': [{ reps: 8, weight: 185, elapsedSeconds: 80 }],
      },
    },
  ];

  const workouts = [];
  for (let i = 0; i < 48; i += 1) {
    const template = templates[i % templates.length];
    workouts.push(makeWorkout(`history-${i}`, 3 + i * 4, template.setsByMovement, 3000 + (i % 5) * 120));
  }
  return workouts;
}

/** @typedef {import('../../app/storage/devUserStorage').DevUserSnapshot} DevUserSnapshot */

/** Dev persona that is wiped and re-seeded every time you select it (onboarding testing). */
export const DEV_USER_ALWAYS_RESET_ON_SELECT = 'empty';

/**
 * @param {string | null | undefined} userId
 * @returns {boolean}
 */
export function isAlwaysResetDevUser(userId) {
  return __DEV__ && userId === DEV_USER_ALWAYS_RESET_ON_SELECT;
}

/** @type {Record<string, { label: string; description: string }>} */
const DEV_USER_META = {
  empty: {
    label: 'New user',
    description: 'Fresh start every tap — for onboarding testing',
  },
  beginner: {
    label: 'Beginner',
    description: 'A few light workouts, just getting started',
  },
  active: {
    label: 'Active lifter',
    description: 'Regular training with solid numbers',
  },
  streak: {
    label: '12-week streak',
    description: 'Consistent weekly training for streak UI',
  },
  history: {
    label: 'Long history',
    description: 'Many months of workouts for calendar views',
  },
};

/** @type {Record<string, () => DevUserSnapshot>} */
const DEV_USER_BUILDERS = {
  empty: () => ({
    profileName: '',
    profileHeightIn: null,
    profileGoalWeightLb: null,
    workoutHistory: [],
    weightLogs: [],
    weeklySplitPlan: getDefaultWeeklySplitPlan(),
    favoriteMovements: [],
    onboardingComplete: false,
    strengthScoreDisplayed: null,
  }),

  beginner: () => ({
    profileName: 'Jamie',
    profileHeightIn: 68,
    profileGoalWeightLb: 165,
    workoutHistory: [
      makeWorkout('beg-1', 1, {
        'Goblet Squat': [{ reps: 10, weight: 35, elapsedSeconds: 50 }],
        'Dumbbell Bench Press': [{ reps: 10, weight: 25, elapsedSeconds: 45 }],
      }),
      makeWorkout('beg-2', 5, {
        'Lat Pulldown': [{ reps: 12, weight: 70, elapsedSeconds: 55 }],
        'Leg Press': [{ reps: 12, weight: 180, elapsedSeconds: 60 }],
      }),
      makeWorkout('beg-3', 12, {
        'Overhead Dumbbell Press': [{ reps: 10, weight: 20, elapsedSeconds: 48 }],
      }),
    ],
    weightLogs: [makeWeightLog('beg-w1', 14, 172), makeWeightLog('beg-w2', 0, 170)],
    weeklySplitPlan: getDefaultWeeklySplitPlan(),
    favoriteMovements: ['goblet squat'],
    onboardingComplete: true,
    strengthScoreDisplayed: null,
  }),

  active: () => ({
    profileName: 'Alex',
    profileHeightIn: 70,
    profileGoalWeightLb: 180,
    workoutHistory: [
      makeWorkout('act-1', 0, {
        'Bench Press': [
          { reps: 5, weight: 185, elapsedSeconds: 60 },
          { reps: 5, weight: 185, elapsedSeconds: 65 },
        ],
        Squat: [{ reps: 5, weight: 225, elapsedSeconds: 90 }],
        Deadlift: [{ reps: 3, weight: 315, elapsedSeconds: 120 }],
      }),
      makeWorkout('act-2', 2, {
        'Bench Press': [{ reps: 8, weight: 175, elapsedSeconds: 55 }],
        'Pull Up': [
          { reps: 8, weight: 0, elapsedSeconds: 50 },
          { reps: 6, weight: 0, elapsedSeconds: 55 },
        ],
        'Barbell Row': [{ reps: 8, weight: 155, elapsedSeconds: 70 }],
      }),
      makeWorkout('act-3', 5, {
        Squat: [{ reps: 5, weight: 215, elapsedSeconds: 88 }],
        'Leg Press': [{ reps: 12, weight: 360, elapsedSeconds: 80 }],
        'Lateral Raise': [{ reps: 12, weight: 20, elapsedSeconds: 40 }],
      }),
      makeWorkout('act-4', 9, {
        'Overhead Press': [{ reps: 6, weight: 115, elapsedSeconds: 58 }],
        'Incline Bench Press': [{ reps: 10, weight: 60, elapsedSeconds: 52 }],
      }),
      makeWorkout('act-5', 16, {
        Deadlift: [{ reps: 5, weight: 295, elapsedSeconds: 110 }],
        'Romanian Deadlift': [{ reps: 8, weight: 185, elapsedSeconds: 75 }],
      }),
    ],
    weightLogs: [
      makeWeightLog('act-w1', 30, 175),
      makeWeightLog('act-w2', 14, 177),
      makeWeightLog('act-w3', 0, 178),
    ],
    weeklySplitPlan: getPushPullLegsSplit(),
    favoriteMovements: ['bench press', 'squat', 'deadlift'],
    onboardingComplete: true,
    strengthScoreDisplayed: null,
  }),

  streak: () => ({
    profileName: 'Riley',
    profileHeightIn: 69,
    profileGoalWeightLb: 175,
    workoutHistory: buildWeeklyStreakWorkouts(12),
    weightLogs: [makeWeightLog('str-w1', 84, 182), makeWeightLog('str-w2', 0, 179)],
    weeklySplitPlan: getPushPullLegsSplit(),
    favoriteMovements: ['bench press'],
    onboardingComplete: true,
    strengthScoreDisplayed: null,
  }),

  history: () => ({
    profileName: 'Morgan',
    profileHeightIn: 72,
    profileGoalWeightLb: 195,
    workoutHistory: buildLongHistoryWorkouts(),
    weightLogs: [
      makeWeightLog('his-w1', 180, 188),
      makeWeightLog('his-w2', 90, 192),
      makeWeightLog('his-w3', 0, 190),
    ],
    weeklySplitPlan: getPushPullLegsSplit(),
    favoriteMovements: ['squat', 'barbell row'],
    onboardingComplete: true,
    strengthScoreDisplayed: null,
  }),
};

/** @returns {Array<{ id: string | null, label: string, description: string }>} */
export function getDevUserOptions() {
  return [
    { id: null, label: 'My data', description: 'Your real saved app data' },
    ...Object.entries(DEV_USER_META).map(([id, meta]) => ({
      id,
      label: meta.label,
      description: meta.description,
    })),
  ];
}

/**
 * Builds a dev persona snapshot with dates relative to right now.
 * @param {string} userId
 * @returns {DevUserSnapshot | null}
 */
export function getDevUserFixture(userId) {
  const build = DEV_USER_BUILDERS[userId];
  if (!build) return null;
  return JSON.parse(JSON.stringify(build()));
}
