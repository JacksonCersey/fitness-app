import { useEffect } from 'react';

/** List-picked bodyweight exercises: focus reps so you can log sets without touching weight first. */
export function useBodyweightRepsAutofocus({
  currentScreen,
  useCustomMovement,
  selectedMovement,
  exerciseLookup,
  notepadRepsRef,
}) {
  useEffect(() => {
    if (currentScreen !== 'workout') return;
    if (useCustomMovement) return;
    const name = (selectedMovement ?? '').trim();
    if (!name) return;
    if (!exerciseLookup[name.toLowerCase()]?.bodyweightOnly) return;
    const frameId = requestAnimationFrame(() => {
      notepadRepsRef.current?.focus();
    });
    return () => cancelAnimationFrame(frameId);
  }, [selectedMovement, currentScreen, useCustomMovement, exerciseLookup, notepadRepsRef]);
}
