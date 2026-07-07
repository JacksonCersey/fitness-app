import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';
import StrengthScoreSparkline from './StrengthScoreSparkline';

/**
 * Compact strength score header for the Progress Overview tab.
 * @param {{
 *   summary: import('../../data/strengthScore').StrengthScoreSummary | null,
 *   onOpenStrengthHistory?: () => void,
 * }} props
 */
function ProgressStrengthScoreOverview({ summary, onOpenStrengthHistory }) {
  const styles = useStyles();
  if (!summary) return null;

  const prCount = summary.lastWorkoutHadPr ? 1 : 0;

  return (
    <View style={styles.progressStrengthOverviewCard}>
      <View style={styles.progressStrengthOverviewHeaderRow}>
        <Text style={styles.progressStrengthOverviewTitle}>Strength Score</Text>
        {onOpenStrengthHistory ? (
          <TouchableOpacity
            style={styles.progressStrengthOverviewMovementsBtn}
            onPress={onOpenStrengthHistory}
            accessibilityRole="button"
            accessibilityLabel="View strength score history">
            <Text style={styles.progressStrengthOverviewMovementsBtnText}>›</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.progressStrengthOverviewBodyRow}>
        {summary.hasData ? (
          <>
            <Text style={styles.progressStrengthOverviewValue}>{summary.overallScore}</Text>
            <View style={styles.progressStrengthOverviewRightCol}>
              <StrengthScoreSparkline
                scores={summary.recentOverallScores}
                trendDelta={summary.trendDelta}
              />
              <View style={styles.progressStrengthOverviewPrCol}>
                <View style={styles.progressStrengthOverviewPrRow}>
                  <Text style={styles.progressStrengthOverviewPrArrow}>↑</Text>
                  <Text style={styles.progressStrengthOverviewPrValue}>{prCount}</Text>
                </View>
                <Text style={styles.progressStrengthOverviewPrLabel}>new pr</Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.progressStrengthOverviewEmptyText}>
            Complete a workout to see your strength score.
          </Text>
        )}
      </View>
    </View>
  );
}

export default memo(ProgressStrengthScoreOverview);
