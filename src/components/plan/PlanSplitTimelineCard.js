import React, { memo, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BackMuscleDiagramSvg from '../../../components/BackMuscleDiagramSvg';
import FrontMuscleDiagramSvg from '../../../components/FrontMuscleDiagramSvg';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { getMusclesForSplitDayEntry } from '../../data/weeklySplitPlanner';
import { isDefaultWorkoutPlan } from '../../data/workoutPlans';
import { muscleActivationFromDisplayLabels } from '../../utils/muscleActivationFromLabels';

const MINI_H = 52;

/**
 * Collect primary muscle labels from a workout plan's exercises.
 * Falls back to split-day preview muscles when the plan has none.
 * @param {{ exercises?: { movement?: string }[] } | null | undefined} workoutPlan
 * @param {{ type: string; mixedMuscles?: string[] } | null | undefined} dayEntry
 * @param {Record<string, { primaryMuscles?: string[] }>| null | undefined} exerciseLookup
 * @returns {string[]}
 */
export function getPrimaryMusclesForPlan(workoutPlan, dayEntry, exerciseLookup) {
  const fromExercises = [];
  const seen = new Set();
  const exercises = Array.isArray(workoutPlan?.exercises) ? workoutPlan.exercises : [];

  for (let i = 0; i < exercises.length; i += 1) {
    const name = String(exercises[i]?.movement || '').trim();
    if (!name) continue;
    const meta = exerciseLookup?.[name] ?? exerciseLookup?.[name.toLowerCase()];
    const primaries = Array.isArray(meta?.primaryMuscles) ? meta.primaryMuscles : [];
    for (let j = 0; j < primaries.length; j += 1) {
      const label = String(primaries[j] || '').trim();
      if (!label || seen.has(label)) continue;
      seen.add(label);
      fromExercises.push(label);
    }
  }

  if (fromExercises.length > 0) return fromExercises;
  return getMusclesForSplitDayEntry(dayEntry);
}

function PlanTimelineMuscleChart({ muscles }) {
  const styles = useStyles();
  const activation = useMemo(() => muscleActivationFromDisplayLabels(muscles), [muscles]);

  if (!muscles || muscles.length === 0) {
    return (
      <View style={styles.planTimelineMuscleWell}>
        <Text style={styles.planTimelineMusclePlaceholder}>muscle{'\n'}chart</Text>
      </View>
    );
  }

  return (
    <View style={styles.planTimelineMuscleWell}>
      <View style={styles.planTimelineMuscleDiagrams}>
        <View style={styles.planTimelineMuscleHalf}>
          <FrontMuscleDiagramSvg activationBySlug={activation} height={MINI_H} />
        </View>
        <View style={styles.planTimelineMuscleHalf}>
          <BackMuscleDiagramSvg activationBySlug={activation} height={MINI_H} />
        </View>
      </View>
    </View>
  );
}

function PlanSplitTimelineCard({
  isRest = false,
  workoutPlan,
  dayEntry,
  exerciseLookup,
  exerciseCount,
  completionCount,
  onPressMore,
}) {
  const styles = useStyles();
  const isDefault = !isRest && isDefaultWorkoutPlan(workoutPlan);
  const title = isRest ? 'Rest Day' : workoutPlan?.name ?? 'Workout';
  const subtitle = isRest ? 'no workout planned' : isDefault ? 'default workout' : 'custom workout';
  const muscles = useMemo(
    () => (isRest ? [] : getPrimaryMusclesForPlan(workoutPlan, dayEntry, exerciseLookup)),
    [isRest, workoutPlan, dayEntry, exerciseLookup],
  );

  return (
    <View style={[styles.planTimelineCard, isRest && styles.planTimelineCardRest]}>
      <View style={styles.planTimelineCardHeader}>
        <View style={styles.planTimelineCardHeaderText}>
          <Text style={styles.planTimelineCardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.planTimelineCardMeta}>{subtitle}</Text>
        </View>
        {!isRest ? (
          <TouchableOpacity
            style={styles.planTimelineSwapButton}
            onPress={onPressMore}
            accessibilityRole="button"
            accessibilityLabel={`Swap workout for ${title}`}>
            <Text style={styles.planTimelineSwapButtonText}>Swap +</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.planTimelineCardBody}>
        {isRest ? (
          <View style={styles.planTimelineMuscleWell}>
            <Text style={styles.planTimelineMusclePlaceholder}>rest</Text>
          </View>
        ) : (
          <PlanTimelineMuscleChart muscles={muscles} />
        )}
        <View style={styles.planTimelineStats}>
          <Text style={[styles.planTimelineStatLine, isRest && styles.planTimelineStatLineMuted]}>
            {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
          </Text>
          <Text style={[styles.planTimelineStatLine, isRest && styles.planTimelineStatLineMuted]}>
            {completionCount} completion{completionCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default memo(PlanSplitTimelineCard);
