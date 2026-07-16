/**
 * Per-exercise form diagrams keyed by catalog movement name (lowercase).
 * Metro requires static string paths inside `require()` — no dynamic paths.
 *
 * Most diagrams are a horizontal strip of 2 panels (start / end). A few have
 * more panels; icons always show only the first (leftmost) panel.
 */

/** @type {Record<string, number>} */
const DIAGRAM_BY_MOVEMENT = {
  'barbell row': require('../../assets/images/exercise diagrams/Barbell Bent Over Wide Grip Row/37211101-Barbell-Bent-Over-Wide-Grip-Row_Back_medium.png'),
  deadlift: require('../../assets/images/exercise diagrams/Barbell Clean Deadlift/15151101-Barbell-Clean-Deadlift_Thighs_medium.png'),
  'barbell curl': require('../../assets/images/exercise diagrams/Barbell Curl/00311101-Barbell-Curl_Upper-Arms-FIX_medium.png'),
  'bench press': require('../../assets/images/exercise-diagrams/barbell-bench-press-medium.png'),
  'front squat': require('../../assets/images/exercise diagrams/Barbell Front Squat/00421101-Barbell-Front-Squat_Hips-FIX_medium.png'),
  'hip thrust': require('../../assets/images/exercise diagrams/Barbell Hip Thrust/10601101-Barbell-Hip-Thrust_Hips_medium.png'),
  'skull crusher': require('../../assets/images/exercise diagrams/Barbell Lying Triceps Extension/00611101-Barbell-Lying-Triceps-Extension_Upper-Arms_medium.png'),
  squat: require('../../assets/images/exercise diagrams/Barbell Narrow Stance Squat/56331101-Barbell-Narrow-Stance-Squat-(male)_Thighs_medium.png'),
  'incline bench press': require('../../assets/images/exercise diagrams/Barbell Pause Incline Bench Press/50111101-Barbell-Pause-Incline-Bench-Press_Chest_medium.png'),
  'romanian deadlift': require('../../assets/images/exercise diagrams/Barbell Romanian Deadlift/00851101-Barbell-Romanian-Deadlift_Hips-FIX_medium.png'),
  'chin up': require('../../assets/images/exercise diagrams/Bent Arms Chin-up/52361101-Bent-Arms-Chin-Up_Back_medium.png'),
  'bulgarian split squat': require('../../assets/images/exercise diagrams/Bulgarian Split Squat/35331101-Bulgarian-Split-Squat_Thighs_medium.png'),
  'cable curl': require('../../assets/images/exercise diagrams/Cable Curl/08681101-Cable-Curl-(male)_Upper-Arms-FIX_medium.png'),
  'seated cable row': require('../../assets/images/exercise diagrams/Cable Seated Lats Focused Row/55531101-Cable-Seated-Lats-Focused-Row_Back_medium.png'),
  'face pull': require('../../assets/images/exercise diagrams/Cable Standing Face Pull/56091101-Cable-Standing-Face-Pull_Shoulders_medium.png'),
  'cable fly': require('../../assets/images/exercise diagrams/Cable Standing Fly/112501101-Cable-Standing-Fly-(VERSION-3)_Chest_medium.png'),
  'triceps pushdown': require('../../assets/images/exercise diagrams/Cable Triceps Pushdown (V-bar)/02411101-Cable-Triceps-Pushdown-(V-bar-attachment)_Upper-Arms_medium.png'),
  'lat pulldown': require('../../assets/images/exercise diagrams/Cable Wide Pulldown/01971101-Cable-Wide-Pulldown_Back-FIX_medium.png'),
  'hammer curl': require('../../assets/images/exercise diagrams/Dumbbell Hammer Curl/03131101-Dumbbell-Hammer-Curl_Forearm_medium.png'),
  'incline dumbbell shoulder press': require('../../assets/images/exercise diagrams/Dumbbell Incline Shoulders Press/52611101-Dumbbell-Incline-Shoulders-Press_Shoulders_medium.png'),
  'single-arm dumbbell row': require('../../assets/images/exercise diagrams/Dumbbell One Arm Bent-over Row/02921101-Dumbbell-Bent-over-Row_back_Back-AFIX_medium.png'),
  'rear delt fly': require('../../assets/images/exercise diagrams/Dumbbell Rear Delt Fly (45 degrees)/53031101-Dumbbell-Rear-Delt-Fly-(45-degrees)_Shoulders_medium.png'),
  'lateral raise': require('../../assets/images/exercise diagrams/Dumbbell Standing Bent Arm Lateral Raise/56311101-Dumbbell-Standing-Bent-Arm-Lateral-raise-(male)_Shoulders_medium.png'),
  'walking lunge': require('../../assets/images/exercise diagrams/Dumbbell Walking Lunges/15571101-Dumbbell-Walking-Lunges_Thighs_medium.png'),
  'overhead press': require('../../assets/images/exercise diagrams/EZ-Bar Standing Overhead Press/12261101-EZ-Bar-Standing-Overhead-Press_Shoulders_medium.png'),
  'explosive push up': require('../../assets/images/exercise diagrams/Explosive Push-up/54601101-Explosive-Push-Up_Chest_medium.png'),
  'machine chest press': require('../../assets/images/exercise diagrams/Lever Chest Press (plate loaded)/05761101-Lever-Chest-Press-(plate-loaded)_Chest_medium.png'),
  'leg extension': require('../../assets/images/exercise diagrams/Lever Leg Extension/05851101-Lever-Leg-Extension_Thighs_medium.png'),
  'pec deck fly': require('../../assets/images/exercise diagrams/Lever Pec Deck Fly/10301101-Lever-Pec-Deck-Fly_Chest_medium.png'),
  'preacher curl': require('../../assets/images/exercise diagrams/Lever Preacher Curl/05921101-Lever-Preacher-Curl_Upper-Arms-FIX_medium.png'),
  'seated calf raise': require('../../assets/images/exercise diagrams/Lever Seated Calf Raise/26661101-Lever-Seated-Calf-Raise-(plate-loaded)-(VERSION-2)_Calves_medium.png'),
  'seated leg curl': require('../../assets/images/exercise diagrams/Lever Seated Leg Curl/05991101-Lever-Seated-Leg-Curl_Thighs-FIX_medium.png'),
  'machine seated row': require('../../assets/images/exercise diagrams/Lever Seated Row/13501101-Lever-Seated-Row_Back_medium.png'),
  'machine shoulder press': require('../../assets/images/exercise diagrams/Lever Shoulder Press (plate loaded) version 2/08691101-Lever-Shoulder-Press-(plate-loaded)-II_Shoulders_medium.png'),
  'standing calf raise': require('../../assets/images/exercise diagrams/Lever Standing Calf Raise/06051101-Lever-Standing-Calf-Raise_Calf_medium.png'),
  'pull up': require('../../assets/images/exercise diagrams/Shoulder Width Neutral Grip Pull-up/54731101-Shoulder-Width-Neutral-Grip-Pull-up_Back_medium.png'),
  'leg press': require('../../assets/images/exercise diagrams/Sled 45 Degree Leg Press/07391101-Sled-45¯-Leg-Press_Hips_medium.png'),
};

