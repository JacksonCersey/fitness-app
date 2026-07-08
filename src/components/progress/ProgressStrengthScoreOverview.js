import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';
import StrengthScoreSparkline from './StrengthScoreSparkline';

/**
 * Compact strength score header for the Progress Overview tab.
 * @param {{
 *   summary: import('../../data/strengthScore').StrengthScoreSummary | null,
 * }} props
 */
function ProgressStrengthScoreOverview({ summary }) {
  const styles = useStyles();
  if (!summary) return null;

  const prCount = summary.lastWorkoutHadPr ? 1 : 0;

  return (
    <View style={styles.progressStrengthOverviewCard}>
      <View style={styles.progressStrengthOverviewHeaderRow}>
        <Text style={styles.progressStrengthOverviewTitle}>Strength Score</Text>
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
