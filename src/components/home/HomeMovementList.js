import React, { memo, useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { getSplitEntryForDate, prioritizeMovementsForSplitDay } from '../../utils/homeDashboard';
import { formatRecentSetLine, getMovementMaxDisplay } from '../../utils/movementSetHistory';
import { getHighlightChipForMovement } from '../../utils/splitDayHighlightIcons';

function HomeMovementRow({ row, exerciseLookup }) {
  const styles = useStyles();
  const maxDisplay = row.summary ? getMovementMaxDisplay(row.summary, exerciseLookup) : null;
  const muscleChip = useMemo(
    () => getHighlightChipForMovement(row.movement, exerciseLookup, row.primaryMuscle),
    [row.movement, row.primaryMuscle, exerciseLookup],
  );
  const recentLines = row.summary?.recentSets?.slice(0, 3) ?? [];

  return (
    <View style={styles.homeMovementCard}>
      <View style={styles.homeMovementCardTop}>
        {muscleChip ? (
          <View style={styles.homeMovementChipWell}>
            <Image source={muscleChip.source} style={styles.homeMovementChipIcon} />
          </View>
        ) : (
          <View style={styles.homeMovementChipWell} />
        )}
        <Text style={styles.homeMovementTitle} numberOfLines={2}>
          {row.movement}
        </Text>
      </View>
      {maxDisplay ? (
        <View style={styles.homeMovementMaxRow}>
          <Text style={styles.homeMovementMaxLabel}>{maxDisplay.label}</Text>
          <Text style={styles.homeMovementMaxValue}>
            {maxDisplay.primary}
            {maxDisplay.suffix ? ` ${maxDisplay.suffix}` : ''}
          </Text>
        </View>
      ) : null}
      {recentLines.map((setItem, idx) => (
        <Text key={`${setItem.sortKey}-${idx}`} style={styles.homeMovementRecentLine}>
          {formatRecentSetLine(setItem)}
        </Text>
      ))}
    </View>
  );
}

/**
 * @param {{
 *   selectedDate: Date;
 *   weeklySplitPlan: { days: unknown[] } | null | undefined;
 *   workoutHistory: unknown[];
 *   exerciseLookup: Record<string, unknown>;
 * }} props
 */
function HomeMovementList({ selectedDate, weeklySplitPlan, workoutHistory, exerciseLookup }) {
  const styles = useStyles();

  const dayEntry = useMemo(
    () => getSplitEntryForDate(weeklySplitPlan, selectedDate),
    [weeklySplitPlan, selectedDate],
  );

  const rows = useMemo(
    () => prioritizeMovementsForSplitDay(workoutHistory, dayEntry, exerciseLookup, 10),
    [workoutHistory, dayEntry, exerciseLookup],
  );

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
        <HomeMovementRow key={row.movement} row={row} exerciseLookup={exerciseLookup} />
      ))}
    </View>
  );
}

export default memo(HomeMovementList);