/** Horizontal panel count when not the default of 2. */
/** @type {Record<string, number>} */
const PANEL_COUNT_OVERRIDES = {
  'incline bench press': 3,
  'walking lunge': 4,
};

/**
 * Which panel to show as the icon (0 = leftmost). Prefer a clear “active” pose
 * when the first frame is mostly blank standing space.
 * @type {Record<string, number>}
 */
const PANEL_INDEX_OVERRIDES = {
  'walking lunge': 1,
};

const DEFAULT_PANEL_COUNT = 2;

/**
 * @param {string | null | undefined} movementName
 * @returns {string}
 */
function normalizeMovementKey(movementName) {
  return typeof movementName === 'string' ? movementName.trim().toLowerCase() : '';
}

/**
 * PNG asset for an exercise form diagram, or null if none is bundled.
 * @param {string | null | undefined} movementName
 * @returns {number | null}
 */
export function getExerciseDiagramSource(movementName) {
  const key = normalizeMovementKey(movementName);
  if (!key) return null;
  return DIAGRAM_BY_MOVEMENT[key] ?? null;
}

/**
 * How many side-by-side panels the diagram strip contains (usually 2).
 * @param {string | null | undefined} movementName
 * @returns {number}
 */
export function getExerciseDiagramPanelCount(movementName) {
  const key = normalizeMovementKey(movementName);
  if (!key || DIAGRAM_BY_MOVEMENT[key] == null) return DEFAULT_PANEL_COUNT;
  const override = PANEL_COUNT_OVERRIDES[key];
  return Number.isFinite(override) && override >= 1 ? override : DEFAULT_PANEL_COUNT;
}

/**
 * Which panel index to use for icons (0-based from the left).
 * @param {string | null | undefined} movementName
 * @returns {number}
 */
export function getExerciseDiagramPanelIndex(movementName) {
  const key = normalizeMovementKey(movementName);
  if (!key || DIAGRAM_BY_MOVEMENT[key] == null) return 0;
  const override = PANEL_INDEX_OVERRIDES[key];
  if (!Number.isFinite(override) || override < 0) return 0;
  const max = getExerciseDiagramPanelCount(key) - 1;
  return Math.min(max, Math.floor(override));
}
