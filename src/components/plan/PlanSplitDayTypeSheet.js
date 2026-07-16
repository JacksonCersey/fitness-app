import React, { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import {
  MIXED_DAY_MUSCLE_OPTIONS,
  SPLIT_DAY_TYPES,
  SPLIT_DAY_TYPE_LABELS,
} from '../../data/weeklySplitPlanner';
import { PLAN_DAY_LABELS } from '../../data/workoutPlans';
import { WORKOUT_SHEET_SPRING_CONFIG } from '../../constants/workoutSheetAnimation';
import { getSplitDayAccentColor } from '../../utils/splitDayColors';

const SHEET_SNAP_POINTS = ['72%'];

/**
 * Pull-up card to set a weekday's split type (Push / Pull / Legs / …).
 * Intended as the shared split-picker surface for Plan edit, More, and onboarding later.
 */
const PlanSplitDayTypeSheet = forwardRef(function PlanSplitDayTypeSheet(
  { planIndex, dayEntry, onChangeDayType, onDismiss },
  ref,
) {
  const styles = useStyles();
  const theme = useGameTheme();
  const insets = useSafeAreaInsets();
  const [draftType, setDraftType] = useState(dayEntry?.type ?? 'rest');
  const [draftMuscles, setDraftMuscles] = useState(() =>
    Array.isArray(dayEntry?.mixedMuscles) ? [...dayEntry.mixedMuscles] : [],
  );

  const dayLabel = PLAN_DAY_LABELS[planIndex] ?? 'Day';
  const sheetSnapPoints = useMemo(() => SHEET_SNAP_POINTS, []);

  const sheetBackgroundStyle = useMemo(
    () => ({
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.borderSubtle,
      backgroundColor: theme.cardBg,
    }),
    [theme.borderSubtle, theme.cardBg],
  );

  const renderSheetBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.48} pressBehavior="close" />
    ),
    [],
  );

  const resetDraftFromDay = useCallback(() => {
    setDraftType(dayEntry?.type ?? 'rest');
    setDraftMuscles(Array.isArray(dayEntry?.mixedMuscles) ? [...dayEntry.mixedMuscles] : []);
  }, [dayEntry]);

  const closeSheet = useCallback(() => {
    ref?.current?.dismiss();
  }, [ref]);

  const handleDismiss = useCallback(() => {
    resetDraftFromDay();
    onDismiss?.();
  }, [onDismiss, resetDraftFromDay]);

  const applyType = useCallback(
    (type, mixedMuscles = []) => {
      onChangeDayType?.(planIndex, {
        type,
        mixedMuscles: type === 'mixed' ? mixedMuscles : [],
      });
      closeSheet();
    },
    [closeSheet, onChangeDayType, planIndex],
  );

  const handlePickType = useCallback(
    (type) => {
      if (type === 'mixed') {
        setDraftType('mixed');
        return;
      }
      applyType(type, []);
    },
    [applyType],
  );

  const toggleMuscle = useCallback((muscleName) => {
    setDraftMuscles((previous) => {
      const next = new Set(previous);
      if (next.has(muscleName)) next.delete(muscleName);
      else next.add(muscleName);
      return [...next];
    });
  }, []);

  return (
    <BottomSheetModal
      ref={ref}
      name="planSplitDayType"
      snapPoints={sheetSnapPoints}
      animationConfigs={WORKOUT_SHEET_SPRING_CONFIG}
      enableDynamicSizing={false}
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={renderSheetBackdrop}
      onDismiss={handleDismiss}
      onChange={(index) => {
        if (index >= 0) resetDraftFromDay();
      }}
      handleStyle={{ height: 0, paddingTop: 0, paddingBottom: 0 }}
      handleIndicatorStyle={{ height: 0, width: 0 }}
      enableHandlePanningGesture={false}
      backgroundStyle={sheetBackgroundStyle}>
      <View style={[styles.activeWorkoutSheetCard, { flex: 1, backgroundColor: theme.cardBg }]}>
        <View style={styles.activeWorkoutLogSheetHeader}>
          <View style={styles.activeWorkoutLogSheetDragPill} />
          <View style={styles.activeWorkoutLogSheetHeaderTitleRow}>
            <Text style={[styles.activeWorkoutLogSheetTitleInHeader, { color: theme.textPrimary }]}>
              {dayLabel}
            </Text>
            <TouchableOpacity
              onPress={closeSheet}
              style={styles.activeWorkoutLogSheetCloseTouch}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Text style={[styles.activeWorkoutLogSheetCloseMark, { color: theme.navAccent }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
          <Text style={styles.planSplitTypeSheetHint}>
            Choose this day&apos;s type. This sets the colored icons on Home and Plan.
          </Text>

          {SPLIT_DAY_TYPES.map((type) => {
            const selected = draftType === type;
            const accent = getSplitDayAccentColor(type, theme);
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.planPickerOption,
                  selected && styles.planPickerOptionSelected,
                  styles.planSplitTypeOptionRow,
                ]}
                onPress={() => handlePickType(type)}
                accessibilityRole="button"
                accessibilityLabel={SPLIT_DAY_TYPE_LABELS[type] ?? type}
                accessibilityState={{ selected }}>
                <View style={[styles.planSplitTypeColorDot, { backgroundColor: accent }]} />
                <Text
                  style={[
                    styles.planPickerOptionTitle,
                    styles.planSplitTypeOptionTitle,
                    selected && styles.planPickerOptionTitleSelected,
                  ]}>
                  {SPLIT_DAY_TYPE_LABELS[type] ?? type}
                </Text>
              </TouchableOpacity>
            );
          })}

          {draftType === 'mixed' ? (
            <View style={styles.planSplitTypeMixedBlock}>
              <Text style={styles.planSplitTypeMixedTitle}>Target muscles</Text>
              <Text style={styles.planSplitTypeSheetHint}>
                Tap muscles to include, then tap Apply mixed day.
              </Text>
              <View style={styles.splitPlannerMuscleWrap}>
                {MIXED_DAY_MUSCLE_OPTIONS.map((muscleName) => {
                  const on = draftMuscles.includes(muscleName);
                  return (
                    <TouchableOpacity
                      key={muscleName}
                      style={[
                        styles.splitPlannerMuscleChip,
                        {
                          backgroundColor: on ? theme.navAccent : theme.surfaceRaised,
                          borderColor: on ? theme.navAccent : theme.borderSubtle,
                        },
                      ]}
                      onPress={() => toggleMuscle(muscleName)}>
                      <Text
                        style={[
                          styles.splitPlannerMuscleChipText,
                          { color: on ? '#FFFFFF' : theme.textSecondary },
                        ]}>
                        {muscleName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[
                  styles.planBuilderSaveButton,
                  { marginTop: 12 },
                  draftMuscles.length === 0 && styles.planBuilderSaveButtonDisabled,
                ]}
                disabled={draftMuscles.length === 0}
                onPress={() => applyType('mixed', draftMuscles)}
                accessibilityRole="button"
                accessibilityLabel="Apply mixed day">
                <Text style={styles.planBuilderSaveButtonText}>Apply mixed day</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
});

export default memo(PlanSplitDayTypeSheet);
