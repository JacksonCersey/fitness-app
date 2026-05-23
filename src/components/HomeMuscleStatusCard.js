import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import BackMuscleDiagramSvg from '../../components/BackMuscleDiagramSvg';
import FrontMuscleDiagramSvg from '../../components/FrontMuscleDiagramSvg';
import { MUSCLE_RECOVERY_STATUS_COLORS } from '../../data/workoutMuscleHeat';
import { styles } from '../styles';
import { computeMuscleRecoveryStatusBySlug } from '../utils/muscleRecoveryStatus';

const DIAGRAM_HEIGHT = 156;

function LegendSwatch({ color, label }) {
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
  const statusBySlug = useMemo(
    () => computeMuscleRecoveryStatusBySlug(workoutHistory, exerciseLookup),
    [workoutHistory, exerciseLookup],
  );

  return (
    <View style={styles.dashboardMuscleStatusCard}>
      <Text style={styles.dashboardMuscleStatusTitle}>Muscle status</Text>
      <View style={styles.dashboardMuscleStatusLegendRow}>
        <LegendSwatch color={MUSCLE_RECOVERY_STATUS_COLORS.rested} label="Ready" />
        <LegendSwatch color={MUSCLE_RECOVERY_STATUS_COLORS.moderate} label="Moderate" />
        <LegendSwatch color={MUSCLE_RECOVERY_STATUS_COLORS.fatigued} label="Fatigued" />
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
