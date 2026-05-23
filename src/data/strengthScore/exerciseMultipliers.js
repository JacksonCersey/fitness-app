/**
 * Exercise importance multipliers for strength scoring.
 * Higher = compound barbell / pull-up patterns; lower = machines & isolation.
 */

/** @typedef {'compound' | 'machine' | 'isolation' | 'custom'} StrengthLiftCategory */

/** Exact movement name (lowercase) → multiplier. */
const EXACT_MULTIPLIERS = {
  deadlift: 1.3,
  'conventional deadlift': 1.3,
  'sumo deadlift': 1.28,
  'romanian deadlift': 1.12,
  squat: 1.2,
  'front squat': 1.15,
  'goblet squat': 0.95,
  'bulgarian split squat': 0.9,
  'leg press': 0.65,
  'hack squat': 0.7,
  'bench press': 1.0,
  'incline bench press': 0.92,
  'decline bench press': 0.9,
  'dumbbell bench press': 0.88,
  'overhead press': 0.8,
  'overhead dumbbell press': 0.78,
  'arnold press': 0.72,
  'pull up': 1.0,
  'chin up': 1.0,
  'weighted pull up': 1.0,
  'barbell row': 0.9,
  'pendlay row': 0.9,
  't-bar row': 0.85,
  'seated cable row': 0.68,
  'lat pulldown': 0.62,
  'single-arm dumbbell row': 0.75,
  'inverted row': 0.82,
  'push up': 0.72,
  'dip': 0.78,
  'chest dip': 0.78,
  'hip thrust': 0.88,
  'glute bridge': 0.75,
};

/** Substring patterns (lowercase), first match wins. */
const PATTERN_MULTIPLIERS = [
  { includes: ['deadlift'], multiplier: 1.25, category: 'compound' },
  { includes: ['squat'], multiplier: 1.15, category: 'compound' },
  { includes: ['bench'], multiplier: 0.98, category: 'compound' },
  { includes: ['overhead press', 'military press', 'ohp'], multiplier: 0.8, category: 'compound' },
  { includes: ['pull up', 'pull-up', 'pullup', 'chin up', 'chin-up'], multiplier: 1.0, category: 'compound' },
  { includes: ['row'], multiplier: 0.88, category: 'compound' },
  { includes: ['leg press', 'hack squat', 'smith'], multiplier: 0.65, category: 'machine' },
  { includes: ['cable', 'pulldown', 'machine', 'pec deck', 'leg extension', 'leg curl'], multiplier: 0.6, category: 'machine' },
  { includes: ['fly', 'raise', 'curl', 'extension', 'kickback', 'shrug', 'crunch', 'woodchop'], multiplier: 0.4, category: 'isolation' },
  { includes: ['lunge', 'step up', 'step-up'], multiplier: 0.85, category: 'compound' },
];

const DEFAULT_CUSTOM_MULTIPLIER = 0.55;
const DEFAULT_UNKNOWN_MULTIPLIER = 0.65;

/**
 * @param {string} movementName
 * @returns {{ multiplier: number, category: StrengthLiftCategory }}
 */
export function getExerciseStrengthMeta(movementName) {
  const key = (movementName || '').trim().toLowerCase();
  if (!key) {
    return { multiplier: DEFAULT_CUSTOM_MULTIPLIER, category: 'custom' };
  }

  if (EXACT_MULTIPLIERS[key] != null) {
    return { multiplier: EXACT_MULTIPLIERS[key], category: 'compound' };
  }

  for (let i = 0; i < PATTERN_MULTIPLIERS.length; i += 1) {
    const rule = PATTERN_MULTIPLIERS[i];
    if (rule.includes.some((frag) => key.includes(frag))) {
      return { multiplier: rule.multiplier, category: rule.category };
    }
  }

  return { multiplier: DEFAULT_UNKNOWN_MULTIPLIER, category: 'custom' };
}

/**
 * @param {string} movementName
 * @returns {string}
 */
export function normalizeMovementKey(movementName) {
  return (movementName || '').trim().toLowerCase();
}
