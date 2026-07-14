/**
 * Active workout list uses unique slot ids so the same exercise can appear twice
 * with separate logged sets. History still stores setsByMovement keyed by exercise name.
 */

export function createWorkoutSlotId() {
  return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Turn a planned workout's exercise list into active-workout slots.
 * @param {{ exercises?: { movement?: string }[] } | null | undefined} plan
 * @returns {{ id: string; name: string }[]}
 */
export function buildWorkoutSlotsFromPlan(plan) {
  const exercises = Array.isArray(plan?.exercises) ? plan.exercises : [];
  /** @type {{ id: string; name: string }[]} */
  const slots = [];
  for (let i = 0; i < exercises.length; i += 1) {
    const name = String(exercises[i]?.movement || '').trim();
    if (!name) continue;
    slots.push({ id: createWorkoutSlotId(), name });
  }
  return slots;
}

/**
 * @param {{ id: string; name: string }[]} order
 * @param {Record<string, unknown[]>} setsBySlot
 * @returns {Record<string, unknown[]>}
 */
export function mergeWorkoutSlotsToExerciseMap(order, setsBySlot) {
  /** @type {Record<string, unknown[]>} */
  const out = {};
  if (!Array.isArray(order) || !setsBySlot || typeof setsBySlot !== 'object') return out;

  for (let i = 0; i < order.length; i += 1) {
    const slot = order[i];
    if (!slot || typeof slot !== 'object') continue;
    const name = String(slot.name || '').trim();
    if (!name) continue;
    const id = slot.id;
    const sets = id != null ? setsBySlot[id] : null;
    if (!Array.isArray(sets) || sets.length === 0) continue;
    if (!out[name]) out[name] = [];
    for (let j = 0; j < sets.length; j += 1) {
      out[name].push(sets[j]);
    }
  }
  return out;
}
