import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
import { Text, TouchableOpacity, View } from 'react-native';
import { TargetsSplitWeekStrip } from './targetsProgressShared';
import WeeklySplitPlannerEditor from './WeeklySplitPlannerEditor';
import {
  TRAINING_DAYS_OPTIONS,
  buildPlanFromPreset,
  countWeeklySplitTrainingDays,
  detectPresetFromPlan,
  getPresetsForTrainingDays,
  weeklySplitPlanIsConfigured,
} from '../data/weeklySplitPlanner';

function WeeklySplitPlanBuilder({ weeklySplitPlan, onChangeWeeklySplitPlan, theme, hint }) {
  const styles = useStyles();
  const defaultTheme = useWorkoutTheme();
  const wt = theme ?? defaultTheme;

  const configured = weeklySplitPlanIsConfigured(weeklySplitPlan);
  const detectedPresetId = useMemo(() => detectPresetFromPlan(weeklySplitPlan), [weeklySplitPlan]);
  const initialDays = useMemo(() => {
    const count = countWeeklySplitTrainingDays(weeklySplitPlan);
    return count > 0 ? count : 3;
  }, [weeklySplitPlan]);

  const [selectedDays, setSelectedDays] = useState(initialDays);
  const [selectedPresetId, setSelectedPresetId] = useState(detectedPresetId);
  const [customizeOpen, setCustomizeOpen] = useState(() => configured && detectedPresetId == null);
  const userPickedPresetRef = useRef(false);

  useEffect(() => {
    if (userPickedPresetRef.current) return;
    const count = countWeeklySplitTrainingDays(weeklySplitPlan);
    if (count > 0) setSelectedDays(count);
    setSelectedPresetId(detectedPresetId);
    if (configured && detectedPresetId == null) setCustomizeOpen(true);
  }, [weeklySplitPlan, detectedPresetId, configured]);

  const presets = useMemo(() => getPresetsForTrainingDays(selectedDays), [selectedDays]);

  const handleSelectDays = useCallback((count) => {
    setSelectedDays(count);
    setSelectedPresetId(null);
    userPickedPresetRef.current = false;
  }, []);

  const handleSelectPreset = useCallback(
    (presetId) => {
      userPickedPresetRef.current = true;
      setSelectedPresetId(presetId);
      setCustomizeOpen(false);
      onChangeWeeklySplitPlan(buildPlanFromPreset(presetId));
    },
    [onChangeWeeklySplitPlan],
  );

  const handlePlanChangeFromCustomize = useCallback(
    (nextPlan) => {
      onChangeWeeklySplitPlan(nextPlan);
      const matched = detectPresetFromPlan(nextPlan);
      setSelectedPresetId(matched);
      if (matched == null) userPickedPresetRef.current = false;
    },
    [onChangeWeeklySplitPlan],
  );

  const toggleCustomize = useCallback(() => {
    setCustomizeOpen((open) => !open);
  }, []);

  return (
    <View>
      {hint ? (
        <Text style={[styles.setText, { color: wt.textSecondary, marginBottom: 16 }]}>{hint}</Text>
      ) : null}

      <Text style={[styles.splitPlanBuilderSectionTitle, { color: wt.textPrimary }]}>How many days per week?</Text>
      <View style={styles.splitPlanBuilderDayCountRow}>
        {TRAINING_DAYS_OPTIONS.map((count) => {
          const selected = selectedDays === count;
          return (
            <TouchableOpacity
              key={count}
              style={[
                styles.splitPlanBuilderDayCountChip,
                {
                  backgroundColor: selected ? wt.selectedExerciseBg : wt.innerCardBg,
                  borderColor: selected ? wt.selectedExerciseBorder : wt.inputBorder,
                },
              ]}
              onPress={() => handleSelectDays(count)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${count} training days per week`}>
              <Text
                style={[
                  styles.splitPlanBuilderDayCountChipText,
                  { color: wt.textPrimary },
                ]}>
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.splitPlanBuilderSectionTitle, { color: wt.textPrimary }]}>Choose a split</Text>
      {presets.length === 0 ? (
        <Text style={[styles.profileHint, { color: wt.textMuted, marginBottom: 16 }]}>
          No presets for this day count yet.
        </Text>
      ) : (
        presets.map((preset) => {
          const selected = selectedPresetId === preset.id;
          const previewPlan = { days: preset.days };
          return (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.splitPlanBuilderPresetCard,
                {
                  backgroundColor: selected ? wt.selectedExerciseBg : wt.cardBg,
                  borderColor: selected ? wt.selectedExerciseBorder : wt.cardBorder,
                },
              ]}
              onPress={() => handleSelectPreset(preset.id)}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${preset.label}, ${preset.scheduleLabel}`}>
              <Text style={[styles.splitPlanBuilderPresetLabel, { color: wt.textPrimary }]}>{preset.label}</Text>
              <Text style={[styles.splitPlanBuilderPresetDescription, { color: wt.textSecondary }]}>
                {preset.description}
              </Text>
              <Text style={[styles.splitPlanBuilderPresetSchedule, { color: wt.textMuted }]}>{preset.scheduleLabel}</Text>
              <View style={styles.splitPlanBuilderPresetStrip}>
                <TargetsSplitWeekStrip weeklySplitPlan={previewPlan} />
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {configured && selectedPresetId == null ? (
        <Text style={[styles.profileHint, { color: wt.textMuted, marginBottom: 8 }]}>Custom plan — not matching a preset.</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.splitPlanBuilderCustomizeToggle,
          { backgroundColor: wt.innerCardBg, borderColor: wt.inputBorder },
        ]}
        onPress={toggleCustomize}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={customizeOpen ? 'Hide customize days' : 'Customize days'}
        accessibilityState={{ expanded: customizeOpen }}>
        <Text style={[styles.splitPlanBuilderCustomizeToggleLabel, { color: wt.textPrimary }]}>Customize days</Text>
        <Text style={[styles.splitPlanBuilderCustomizeToggleChevron, { color: wt.textMuted }]}>
          {customizeOpen ? '‹' : '›'}
        </Text>
      </TouchableOpacity>

      {customizeOpen ? (
        <View style={styles.splitPlanBuilderCustomizeBody}>
          <WeeklySplitPlannerEditor
            weeklySplitPlan={weeklySplitPlan}
            onChangeWeeklySplitPlan={handlePlanChangeFromCustomize}
            theme={wt}
            showHint={false}
          />
        </View>
      ) : null}
    </View>
  );
}

export default memo(WeeklySplitPlanBuilder);
