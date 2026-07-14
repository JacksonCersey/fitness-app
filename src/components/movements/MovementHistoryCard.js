import React, { memo, useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';
import {
  getExerciseDiagramPanelCount,
  getExerciseDiagramSource,
} from '../../utils/exerciseDiagrams';
import { formatRecentSetLine, getMovementMaxDisplay } from '../../utils/movementSetHistory';
import { getHighlightChipForMovement } from '../../utils/splitDayHighlightIcons';
import ExerciseDiagramIcon from '../ExerciseDiagramIcon';
import MovementWeightSparkline from './MovementWeightSparkline';

/**
 * @param {{
 *   movement: string;
 *   primaryMuscle?: string;
 *   summary?: import('../../utils/movementSetHistory').MovementHistorySummary | null;
 *   exerciseLookup: Record<string, unknown>;
 *   targetSets?: number | null;
 *   targetReps?: number | null;
 *   showImagePlaceholder?: boolean;
 *   emptyHistoryText?: string;
 *   weightAverages?: number[] | null;
 * }} props
 */
function MovementHistoryCard({
  movement,
  primaryMuscle,
  summary,
  exerciseLookup,
  targetSets = null,
  targetReps = null,
  showImagePlaceholder = false,
  emptyHistoryText = 'Finish a workout with this movement to see your max and recent sets here.',
  weightAverages = null,
}) {
  const styles = useStyles();
  const maxDisplay = summary ? getMovementMaxDisplay(summary, exerciseLookup) : null;
  const muscleChip = useMemo(
    () => getHighlightChipForMovement(movement, exerciseLookup, primaryMuscle),
    [movement, primaryMuscle, exerciseLookup],
  );
  const diagramSource = useMemo(() => getExerciseDiagramSource(movement), [movement]);
  const diagramPanels = useMemo(() => getExerciseDiagramPanelCount(movement), [movement]);
  const recentLines = summary?.recentSets?.slice(0, 3) ?? [];
  const hasTargetLine = Number(targetSets) > 0 && Number(targetReps) > 0;
  const showSparkline = Array.isArray(weightAverages);
  const showDiagram = Boolean(diagramSource) || showImagePlaceholder;

  return (
    <View style={styles.homeMovementCard}>
      <View style={styles.homeMovementCardTop}>
        {showDiagram ? (
          <View style={styles.homeMovementImagePlaceholder}>
            {diagramSource ? (
              <ExerciseDiagramIcon source={diagramSource} size={48} panels={diagramPanels} />
            ) : muscleChip ? (
              <>
                <Image source={muscleChip.source} style={styles.homeMovementPlaceholderIcon} />
                <Text style={styles.homeMovementPlaceholderText}>image</Text>
              </>
            ) : (
              <Text style={styles.homeMovementPlaceholderText}>image</Text>
            )}
          </View>
        ) : muscleChip ? (
          <View style={styles.homeMovementChipWell}>
            <Image source={muscleChip.source} style={styles.homeMovementChipIcon} />
          </View>
        ) : (
          <View style={styles.homeMovementChipWell} />
        )}
        <View style={styles.homeMovementTextColumn}>
          <Text style={styles.homeMovementTitle} numberOfLines={2}>
            {movement}
          </Text>
          {hasTargetLine ? (
            <Text style={styles.homeMovementTargetLine}>
              {targetSets} sets × {targetReps} reps
            </Text>
          ) : null}
        </View>
      </View>
      {showSparkline ? (
        <>
          {maxDisplay ? (
            <View style={styles.homeMovementMaxRow}>
              <Text style={styles.homeMovementMaxLabel}>{maxDisplay.label}</Text>
              <Text style={styles.homeMovementMaxValue}>
                {maxDisplay.primary}
                {maxDisplay.suffix ? ` ${maxDisplay.suffix}` : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.homeMovementEmptyText}>{emptyHistoryText}</Text>
          )}
          <View style={styles.homeMovementSparklineRow}>
            <MovementWeightSparkline averages={weightAverages} />
          </View>
        </>
      ) : (
        <>
          {maxDisplay ? (
            <View style={styles.homeMovementMaxRow}>
              <Text style={styles.homeMovementMaxLabel}>{maxDisplay.label}</Text>
              <Text style={styles.homeMovementMaxValue}>
                {maxDisplay.primary}
                {maxDisplay.suffix ? ` ${maxDisplay.suffix}` : ''}
              </Text>
            </View>
          ) : null}
          {recentLines.length > 0 ? (
            recentLines.map((setItem, idx) => (
              <Text key={`${movement}-${setItem.sortKey}-${idx}`} style={styles.homeMovementRecentLine}>
                {formatRecentSetLine(setItem, movement, exerciseLookup)}
              </Text>
            ))
          ) : (
            <Text style={styles.homeMovementEmptyText}>{emptyHistoryText}</Text>
          )}
        </>
      )}
    </View>
  );
}

export default memo(MovementHistoryCard);
