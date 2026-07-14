import React, { memo } from 'react';
import { Image, Text, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { formatVolumeCompact } from '../../../utils/workoutStats';

/**
 * @param {{
 *   strengthScore: number | null | undefined;
 *   workoutsCompleted: number;
 *   lifetimeVolumeLb: number;
 *   hasStrengthData?: boolean;
 * }} props
 */
function HomeStatsBar({ strengthScore, workoutsCompleted, lifetimeVolumeLb, hasStrengthData }) {
  const styles = useStyles();

  const strengthDisplay =
    hasStrengthData && strengthScore != null && Number.isFinite(strengthScore)
      ? String(Math.round(strengthScore))
      : '—';
  const workoutsDisplay = workoutsCompleted > 0 ? String(workoutsCompleted) : '—';
  const volumeDisplay = lifetimeVolumeLb > 0 ? formatVolumeCompact(lifetimeVolumeLb) : '—';

  return (
    <View style={styles.homeStatsBar}>
      <View style={styles.homeStatCell}>
        <View style={styles.homeStatCellTop}>
          <View style={styles.homeStatIconWell}>
            <Image
              source={require('../../../assets/images/icons/targetlogo.png')}
              style={styles.homeStatIcon}
            />
          </View>
          <Text style={styles.homeStatValue}>{strengthDisplay}</Text>
        </View>
        <Text style={styles.homeStatLabel}>Strength Score</Text>
      </View>
      <View style={styles.homeStatCell}>
        <View style={styles.homeStatCellTop}>
          <View style={styles.homeStatIconWell}>
            <Text style={styles.homeStatCheckMark}>✓</Text>
          </View>
          <Text style={styles.homeStatValue}>{workoutsDisplay}</Text>
        </View>
        <Text style={styles.homeStatLabel}>Workouts</Text>
      </View>
      <View style={styles.homeStatCell}>
        <View style={styles.homeStatCellTop}>
          <View style={styles.homeStatIconWell}>
            <Image
              source={require('../../../assets/images/icons/weighticon.png')}
              style={styles.homeStatIcon}
            />
          </View>
          <Text style={styles.homeStatValue}>{volumeDisplay}</Text>
        </View>
        <Text style={styles.homeStatLabel}>Total Weight</Text>
      </View>
    </View>
  );
}

export default memo(HomeStatsBar);
