import React, { memo } from 'react';
import { useGameTheme, useStyles } from '../app/context/ThemeStylesContext';
import { Animated, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import StreakRankPanel from '../components/StreakRankPanel';
import { MenuHomeWeekStrip } from '../components/targetsProgressShared';

function StreakScreen({
  screenTransitionOpacity,
  onBack,
  weeklyWorkoutsLoggedCount,
  weeklyStreakDays,
  weeklySplitPlan,
  consecutiveTrainingWeekStreak,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  return (
    <SafeAreaView style={styles.menuScreen}>
      <Animated.View style={[styles.screenFadeContainer, { opacity: screenTransitionOpacity }]}>
        <ScrollView
          style={styles.profileScrollOuter}
          contentContainerStyle={styles.profileScrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.menuGradientTopGlow} pointerEvents="none" />
          <View style={styles.menuGradientBottomGlow} pointerEvents="none" />

          <View style={styles.profileHeaderRow}>
            <TouchableOpacity
              style={styles.profileCloseInlineButton}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <Text style={[styles.workoutCloseButtonText, { color: theme.navBack }]}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.menuSubscreenNavTitle}>Streak & week</Text>
          </View>

          <StreakRankPanel consecutiveTrainingWeekStreak={consecutiveTrainingWeekStreak} />

          <View style={styles.profileCard}>
            <Text style={styles.menuMoreBodyText}>
              Each day with a saved workout shows the flame on your home week strip. This week you have logged{' '}
              <Text style={styles.menuMoreEmphasisInline}>{weeklyWorkoutsLoggedCount}</Text> workout
              {weeklyWorkoutsLoggedCount === 1 ? '' : 's'}.
            </Text>
            <MenuHomeWeekStrip weeklySplitPlan={weeklySplitPlan} weeklyStreakDays={weeklyStreakDays} />
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(StreakScreen);
