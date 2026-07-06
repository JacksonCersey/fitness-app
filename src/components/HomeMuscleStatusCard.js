import React, { memo, useMemo } from 'react';
import { useStyles } from '../app/context/ThemeStylesContext';
import { Text, View } from 'react-native';
import BackMuscleDiagramSvg from '../../components/BackMuscleDiagramSvg';
import FrontMuscleDiagramSvg from '../../components/FrontMuscleDiagramSvg';
import { MUSCLE_RECOVERY_STATUS_COLORS } from '../../data/workoutMuscleHeat';
import { computeMuscleRecoveryStatusBySlug } from '../utils/muscleRecoveryStatus';

const DIAGRAM_HEIGHT = 156;

function LegendSwatch({ color, label }) {
  const styles = useStyles();
  return (
    <View style={styles.dashboardMuscleStatusLegendItem}>
      <View style={[styles.dashboardMuscleStatusLegendDot, { backgroundColor: color }]} />
      <Text style={styles.dashboardMuscleStatusLegendLabel}>{label}</Text>
    </View>
  );
}

/**
 * @param {{ workoutHistory: unknown[]; exerciseLookup: Record<string, unknown> }} props
 */
function HomeMuscleStatusCard({ workoutHistory, exerciseLookup }) {
  const styles = useStyles();
  const statusBySlug = useMemo(
    () => computeMuscleRecoveryStatusBySlug(workoutHistory, exerciseLookup),
    [workoutHistory, exerciseLookup],
  );

  return (
    <View style={styles.dashboardMuscleStatusCard}>
      <Text style={styles.dashboardMuscleStatusTitle}>Muscle status</Text>
      <View style={styles.dashboardMuscleStatusLegendRow}>
        <LegendSwatch color={MUSCLE_RECOVERY_STATUS_COLORS.ready} label="Ready" />
        <LegendSwatch color={MUSCLE_RECOVERY_STATUS_COLORS.recovering} label="Recovering" />
        <LegendSwatch color={MUSCLE_RECOVERY_STATUS_COLORS.highFatigue} label="High Fatigue" />
      </View>
      <View style={styles.dashboardMuscleStatusDiagramsWrap}>
        <View style={styles.dashboardMuscleStatusDiagramHalf}>
          <FrontMuscleDiagramSvg statusBySlug={statusBySlug} height={DIAGRAM_HEIGHT} />
        </View>
        <View style={styles.dashboardMuscleStatusDiagramHalf}>
          <BackMuscleDiagramSvg statusBySlug={statusBySlug} height={DIAGRAM_HEIGHT} />
        </View>
      </View>
    </View>
  );
}

export default memo(HomeMuscleStatusCard);
