/**
 * Normalized muscle activation (0–1) per exercise for muscle-map SVG coloring.
 * Keys use camelCase muscle slugs; stabilizers use low non-zero values (~0.08–0.2).
 * Colors are shades of green only (dark = low / off, light = high stress).
 */

export const MUSCLE_GROUPS = [
  'upperChest',
  'midChest',
  'lowerChest',
  'frontDelts',
  'sideDelts',
  'rearDelts',
  'triceps',
  'biceps',
  'brachialis',
  'forearms',
  'lats',
  'upperBack',
  'traps',
  'spinalErectors',
  'abs',
  'obliques',
  'glutes',
  'quads',
  'hamstrings',
  'adductors',
  'calves',
];

/** Green ramp: activation 0 → dark green, 1 → light green (linear RGB blend) */
const GREEN_SCALE_STOPS = [
  { t: 0, rgb: [0x12, 0x30, 0x22] },
  { t: 1, rgb: [0x6e, 0xeb, 0xa5] },
];

function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x)));
}

function lerp(a, b, u) {
  return Math.round(a + (b - a) * u);
}

/**
 * Map activation in [0,1] to a hex color (darker green → lighter green).
 * @param {number} activation
 * @returns {string} '#RRGGBB'
 */
export function activationToHex(activation) {
  const a = clamp01(activation);
  if (a <= GREEN_SCALE_STOPS[0].t) {
    const { rgb } = GREEN_SCALE_STOPS[0];
    return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  }
  for (let i = 0; i < GREEN_SCALE_STOPS.length - 1; i += 1) {
    const p0 = GREEN_SCALE_STOPS[i];
    const p1 = GREEN_SCALE_STOPS[i + 1];
    if (a <= p1.t) {
      const u = p1.t === p0.t ? 0 : (a - p0.t) / (p1.t - p0.t);
      const r = lerp(p0.rgb[0], p1.rgb[0], u);
      const g = lerp(p0.rgb[1], p1.rgb[1], u);
      const b = lerp(p0.rgb[2], p1.rgb[2], u);
      return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  const last = GREEN_SCALE_STOPS[GREEN_SCALE_STOPS.length - 1].rgb;
  return `#${last.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * @param {string} exerciseName — must match key in exerciseMuscleMap
 * @returns {Record<string, string>} muscleGroup → hex fill color
 */
export function getMuscleColors(exerciseName) {
  const act = exerciseMuscleMap[exerciseName];
  const out = {};
  for (let i = 0; i < MUSCLE_GROUPS.length; i += 1) {
    const g = MUSCLE_GROUPS[i];
    const v = act && Object.prototype.hasOwnProperty.call(act, g) ? act[g] : 0;
    out[g] = activationToHex(v);
  }
  return out;
}

/**
 * Raw activation map merged with zeros for every group (useful for blending multiple exercises).
 * @param {string} exerciseName
 * @returns {Record<string, number>}
 */
export function getMuscleActivations(exerciseName) {
  const act = exerciseMuscleMap[exerciseName] || {};
  const out = {};
  for (let i = 0; i < MUSCLE_GROUPS.length; i += 1) {
    const g = MUSCLE_GROUPS[i];
    out[g] = clamp01(act[g] ?? 0);
  }
  return out;
}

/**
 * Max-blend activations from several exercises (e.g. current workout), then return colors.
 * @param {string[]} exerciseNames
 * @returns {Record<string, string>}
 */
export function getMuscleColorsFromWorkout(exerciseNames) {
  const maxAct = {};
  MUSCLE_GROUPS.forEach((g) => {
    maxAct[g] = 0;
  });
  exerciseNames.forEach((name) => {
    const act = exerciseMuscleMap[name];
    if (!act) return;
    MUSCLE_GROUPS.forEach((g) => {
      if (act[g] != null) maxAct[g] = Math.max(maxAct[g], clamp01(act[g]));
    });
  });
  const out = {};
  MUSCLE_GROUPS.forEach((g) => {
    out[g] = activationToHex(maxAct[g]);
  });
  return out;
}

/** @type {Record<string, Record<string, number>>} */
export const exerciseMuscleMap = {
  'Bench Press': {
    upperChest: 0.45,
    midChest: 0.88,
    lowerChest: 0.35,
    frontDelts: 0.55,
    sideDelts: 0.18,
    triceps: 0.72,
    biceps: 0.08,
    forearms: 0.12,
    lats: 0.15,
    abs: 0.18,
    spinalErectors: 0.22,
    obliques: 0.1,
    traps: 0.12,
  },
  Squat: {
    quads: 0.95,
    glutes: 0.78,
    hamstrings: 0.38,
    spinalErectors: 0.55,
    abs: 0.25,
    obliques: 0.18,
    adductors: 0.35,
    calves: 0.18,
    upperBack: 0.22,
    traps: 0.15,
    forearms: 0.1,
  },
  Deadlift: {
    hamstrings: 0.82,
    glutes: 0.92,
    spinalErectors: 0.95,
    quads: 0.28,
    traps: 0.48,
    lats: 0.32,
    upperBack: 0.42,
    forearms: 0.38,
    abs: 0.28,
    biceps: 0.12,
    adductors: 0.25,
    calves: 0.12,
  },
  'Overhead Press': {
    frontDelts: 0.92,
    sideDelts: 0.38,
    upperChest: 0.28,
    midChest: 0.18,
    triceps: 0.48,
    traps: 0.35,
    abs: 0.32,
    spinalErectors: 0.28,
    obliques: 0.15,
    forearms: 0.15,
    rearDelts: 0.12,
  },
  'Pull Up': {
    lats: 0.92,
    biceps: 0.68,
    brachialis: 0.35,
    upperBack: 0.48,
    rearDelts: 0.25,
    forearms: 0.38,
    abs: 0.28,
    traps: 0.2,
    midChest: 0.1,
  },
  'Barbell Row': {
    upperBack: 0.72,
    lats: 0.75,
    rearDelts: 0.52,
    traps: 0.48,
    biceps: 0.45,
    forearms: 0.38,
    spinalErectors: 0.55,
    abs: 0.25,
    hamstrings: 0.18,
  },
  'Incline Bench Press': {
    upperChest: 0.88,
    midChest: 0.48,
    frontDelts: 0.62,
    triceps: 0.65,
    sideDelts: 0.22,
    abs: 0.15,
    forearms: 0.12,
    spinalErectors: 0.18,
  },
  'Decline Bench Press': {
    lowerChest: 0.88,
    midChest: 0.55,
    upperChest: 0.28,
    triceps: 0.7,
    frontDelts: 0.38,
    abs: 0.22,
    forearms: 0.12,
  },
  'Dumbbell Bench Press': {
    midChest: 0.85,
    upperChest: 0.42,
    lowerChest: 0.32,
    frontDelts: 0.52,
    triceps: 0.68,
    sideDelts: 0.2,
    forearms: 0.14,
    abs: 0.2,
  },
  'Push Up': {
    midChest: 0.72,
    upperChest: 0.38,
    frontDelts: 0.48,
    triceps: 0.58,
    abs: 0.45,
    spinalErectors: 0.25,
    forearms: 0.18,
    upperBack: 0.12,
  },
  'Explosive Push Up': {
    midChest: 0.75,
    upperChest: 0.42,
    frontDelts: 0.52,
    triceps: 0.62,
    abs: 0.48,
    spinalErectors: 0.28,
    forearms: 0.2,
    upperBack: 0.14,
  },
  'Machine Chest Press': {
    upperChest: 0.4,
    midChest: 0.85,
    lowerChest: 0.32,
    frontDelts: 0.48,
    sideDelts: 0.15,
    triceps: 0.68,
    biceps: 0.06,
    forearms: 0.1,
    abs: 0.12,
  },
  'Dumbbell Fly': {
    midChest: 0.78,
    upperChest: 0.52,
    frontDelts: 0.42,
    biceps: 0.1,
    abs: 0.12,
  },
  'Cable Fly': {
    midChest: 0.75,
    upperChest: 0.48,
    frontDelts: 0.4,
    abs: 0.1,
  },
  'Pec Deck Fly': {
    midChest: 0.8,
    upperChest: 0.5,
    frontDelts: 0.35,
    abs: 0.08,
  },
  'Chest Dip': {
    lowerChest: 0.78,
    midChest: 0.55,
    triceps: 0.72,
    frontDelts: 0.38,
    abs: 0.28,
    forearms: 0.15,
  },
  'Lat Pulldown': {
    lats: 0.88,
    upperBack: 0.48,
    biceps: 0.52,
    brachialis: 0.28,
    rearDelts: 0.28,
    forearms: 0.25,
    abs: 0.15,
  },
  'Seated Cable Row': {
    upperBack: 0.68,
    lats: 0.62,
    rearDelts: 0.45,
    biceps: 0.42,
    traps: 0.38,
    forearms: 0.32,
    spinalErectors: 0.32,
    abs: 0.22,
  },
  'Machine Seated Row': {
    upperBack: 0.7,
    lats: 0.6,
    rearDelts: 0.42,
    biceps: 0.4,
    traps: 0.35,
    forearms: 0.28,
    spinalErectors: 0.28,
    abs: 0.18,
  },
  'Single-Arm Dumbbell Row': {
    lats: 0.75,
    upperBack: 0.65,
    rearDelts: 0.48,
    biceps: 0.48,
    traps: 0.42,
    obliques: 0.38,
    forearms: 0.35,
    spinalErectors: 0.35,
  },
  'T-Bar Row': {
    upperBack: 0.78,
    lats: 0.72,
    rearDelts: 0.52,
    biceps: 0.42,
    traps: 0.45,
    forearms: 0.32,
    spinalErectors: 0.48,
    hamstrings: 0.15,
    abs: 0.2,
  },
  'Inverted Row': {
    upperBack: 0.68,
    lats: 0.55,
    rearDelts: 0.42,
    biceps: 0.48,
    midChest: 0.22,
    abs: 0.38,
    forearms: 0.28,
    spinalErectors: 0.2,
  },
  'Chin Up': {
    lats: 0.85,
    biceps: 0.78,
    brachialis: 0.42,
    upperBack: 0.4,
    forearms: 0.35,
    abs: 0.28,
    rearDelts: 0.18,
  },
  'Face Pull': {
    rearDelts: 0.78,
    upperBack: 0.55,
    traps: 0.48,
    biceps: 0.3,
    sideDelts: 0.35,
    forearms: 0.22,
  },
  'Straight-Arm Pulldown': {
    lats: 0.92,
    upperBack: 0.35,
    triceps: 0.15,
    abs: 0.2,
    forearms: 0.25,
  },
  'Romanian Deadlift': {
    hamstrings: 0.92,
    glutes: 0.82,
    spinalErectors: 0.72,
    forearms: 0.28,
    traps: 0.25,
    lats: 0.22,
    quads: 0.15,
    abs: 0.25,
  },
  'Conventional Deadlift': {
    hamstrings: 0.78,
    glutes: 0.9,
    spinalErectors: 0.95,
    traps: 0.52,
    lats: 0.38,
    upperBack: 0.42,
    quads: 0.35,
    forearms: 0.42,
    abs: 0.28,
    adductors: 0.25,
  },
  'Sumo Deadlift': {
    glutes: 0.9,
    quads: 0.65,
    adductors: 0.78,
    hamstrings: 0.55,
    spinalErectors: 0.82,
    traps: 0.45,
    forearms: 0.35,
    upperBack: 0.35,
    abs: 0.25,
  },
  'Front Squat': {
    quads: 0.92,
    glutes: 0.65,
    abs: 0.55,
    upperBack: 0.58,
    spinalErectors: 0.45,
    traps: 0.35,
    hamstrings: 0.32,
    adductors: 0.32,
    calves: 0.15,
  },
  'Goblet Squat': {
    quads: 0.78,
    glutes: 0.55,
    abs: 0.42,
    upperBack: 0.28,
    forearms: 0.22,
    adductors: 0.28,
    hamstrings: 0.25,
    spinalErectors: 0.28,
  },
  'Bulgarian Split Squat': {
    quads: 0.88,
    glutes: 0.82,
    hamstrings: 0.48,
    adductors: 0.32,
    abs: 0.35,
    spinalErectors: 0.25,
    calves: 0.22,
  },
  'Walking Lunge': {
    quads: 0.85,
    glutes: 0.8,
    hamstrings: 0.45,
    calves: 0.38,
    adductors: 0.3,
    abs: 0.28,
    spinalErectors: 0.22,
  },
  'Reverse Lunge': {
    glutes: 0.82,
    quads: 0.75,
    hamstrings: 0.42,
    abs: 0.3,
    calves: 0.28,
    adductors: 0.28,
  },
  'Leg Press': {
    quads: 0.92,
    glutes: 0.68,
    hamstrings: 0.35,
    adductors: 0.28,
    calves: 0.2,
    spinalErectors: 0.12,
  },
  'Hack Squat': {
    quads: 0.95,
    glutes: 0.62,
    hamstrings: 0.3,
    calves: 0.18,
    adductors: 0.25,
    spinalErectors: 0.15,
    abs: 0.18,
  },
  'Step Up': {
    quads: 0.78,
    glutes: 0.85,
    hamstrings: 0.38,
    calves: 0.35,
    adductors: 0.25,
    abs: 0.25,
  },
  'Hip Thrust': {
    glutes: 0.95,
    hamstrings: 0.55,
    quads: 0.32,
    abs: 0.28,
    adductors: 0.35,
    spinalErectors: 0.22,
  },
  'Glute Bridge': {
    glutes: 0.88,
    hamstrings: 0.48,
    abs: 0.35,
    quads: 0.18,
    adductors: 0.25,
  },
  'Leg Extension': {
    quads: 0.95,
    abs: 0.12,
    calves: 0.08,
  },
  'Lying Leg Curl': {
    hamstrings: 0.95,
    calves: 0.18,
    glutes: 0.22,
    abs: 0.1,
  },
  'Seated Leg Curl': {
    hamstrings: 0.93,
    calves: 0.2,
    glutes: 0.18,
  },
  'Standing Calf Raise': {
    calves: 0.95,
    hamstrings: 0.12,
    glutes: 0.1,
  },
  'Seated Calf Raise': {
    calves: 0.95,
    hamstrings: 0.15,
  },
  'Overhead Dumbbell Press': {
    frontDelts: 0.9,
    sideDelts: 0.42,
    triceps: 0.5,
    upperChest: 0.28,
    traps: 0.38,
    abs: 0.32,
    spinalErectors: 0.25,
    forearms: 0.15,
  },
  'Incline Dumbbell Shoulder Press': {
    frontDelts: 0.88,
    sideDelts: 0.48,
    triceps: 0.52,
    upperChest: 0.42,
    traps: 0.32,
    abs: 0.28,
    spinalErectors: 0.2,
    forearms: 0.14,
  },
  'Machine Shoulder Press': {
    frontDelts: 0.88,
    sideDelts: 0.4,
    triceps: 0.52,
    upperChest: 0.25,
    traps: 0.32,
    abs: 0.18,
    forearms: 0.12,
  },
  'Arnold Press': {
    frontDelts: 0.82,
    sideDelts: 0.72,
    upperChest: 0.35,
    triceps: 0.48,
    abs: 0.22,
    spinalErectors: 0.2,
    forearms: 0.14,
  },
  'Lateral Raise': {
    sideDelts: 0.95,
    traps: 0.48,
    frontDelts: 0.22,
    forearms: 0.18,
    abs: 0.12,
  },
  'Front Raise': {
    frontDelts: 0.95,
    sideDelts: 0.28,
    upperChest: 0.25,
    abs: 0.12,
    traps: 0.18,
  },
  'Rear Delt Fly': {
    rearDelts: 0.92,
    upperBack: 0.52,
    traps: 0.35,
    sideDelts: 0.18,
    forearms: 0.15,
    spinalErectors: 0.25,
  },
  'Upright Row': {
    sideDelts: 0.78,
    traps: 0.72,
    biceps: 0.42,
    forearms: 0.32,
    frontDelts: 0.35,
    upperBack: 0.22,
  },
  'Barbell Shrug': {
    traps: 0.95,
    forearms: 0.45,
    upperBack: 0.35,
    spinalErectors: 0.22,
    rearDelts: 0.18,
  },
  'Skull Crusher': {
    triceps: 0.92,
    forearms: 0.35,
    rearDelts: 0.12,
    abs: 0.18,
    lats: 0.1,
  },
  'Triceps Pushdown': {
    triceps: 0.95,
    forearms: 0.38,
    abs: 0.12,
    lats: 0.08,
  },
  'Overhead Triceps Extension': {
    triceps: 0.95,
    abs: 0.28,
    lats: 0.15,
    forearms: 0.32,
    rearDelts: 0.12,
  },
  'Close-Grip Bench Press': {
    triceps: 0.88,
    midChest: 0.55,
    lowerChest: 0.42,
    frontDelts: 0.38,
    upperChest: 0.28,
    abs: 0.18,
    forearms: 0.15,
  },
  'Barbell Curl': {
    biceps: 0.92,
    brachialis: 0.55,
    forearms: 0.42,
    abs: 0.15,
    spinalErectors: 0.18,
  },
  'Dumbbell Curl': {
    biceps: 0.9,
    brachialis: 0.52,
    forearms: 0.4,
    abs: 0.12,
  },
  'Hammer Curl': {
    brachialis: 0.88,
    biceps: 0.62,
    forearms: 0.52,
  },
  'Preacher Curl': {
    biceps: 0.95,
    brachialis: 0.48,
    forearms: 0.35,
  },
  'Cable Curl': {
    biceps: 0.9,
    forearms: 0.38,
    brachialis: 0.45,
  },
  'Wrist Curl': {
    forearms: 0.95,
    biceps: 0.08,
  },
  'Reverse Wrist Curl': {
    forearms: 0.95,
    brachialis: 0.1,
  },
  Crunch: {
    abs: 0.88,
    obliques: 0.22,
    spinalErectors: 0.1,
  },
  'Hanging Leg Raise': {
    abs: 0.85,
    forearms: 0.48,
    obliques: 0.35,
    lats: 0.28,
  },
  Plank: {
    abs: 0.68,
    obliques: 0.55,
    glutes: 0.42,
    quads: 0.28,
    upperBack: 0.38,
    frontDelts: 0.42,
    spinalErectors: 0.35,
  },
  'Russian Twist': {
    obliques: 0.85,
    abs: 0.62,
    spinalErectors: 0.28,
  },
  'Cable Woodchop': {
    obliques: 0.88,
    abs: 0.55,
    upperBack: 0.32,
    glutes: 0.25,
    frontDelts: 0.35,
  },
  'Back Extension': {
    spinalErectors: 0.88,
    glutes: 0.58,
    hamstrings: 0.48,
    upperBack: 0.28,
    abs: 0.15,
  },
};
