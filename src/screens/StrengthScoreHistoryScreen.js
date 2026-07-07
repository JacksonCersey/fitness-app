import React, { memo } from 'react';
import { Animated, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useGameTheme, useStyles } from '../app/context/ThemeStylesContext';
import StrengthScoreHistoryChart from '../components/progress/StrengthScoreHistoryChart';

/**
 * @param {{
 *   screenTransitionOpacity: import('react-native').Animated.Value;
 *   onBack: () => void;
 *   summary: import('../data/strengthScore').StrengthScoreSummary | null;
 * }} props
 */
function StrengthScoreHistoryScreen({ screenTransitionOpacity, onBack, summary }) {
  const styles = useStyles();
  const theme = useGameTheme();

  const trend =
    summary?.trendDelta != null
      ? summary.trendDelta > 0.5
        ? `Up ${summary.trendDelta.toFixed(1)} recently`
        : summary.trendDelta < -0.5
          ? `Down ${Math.abs(summary.trendDelta).toFixed(1)} recently`
          : 'Holding steady'
      : null;

  return (
    <SafeAreaView style={styles.menuHomeShell}>
      <Animated.View style={[styles.screenFadeContainer, { opacity: screenTransitionOpacity }]}>
        <ScrollView
          style={styles.profileScrollOuter}
          contentContainerStyle={[styles.profileScrollContent, { paddingBottom: 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeaderRow}>
            <TouchableOpacity
              style={styles.profileCloseInlineButton}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <Text style={[styles.workoutCloseButtonText, { color: theme.navBack }]}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.menuSubscreenNavTitle}>Strength Score</Text>
          </View>

          <View style={styles.progressStrengthHistorySummaryCard}>
            <Text style={styles.progressStrengthHistorySummaryValue}>
              {summary?.hasData ? summary.overallScore : '—'}
            </Text>
            <Text style={styles.progressStrengthHistorySummaryLabel}>
              {summary?.hasData ? summary.levelLabel : 'No score yet'}
            </Text>
            {trend ? <Text style={styles.progressStrengthHistorySummaryTrend}>{trend}</Text> : null}
          </View>

          <View style={styles.progressStrengthHistoryChartCard}>
            <StrengthScoreHistoryChart
              points={summary?.overallScoreHistory ?? []}
              lineColor={theme.navAccent}
              axisColor={theme.borderFaint}
              textColor={theme.textMuted}
              pointColor={theme.navAccent}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(StrengthScoreHistoryScreen);
