import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { getSplitEntryForDate, prioritizeMovementsForSplitDay } from '../../utils/homeDashboard';
import { getRecentWorkoutAverageWeightsForMovement } from '../../utils/movementSetHistory';
import MovementHistoryCard from '../movements/MovementHistoryCard';

/**
 * @param {{
 *   selectedDate: Date;
 *   weeklySplitPlan: { days: unknown[] } | null | undefined;
 *   weekPlanDayOverrides?: { weekKey?: string; daySourceByPlanIndex?: number[] } | null;
 *   workoutHistory: unknown[];
 *   exerciseLookup: Record<string, unknown>;
 * }} props
 */
function HomeMovementList({
  selectedDate,
  weeklySplitPlan,
  weekPlanDayOverrides,
  workoutHistory,
  exerciseLookup,
}) {
  const styles = useStyles();

  const dayEntry = useMemo(
    () => getSplitEntryForDate(weeklySplitPlan, selectedDate, weekPlanDayOverrides),
    [weekPlanDayOverrides, weeklySplitPlan, selectedDate],
  );

  const rows = useMemo(
    () => prioritizeMovementsForSplitDay(workoutHistory, dayEntry, exerciseLookup, 10),
    [workoutHistory, dayEntry, exerciseLookup],
  );

  const weightAveragesByMovement = useMemo(() => {
    /** @type {Record<string, number[]>} */
    const next = {};
    for (let i = 0; i < rows.length; i += 1) {
      const movement = rows[i].movement;
      next[movement] = getRecentWorkoutAverageWeightsForMovement(movement, workoutHistory, 8);
    }
    return next;
  }, [rows, workoutHistory]);

  if (rows.length === 0) {
    return (
      <View style={styles.homeMovementSection}>
        <Text style={styles.homeMovementSectionTitle}>Movements</Text>
        <View style={styles.homeEmptyMovements}>
          <Text style={styles.homeEmptyMovementsText}>
            Log workouts to see your movements here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.homeMovementSection}>
      <Text style={styles.homeMovementSectionTitle}>Movements</Text>
      {rows.map((row) => (
        <MovementHistoryCard
          key={row.movement}
          movement={row.movement}
          primaryMuscle={row.primaryMuscle}
          summary={row.summary}
          exerciseLookup={exerciseLookup}
          weightAverages={weightAveragesByMovement[row.movement] ?? []}
          emptyHistoryText="Finish a workout with this movement to see your max and weight trend here."
        />
      ))}
    </View>
  );
}

export default memo(HomeMovementList);
