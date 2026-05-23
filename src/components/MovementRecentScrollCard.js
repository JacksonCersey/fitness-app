import React, { memo, useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { getMovementMaxDisplay } from '../utils/movementSetHistory';
import { getHighlightChipForMovement } from '../utils/splitDayHighlightIcons';
import { styles } from '../styles';

/**
 * Compact movement box for the horizontal “recently completed” strip.
 * @param {{
 *   row: import('../utils/movementCatalog').MovementCatalogRow,
 *   lastCompletedAtISO: string,
 *   exerciseLookup: Record<string, { bodyweightOnly?: boolean; primaryMuscles?: string[] }>,
 * }} props
 */
function MovementRecentScrollCard({ row, lastCompletedAtISO, exerciseLookup }) {
  const maxDisplay = row.summary ? getMovementMaxDisplay(row.summary, exerciseLookup) : null;
  const muscleChip = useMemo(
    () => getHighlightChipForMovement(row.movement, exerciseLookup, row.primaryMuscle),
    [row.movement, row.primaryMuscle, exerciseLookup],
  );

  const dateLabel = useMemo(() => {
    const d = new Date(lastCompletedAtISO);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, [lastCompletedAtISO]);

  return (
    <View style={styles.movementsRecentScrollCard}>
      {muscleChip ? (
        <View style={styles.movementsRecentScrollChip}>
          <View style={styles.movementsRecentScrollIconWell}>
            <Image source={muscleChip.source} style={styles.movementsRecentScrollIcon} resizeMode="contain" />
          </View>
          <Text style={styles.movementsRecentScrollChipLabel} numberOfLines={1}>
            {muscleChip.groupLabel}
          </Text>
        </View>
      ) : null}

      <Text style={styles.movementsRecentScrollTitle} numberOfLines={2}>
        {row.movement}
      </Text>

      {maxDisplay ? (
        <View style={styles.movementsRecentScrollMaxBox}>
          <Text style={styles.movementsRecentScrollMaxCaption}>{maxDisplay.label}</Text>
          <View style={styles.movementsRecentScrollMaxRow}>
            <Text style={styles.movementsRecentScrollMaxValue}>{maxDisplay.primary}</Text>
            <Text style={styles.movementsRecentScrollMaxUnit}>{maxDisplay.suffix}</Text>
          </View>
        </View>
      ) : null}

      {dateLabel ? <Text style={styles.movementsRecentScrollDate}>Last · {dateLabel}</Text> : null}
    </View>
  );
}

export default memo(MovementRecentScrollCard);
