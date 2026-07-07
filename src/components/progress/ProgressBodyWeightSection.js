import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import WeightProgressChart from '../../../components/WeightProgressChart';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';

/**
 * @param {{
 *   openWeightLogModal: () => void;
 *   openWeightLogModalForEdit: (entry: { id: string; dateISO?: string; weightLb?: number }) => void;
 *   historyWeightChartPoints: Array<{ label: string; value: number; timestamp?: number }>;
 *   historyAllWeightLogsSorted: Array<{ id: string; dateISO?: string; weightLb?: number }>;
 *   handleDeleteWeightLogEntry: (id: string) => void;
 * }} props
 */
function ProgressBodyWeightSection({
  openWeightLogModal,
  openWeightLogModalForEdit,
  historyWeightChartPoints,
  historyAllWeightLogsSorted,
  handleDeleteWeightLogEntry,
}) {
  const styles = useStyles();
  const theme = useGameTheme();

  return (
    <View style={styles.progressBodyWeightSection}>
      <Text style={styles.progressBodySectionTitle}>Weight</Text>

      <View style={styles.progressBodyWeightCard}>
        <View style={styles.progressBodyWeightCardHeader}>
          <Text style={styles.progressBodyWeightCardTitle}>Graph</Text>
          <TouchableOpacity
            style={styles.progressBodyWeightAddBtn}
            onPress={openWeightLogModal}
            accessibilityRole="button"
            accessibilityLabel="Add weight log">
            <Text style={styles.progressBodyWeightAddBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <WeightProgressChart
          points={historyWeightChartPoints}
          lineColor={theme.navAccent}
          axisColor={theme.borderFaint}
          textColor={theme.textMuted}
          pointColor={theme.navAccent}
          showCaption={false}
        />
      </View>

      <View style={styles.progressBodyWeightCard}>
        <Text style={styles.progressBodyWeightCardTitle}>Entries</Text>
        <View style={styles.progressBodyWeightEntriesWrap}>
          {historyAllWeightLogsSorted.length === 0 ? (
            <Text style={styles.progressBodyWeightEmptyText}>No weight entries yet.</Text>
          ) : (
            historyAllWeightLogsSorted.map((entry) => {
              const d = new Date(entry.dateISO);
              const dLabel = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
              return (
                <View key={entry.id} style={styles.progressBodyWeightEntryRow}>
                  <View style={styles.progressBodyWeightEntryTextBlock}>
                    <Text style={styles.progressBodyWeightEntryValue}>
                      {Math.round(Number(entry.weightLb) * 10) / 10} lb
                    </Text>
                    <Text style={styles.progressBodyWeightEntryDate}>{dLabel}</Text>
                  </View>
                  <View style={styles.progressBodyWeightEntryActions}>
                    <TouchableOpacity
                      onPress={() => openWeightLogModalForEdit(entry)}
                      style={styles.progressBodyWeightEntryActionBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit weight entry from ${dLabel}`}>
                      <Text style={styles.progressBodyWeightEntryEditText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteWeightLogEntry(entry.id)}
                      style={styles.progressBodyWeightEntryActionBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete weight entry from ${dLabel}`}>
                      <Text style={styles.progressBodyWeightEntryDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}

export default memo(ProgressBodyWeightSection);
