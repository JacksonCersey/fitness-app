/**
 * Combines exercise activation maps with SVG diagram muscle labels (database names)
 * so the body diagrams can use green-shade intensity from activationToHex.
 */

import {
  MUSCLE_GROUPS,
  activationToHex,
  exerciseMuscleMap,
  getMuscleActivations,
} from './exerciseMuscleMap';
import { FRONT_SVG_PATH_MUSCLES, baseFillForPathId } from './frontSvgMuscleMap';
import { BACK_SVG_PATH_MUSCLES, baseFillForBackPathId } from './backSvgMuscleMap';

/** Database / diagram label → camelCase slug keys used in exerciseMuscleMap */
export const DISPLAY_LABEL_TO_SLUGS = {
  Chest: ['midChest', 'upperChest', 'lowerChest'],
  'Upper Chest': ['upperChest'],
  'Lower Chest': ['lowerChest'],
  'Front Delts': ['frontDelts'],
  'Side Delts': ['sideDelts'],
  'Rear Delts': ['rearDelts'],
  Biceps: ['biceps'],
  Brachialis: ['brachialis'],
  Forearms: ['forearms'],
  Triceps: ['triceps'],
  Abs: ['abs'],
  Obliques: ['obliques'],
  Core: ['abs', 'obliques'],
  'Hip Flexors': ['abs'],
  Quads: ['quads'],
  Calves: ['calves'],
  Adductors: ['adductors'],
  Glutes: ['glutes'],
  Hamstrings: ['hamstrings'],
  /** Hip abductors (no separate slug); heat uses glutes. */
  Abductors: ['glutes'],
  Lats: ['lats'],
  'Upper Back': ['upperBack'],
  'Lower Back': ['spinalErectors'],
  Traps: ['traps'],
  'Upper Traps': ['traps'],
  'Rotator Cuff': ['rearDelts', 'upperBack'],
  'Teres Major': ['lats'],
};

/** When an exercise has no detailed map, approximate primary / secondary load (0.1–1 scale). */
const SYNTH_PRIMARY = 0.62;
const SYNTH_SECONDARY = 0.38;

function maxActivationForDisplayLabel(activationBySlug, label) {
  const slugs = DISPLAY_LABEL_TO_SLUGS[label];
  if (!slugs || slugs.length === 0) return 0;
  let maxA = 0;
  for (let i = 0; i < slugs.length; i += 1) {
    const v = activationBySlug[slugs[i]] ?? 0;
    if (v > maxA) maxA = v;
  }
  return maxA;
}

/**
 * Merge activations from all logged movement names (max per muscle slug).
 * Uses exerciseMuscleMap when the name matches; otherwise falls back to EXERCISE_DATABASE
 * via exerciseLookup (primary / secondary synthetic values).
 */
export function aggregateWorkoutMuscleHeat(movementNames, exerciseLookup) {
  const maxBy = {};
  MUSCLE_GROUPS.forEach((g) => {
    maxBy[g] = 0;
  });

  movementNames.forEach((name) => {
    const detailed = exerciseMuscleMap[name];
    if (detailed) {
      const full = getMuscleActivations(name);
      MUSCLE_GROUPS.forEach((g) => {
        maxBy[g] = Math.max(maxBy[g], full[g] ?? 0);
      });
      return;
    }
    const db = exerciseLookup[name.toLowerCase()];
    if (!db) return;

    db.primaryMuscles.forEach((label) => {
      const slugs = DISPLAY_LABEL_TO_SLUGS[label];
      if (!slugs) return;
      slugs.forEach((s) => {
        maxBy[s] = Math.max(maxBy[s], SYNTH_PRIMARY);
      });
    });
    db.secondaryMuscles.forEach((label) => {
      const slugs = DISPLAY_LABEL_TO_SLUGS[label];
      if (!slugs) return;
      slugs.forEach((s) => {
        maxBy[s] = Math.max(maxBy[s], SYNTH_SECONDARY);
      });
    });
  });

  return maxBy;
}

/**
 * Sum muscle activation × set count for the active workout, then normalize per slug to 0–1
 * (strongest-hit muscle this session = 1) for diagram coloring.
 * @param {Record<string, unknown[]>} setsByMovement movement name → logged sets array
 * @param {Record<string, { primaryMuscles?: string[]; secondaryMuscles?: string[] }>} exerciseLookup lowercased keys
 * @returns {Record<string, number>}
 */
export function aggregateSessionMuscleHeatFromSets(setsByMovement, exerciseLookup) {
  /** @type {Record<string, number>} */
  const accumulated = {};
  MUSCLE_GROUPS.forEach((g) => {
    accumulated[g] = 0;
  });

  if (!setsByMovement || typeof setsByMovement !== 'object') {
    return accumulated;
  }

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

  const peak = Math.max(...MUSCLE_GROUPS.map((g) => accumulated[g]), 0);
  if (peak <= 0) {
    return accumulated;
  }

  /** @type {Record<string, number>} */
  const normalized = {};
  MUSCLE_GROUPS.forEach((g) => {
    normalized[g] = accumulated[g] / peak;
  });
  return normalized;
}

