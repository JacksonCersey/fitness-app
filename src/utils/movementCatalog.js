import { EXERCISE_DATABASE } from '../../data/exerciseDatabase';
import { buildMovementHistorySummaries } from './movementSetHistory';
import { isFavoriteMovement } from './movementFavorites';

/**
 * @typedef {Object} MovementCatalogRow
 * @property {string} movement
 * @property {string} primaryMuscle
 * @property {string} bodyRegionId
 * @property {object | null} exercise
 * @property {boolean} isLogged
 * @property {import('./movementSetHistory').MovementHistorySummary | null} summary
 */

/**
 * @typedef {Object} MovementAccordionSection
 * @property {string} id
 * @property {string} label
 * @property {MovementCatalogRow[]} rows
 */

/** Collapsible section order on the Movements screen. */
export const MOVEMENT_ACCORDION_SECTIONS = [
  { id: 'favorites', label: 'Favorites', kind: 'favorites' },
  { id: 'chest', label: 'Chest', kind: 'region', regionId: 'chest' },
  { id: 'arms', label: 'Arms', kind: 'region', regionId: 'arms' },
  { id: 'back', label: 'Back', kind: 'region', regionId: 'back' },
  { id: 'shoulders', label: 'Shoulders', kind: 'region', regionId: 'shoulders' },
  { id: 'legs', label: 'Legs', kind: 'region', regionId: 'legs' },
  { id: 'core', label: 'Core', kind: 'region', regionId: 'core' },
  { id: 'other', label: 'Other', kind: 'region', regionId: 'other' },
];

export const MOVEMENT_REGION_SECTION_IDS = new Set(
  MOVEMENT_ACCORDION_SECTIONS.filter((s) => s.kind === 'region').map((s) => s.id),
);

/** @param {string} regionSectionId */
export function movementNotLoggedNestedSectionId(regionSectionId) {
  return `${regionSectionId}__not_logged`;
}

/** Maps each exercise primary muscle label → body region id. */
const PRIMARY_MUSCLE_TO_REGION = {
  Chest: 'chest',
  'Upper Chest': 'chest',
  'Lower Chest': 'chest',
  Biceps: 'arms',
  Triceps: 'arms',
  Forearms: 'arms',
  Lats: 'back',
  'Upper Back': 'back',
  'Lower Back': 'back',
  Traps: 'back',
  'Teres Major': 'back',
  'Rear Delts': 'back',
  'Front Delts': 'shoulders',
  'Side Delts': 'shoulders',
  Quads: 'legs',
  Glutes: 'legs',
  Hamstrings: 'legs',
  Calves: 'legs',
  Adductors: 'legs',
  'Hip Flexors': 'legs',
  Abs: 'core',
  Obliques: 'core',
  Core: 'core',
};

/** @param {string} primaryMuscle */
export function getMovementBodyRegionId(primaryMuscle) {
  return PRIMARY_MUSCLE_TO_REGION[primaryMuscle] ?? 'other';
}

/**
 * All database exercises plus custom names from workout history.
 * @param {unknown[]} workoutHistory
 * @param {typeof EXERCISE_DATABASE} [exerciseDatabase]
 * @returns {MovementCatalogRow[]}
 */
export function buildMovementCatalog(workoutHistory, exerciseDatabase = EXERCISE_DATABASE) {
  const summaries = buildMovementHistorySummaries(workoutHistory);
  /** @type {Map<string, import('./movementSetHistory').MovementHistorySummary>} */
  const summaryByKey = new Map();
  summaries.forEach((row) => {
    summaryByKey.set(row.movement.trim().toLowerCase(), row);
  });

  /** @type {MovementCatalogRow[]} */
  const rows = [];
  const seen = new Set();

  for (let i = 0; i < exerciseDatabase.length; i += 1) {
    const exercise = exerciseDatabase[i];
    const key = exercise.name.trim().toLowerCase();
    seen.add(key);
    const primaryMuscle = exercise.primaryMuscles?.[0] ?? 'Other';
    rows.push({
      movement: exercise.name,
      primaryMuscle,
      bodyRegionId: getMovementBodyRegionId(primaryMuscle),
      exercise,
      isLogged: summaryByKey.has(key),
      summary: summaryByKey.get(key) ?? null,
    });
  }

  summaries.forEach((summary) => {
    const key = summary.movement.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      movement: summary.movement,
      primaryMuscle: 'Other',
      bodyRegionId: 'other',
      exercise: null,
      isLogged: true,
      summary,
    });
  });

  return rows;
}

/**
 * Logged first, then A–Z.
 * @param {MovementCatalogRow[]} rows
 */
export function sortMovementCatalogRows(rows) {
  return [...rows].sort((a, b) => {
    if (a.isLogged !== b.isLogged) return a.isLogged ? -1 : 1;
    return a.movement.localeCompare(b.movement);
  });
}

/**
 * @param {MovementCatalogRow[]} rows
 * @param {string} searchQuery
 */
export function filterMovementCatalogBySearch(rows, searchQuery) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return rows;

  return rows.filter((row) => {
    if (row.movement.toLowerCase().includes(q)) return true;
    if (row.primaryMuscle.toLowerCase().includes(q)) return true;
    const exercise = row.exercise;
    if (!exercise) return false;
    const prim = exercise.primaryMuscles?.join(' ').toLowerCase() ?? '';
    const sec = exercise.secondaryMuscles?.join(' ').toLowerCase() ?? '';
    return prim.includes(q) || sec.includes(q);
  });
}

/**
 * @param {MovementCatalogRow[]} catalogRows
 * @param {Set<string>} favoriteKeys
 * @param {string} searchQuery
 * @returns {MovementAccordionSection[]}
 */
export function buildMovementAccordionSections(catalogRows, favoriteKeys, searchQuery) {
  const filtered = sortMovementCatalogRows(filterMovementCatalogBySearch(catalogRows, searchQuery));

  return MOVEMENT_ACCORDION_SECTIONS.map((sectionDef) => {
    let rows = [];

    if (sectionDef.kind === 'favorites') {
      rows = filtered.filter((row) => isFavoriteMovement(favoriteKeys, row.movement));
    } else if (sectionDef.kind === 'region') {
      rows = filtered.filter((row) => row.bodyRegionId === sectionDef.regionId);
    }

    return {
      id: sectionDef.id,
      label: sectionDef.label,
      rows,
    };
  });
}
