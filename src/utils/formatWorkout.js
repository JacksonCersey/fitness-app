// Converts seconds to mm:ss format (example: 125 -> "02:05")
export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Workout header timer: hours : minutes : seconds (example: 3665 -> "1:01:05"). */
export function formatWorkoutTimerHms(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function isBodyweightOnlyExercise(movementName, exerciseLookup) {
  if (!movementName || typeof movementName !== 'string') return false;
  const meta = exerciseLookup[movementName.trim().toLowerCase()];
  return Boolean(meta?.bodyweightOnly);
}

export function formatWorkoutSetSummaryText(movementName, setItem, exerciseLookup) {
  const wLb = Number(setItem?.weight ?? 0);
  const useBwLabel = isBodyweightOnlyExercise(movementName, exerciseLookup) && wLb === 0;
  const loadPart = useBwLabel ? '· body weight' : `@ ${setItem.weight} lb`;
  return `${setItem.reps} reps ${loadPart} (${formatTime(setItem.elapsedSeconds)})`;
}