/** Map raw activation for coloring: unused stays 0; any use is at least 0.1 so it shows as a green tint. */
export function heatLevelForColor(raw) {
  if (raw <= 0) return 0;
  return Math.min(1, Math.max(0.1, raw));
}

function fillPathFromHeat(pathId, pathToLabels, activationBySlug, baseFill) {
  const labels = pathToLabels[pathId];
  if (!labels) return baseFill(pathId);
  let maxRaw = 0;
  for (let i = 0; i < labels.length; i += 1) {
    const a = maxActivationForDisplayLabel(activationBySlug, labels[i]);
    if (a > maxRaw) maxRaw = a;
  }
  if (maxRaw <= 0) return baseFill(pathId);
  return activationToHex(heatLevelForColor(maxRaw));
}

export function heatFillForFrontPath(pathId, activationBySlug) {
  return fillPathFromHeat(pathId, FRONT_SVG_PATH_MUSCLES, activationBySlug, baseFillForPathId);
}

export function heatFillForBackPath(pathId, activationBySlug) {
  return fillPathFromHeat(pathId, BACK_SVG_PATH_MUSCLES, activationBySlug, baseFillForBackPathId);
}

/** @typedef {'ready' | 'recovering' | 'highFatigue'} MuscleRecoveryStatus */

export const MUSCLE_RECOVERY_STATUS_COLORS = {
  ready: '#22C55E',
  recovering: '#94A3B8',
  highFatigue: '#EF4444',
};

const STATUS_RANK = { ready: 0, recovering: 1, highFatigue: 2 };

/**
 * @param {string[]} labels
 * @param {Record<string, MuscleRecoveryStatus>} statusBySlug
 * @returns {MuscleRecoveryStatus | null}
 */
function worstStatusForPathLabels(labels, statusBySlug) {
  if (!labels || labels.length === 0) return null;
  let worst = /** @type {MuscleRecoveryStatus | null} */ (null);
  for (let i = 0; i < labels.length; i += 1) {
    const slugs = DISPLAY_LABEL_TO_SLUGS[labels[i]];
    if (!slugs) continue;
    for (let j = 0; j < slugs.length; j += 1) {
      const st = statusBySlug[slugs[j]] ?? 'ready';
      if (worst === null || STATUS_RANK[st] > STATUS_RANK[worst]) worst = st;
    }
  }
  return worst;
}

/**
 * @param {string} pathId
 * @param {Record<string, string>} pathToLabels
 * @param {Record<string, MuscleRecoveryStatus>} statusBySlug
 * @param {(pathId: string) => string} baseFill
 */
function statusFillForPath(pathId, pathToLabels, statusBySlug, baseFill) {
  const labels = pathToLabels[pathId];
  if (!labels) return baseFill(pathId);
  const worst = worstStatusForPathLabels(labels, statusBySlug);
  if (!worst) return baseFill(pathId);
  return MUSCLE_RECOVERY_STATUS_COLORS[worst];
}

/** Darker silhouette / head fills for home muscle-status diagrams (vs default preview grays). */
const RECOVERY_FRONT_BASE_FILL = {
  path46: '#787D88',
  path48: '#6C717C',
  defaultMuscles: '#3A3D45',
};

const RECOVERY_BACK_BASE_FILL = {
  path50: '#787D88',
  path52: '#6C717C',
  path53: '#6C717C',
  path54: '#6C717C',
  defaultMuscles: '#3A3D45',
};

function recoveryBaseFillForFrontPathId(pathId) {
  if (RECOVERY_FRONT_BASE_FILL[pathId]) return RECOVERY_FRONT_BASE_FILL[pathId];
  return RECOVERY_FRONT_BASE_FILL.defaultMuscles;
}

function recoveryBaseFillForBackPathId(pathId) {
  if (RECOVERY_BACK_BASE_FILL[pathId]) return RECOVERY_BACK_BASE_FILL[pathId];
  return RECOVERY_BACK_BASE_FILL.defaultMuscles;
}

export function recoveryStatusFillForFrontPath(pathId, statusBySlug) {
  return statusFillForPath(pathId, FRONT_SVG_PATH_MUSCLES, statusBySlug, recoveryBaseFillForFrontPathId);
}

export function recoveryStatusFillForBackPath(pathId, statusBySlug) {
  return statusFillForPath(pathId, BACK_SVG_PATH_MUSCLES, statusBySlug, recoveryBaseFillForBackPathId);
}
