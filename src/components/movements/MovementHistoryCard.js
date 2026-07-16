import React, { memo, useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';
import {
  getExerciseDiagramPanelCount,
  getExerciseDiagramPanelIndex,
  getExerciseDiagramSource,
} from '../../utils/exerciseDiagrams';
import { formatRecentSetLine, getMovementMaxDisplay } from '../../utils/movementSetHistory';
import { getHighlightChipForMovement } from '../../utils/splitDayHighlightIcons';
import ExerciseDiagramIcon from '../ExerciseDiagramIcon';
import MovementWeightSparkline from './MovementWeightSparkline';

const DIAGRAM_SIZE = 64;

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
  showImagePlaceholder = true,
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
  const diagramPanelIndex = useMemo(() => getExerciseDiagramPanelIndex(movement), [movement]);
  const recentLines = summary?.recentSets?.slice(0, 3) ?? [];
  const hasTargetLine = Number(targetSets) > 0 && Number(targetReps) > 0;
  const showSparkline = Array.isArray(weightAverages);

  return (
    <View style={styles.homeMovementCard}>
      <View style={styles.homeMovementCardTop}>
        <View style={styles.homeMovementDiagramWrap}>
          <View style={styles.homeMovementDiagramBox}>
            {diagramSource ? (
              <ExerciseDiagramIcon
                source={diagramSource}
                size={DIAGRAM_SIZE - 8}
                panels={diagramPanels}
                panelIndex={diagramPanelIndex}
              />
            ) : showImagePlaceholder ? (
              <Text style={styles.homeMovementPlaceholderText}>image</Text>
            ) : null}
          </View>
          {muscleChip ? (
            <View
              style={styles.homeMovementMuscleBadge}
              accessibilityLabel={`Muscles worked: ${muscleChip.groupLabel}`}>
              <Image
                source={muscleChip.source}
                style={styles.homeMovementMuscleBadgeIcon}
                resizeMode="contain"
              />
            </View>
          ) : null}
        </View>

        <View style={styles.homeMovementTextColumn}>
          <Text style={styles.homeMovementTitle} numberOfLines={2}>
            {movement}
          </Text>
          {maxDisplay ? (
            <View style={styles.homeMovementMaxInline}>
              <Text style={styles.homeMovementMaxInlineLabel}>{maxDisplay.label}</Text>
              <Text style={styles.homeMovementMaxInlineValue}>
                {maxDisplay.primary}
                {maxDisplay.suffix ? ` ${maxDisplay.suffix}` : ''}
              </Text>
            </View>
          ) : null}
          {hasTargetLine ? (
            <Text style={styles.homeMovementTargetLine}>
              {targetSets} sets × {targetReps} reps
            </Text>
          ) : null}
        </View>
      </View>

      {showSparkline ? (
        <>
          {!maxDisplay ? (
            <Text style={styles.homeMovementEmptyText}>{emptyHistoryText}</Text>
          ) : null}
          <View style={styles.homeMovementSparklineRow}>
            <MovementWeightSparkline averages={weightAverages} />
          </View>
        </>
      ) : (
        <>
          {recentLines.length > 0 ? (
            recentLines.map((setItem, idx) => (
              <Text
                key={`${movement}-${setItem.sortKey}-${idx}`}
                style={styles.homeMovementRecentLine}>
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
