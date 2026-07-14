import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';

function formatTargetLine(exercise) {
  const sets = Number(exercise?.targetSets);
  const reps = Number(exercise?.targetReps);
  if (sets > 0 && reps > 0) return `${sets} sets × ${reps} reps`;
  if (sets > 0) return `${sets} set${sets === 1 ? '' : 's'}`;
  if (reps > 0) return `${reps} reps`;
  return null;
}

/**
 * Simple Plan day exercise summary (no previous-sets / history widgets).
 */
function PlanExerciseSummaryList({ exercises, emptyBody }) {
  const styles = useStyles();
  const list = Array.isArray(exercises) ? exercises : [];

  if (list.length === 0) {
    return (
      <View style={styles.planEmptyEmbedded}>
        <Text style={styles.planEmptyBody}>{emptyBody}</Text>
      </View>
    );
  }

  return (
    <View style={styles.planExerciseSummaryList}>
      {list.map((exercise, idx) => {
        const targetLine = formatTargetLine(exercise);
        return (
          <View
            key={`${exercise.movement}-${idx}`}
            style={styles.planExerciseSummaryRow}>
            <Text style={styles.planExerciseSummaryName} numberOfLines={2}>
              {exercise.movement}
            </Text>
            {targetLine ? (
              <Text style={styles.planExerciseSummaryMeta}>{targetLine}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export default memo(PlanExerciseSummaryList);
