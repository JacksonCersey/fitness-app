import React, { memo } from 'react';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { Text, View } from 'react-native';

function StatCell({ label, value }) {
  const styles = useStyles();
  return (
    <View style={styles.profileStatCell}>
      <Text style={styles.profileStatLabel}>{label}</Text>
      <Text style={styles.profileStatValue}>{value}</Text>
    </View>
  );
}

function ProfileStatsSummary({ workoutsLogged, streakWeeks, latestWeightLabel, bmiLabel }) {
  const styles = useStyles();
  const streakLabel = `${streakWeeks} wk${streakWeeks === 1 ? '' : 's'}`;

  return (
    <View style={styles.profileCard}>
      <Text style={styles.profileStatsCardTitle}>At a glance</Text>
      <View style={styles.profileStatsGrid}>
        <StatCell label="Workouts logged" value={String(workoutsLogged)} />
        <StatCell label="Training streak" value={streakLabel} />
        <StatCell label="Latest weight" value={latestWeightLabel} />
        <StatCell label="BMI" value={bmiLabel} />
      </View>
    </View>
  );
}

export default memo(ProfileStatsSummary);
