/**
 * Maps split-planner muscle display labels to the small cropped highlight PNGs
 * in assets/images/highlighted-diagrams (one icon per muscle *group*, deduped).
 */

/** @type {{ id: string; source: number; labels: string[]; groupLabel: string }[]} */
const HIGHLIGHT_ICON_GROUPS = [
  {
    id: 'chest',
    source: require('../../assets/images/highlighted-diagrams/chesthighlighted.png'),
    labels: ['Chest', 'Upper Chest', 'Lower Chest'],
    groupLabel: 'Chest',
  },
  {
    id: 'shoulders',
    source: require('../../assets/images/highlighted-diagrams/shouldershighlighted.png'),
    labels: ['Front Delts', 'Side Delts', 'Rear Delts', 'Rotator Cuff'],
    groupLabel: 'Shoulders',
  },
  {
    id: 'back',
    source: require('../../assets/images/highlighted-diagrams/backhighlighted.png'),
    labels: ['Lats', 'Upper Back', 'Lower Back', 'Teres Major'],
    groupLabel: 'Back',
  },
  {
    id: 'traps',
    source: require('../../assets/images/highlighted-diagrams/trapshighlighted.png'),
    labels: ['Traps', 'Upper Traps', 'Neck'],
    groupLabel: 'Traps',
  },
  {
    id: 'biceps',
    source: require('../../assets/images/highlighted-diagrams/bicepshighlighted.png'),
    labels: ['Biceps', 'Brachialis'],
    groupLabel: 'Biceps',
  },
  {
    id: 'triceps',
    source: require('../../assets/images/highlighted-diagrams/tricepshighlighted.png'),
    labels: ['Triceps'],
    groupLabel: 'Triceps',
  },
  {
    id: 'forearms',
    source: require('../../assets/images/highlighted-diagrams/forearmshighlighted.png'),
    labels: ['Forearms'],
    groupLabel: 'Forearms',
  },
  {
    id: 'abs',
    source: require('../../assets/images/highlighted-diagrams/abshighlighted.png'),
    labels: ['Abs', 'Obliques', 'Core'],
    groupLabel: 'Abs',
  },
  {
    id: 'quads',
    source: require('../../assets/images/highlighted-diagrams/quadshighlighted.png'),
    labels: ['Quads', 'Hip Flexors'],
    groupLabel: 'Quads',
  },
  {
    id: 'hamstrings',
    source: require('../../assets/images/highlighted-diagrams/hamstringshighlighted.png'),
    labels: ['Hamstrings'],
    groupLabel: 'Hamstrings',
  },
  {
    id: 'glutes',
    source: require('../../assets/images/highlighted-diagrams/gluteshighlighted.png'),
    labels: ['Glutes', 'Abductors'],
    groupLabel: 'Glutes',
  },
  {
    id: 'calves',
    source: require('../../assets/images/highlighted-diagrams/calveshighlighted.png'),
    labels: ['Calves'],
    groupLabel: 'Calves',
  },
  {
    id: 'adductors',
    source: require('../../assets/images/highlighted-diagrams/adductorshighlighted.png'),
    labels: ['Adductors'],
    groupLabel: 'Adductors',
  },
];

/**
 * @param {string[]} muscles Display labels from getMusclesForSplitDayEntry (same strings as split planner).
 * @returns {{ id: string; source: number; groupLabel: string }[]} Stable order, one row per body area.
 */
export function getOrderedMuscleHighlightChips(muscles) {
  const set = new Set((muscles ?? []).map((m) => String(m)));
  const out = [];
  for (let i = 0; i < HIGHLIGHT_ICON_GROUPS.length; i += 1) {
    const { id, source, labels, groupLabel } = HIGHLIGHT_ICON_GROUPS[i];
    const hit = labels.some((l) => set.has(l));
    if (hit) out.push({ id, source, groupLabel });
  }
  return out;
}

/**
 * Highlight PNG for a single muscle label (e.g. first entry in `primaryMuscles` from the exercise DB).
 * @param {string | undefined | null} muscleLabel
 * @returns {number | null} `require()` asset id, or null when no diagram exists for that label.
 */
export function getHighlightIconSourceForMuscleLabel(muscleLabel) {
  const chip = getHighlightChipForMuscleLabel(muscleLabel);
  return chip?.source ?? null;
}

/**
 * @param {string | undefined | null} muscleLabel
 * @returns {{ source: number; groupLabel: string } | null}
 */
export function getHighlightChipForMuscleLabel(muscleLabel) {
  if (!muscleLabel || typeof muscleLabel !== 'string') return null;
  const t = muscleLabel.trim();
  for (let i = 0; i < HIGHLIGHT_ICON_GROUPS.length; i += 1) {
    const g = HIGHLIGHT_ICON_GROUPS[i];
    if (g.labels.some((l) => l === t)) {
      return { source: g.source, groupLabel: g.groupLabel };
    }
  }
  return null;
}

/**
 * @param {string} movementName
 * @param {Record<string, { primaryMuscles?: string[], secondaryMuscles?: string[] }>} exerciseLookup
 * @param {string} [fallbackMuscle]
 * @returns {{ source: number; groupLabel: string } | null}
 */
export function getHighlightChipForMovement(movementName, exerciseLookup, fallbackMuscle) {
  if (!movementName || typeof movementName !== 'string') return null;
  const meta = exerciseLookup?.[movementName.trim().toLowerCase()];
  const primary = Array.isArray(meta?.primaryMuscles) ? meta.primaryMuscles : [];
  for (let i = 0; i < primary.length; i += 1) {
    const chip = getHighlightChipForMuscleLabel(primary[i]);
    if (chip) return chip;
  }
  const secondary = Array.isArray(meta?.secondaryMuscles) ? meta.secondaryMuscles : [];
  for (let i = 0; i < secondary.length; i += 1) {
    const chip = getHighlightChipForMuscleLabel(secondary[i]);
    if (chip) return chip;
  }
  return getHighlightChipForMuscleLabel(fallbackMuscle);
}

/**
 * Highlight chip image for a logged movement (uses exercise DB primary, then secondary muscles).
 * @param {string} movementName
 * @param {Record<string, { primaryMuscles?: string[], secondaryMuscles?: string[] }>} exerciseLookup
 * @returns {number | null}
 */
export function getHighlightIconForMovement(movementName, exerciseLookup) {
  if (!movementName || typeof movementName !== 'string') return null;
  const meta = exerciseLookup?.[movementName.trim().toLowerCase()];
  if (!meta) return null;

  const primary = Array.isArray(meta.primaryMuscles) ? meta.primaryMuscles : [];
  for (let i = 0; i < primary.length; i += 1) {
    const src = getHighlightIconSourceForMuscleLabel(primary[i]);
    if (src) return src;
  }

  const secondary = Array.isArray(meta.secondaryMuscles) ? meta.secondaryMuscles : [];
  for (let i = 0; i < secondary.length; i += 1) {
    const src = getHighlightIconSourceForMuscleLabel(secondary[i]);
    if (src) return src;
  }

  return null;
}
