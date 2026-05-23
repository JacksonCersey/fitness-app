/**
 * Active workout list uses unique slot ids so the same exercise can appear twice
 * with separate logged sets. History still stores setsByMovement keyed by exercise name.
 */

export function createWorkoutSlotId() {
  return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
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
