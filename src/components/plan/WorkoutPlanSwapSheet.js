import React, { forwardRef, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { WORKOUT_SHEET_SPRING_CONFIG } from '../../constants/workoutSheetAnimation';
import { getSplitWorkoutSchedule } from '../../data/workoutPlans';

const SHEET_SNAP_POINTS = ['88%'];
const SAVE_ICON = require('../../../assets/images/icons/saveicon.png');

const WorkoutPlanSwapSheet = forwardRef(function WorkoutPlanSwapSheet(
  {
    selectedPlanIndex,
    weeklySplitPlan,
    savedWorkoutPlans,
    dayWorkoutAssignments,
    selectedWorkoutPlanId,
    onAssignWorkoutToDay,
    onSwapWorkoutBetweenDays,
    onCreateNew,
    onDismiss,
  },
  ref,
) {
  const styles = useStyles();
  const theme = useGameTheme();
  const insets = useSafeAreaInsets();
  const [activeCard, setActiveCard] = useState('main');

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

  const splitSchedule = useMemo(
    () => getSplitWorkoutSchedule(weeklySplitPlan, dayWorkoutAssignments, savedWorkoutPlans),
    [weeklySplitPlan, dayWorkoutAssignments, savedWorkoutPlans],
  );

  const headerTitle = activeCard === 'saved' ? 'Saved workouts' : 'Swap workout';

  const renderSheetBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.48} pressBehavior="close" />
    ),
    [],
  );

  const closeSheet = useCallback(() => {
    ref?.current?.dismiss();
  }, [ref]);

  const handleSheetChange = useCallback(
    (index) => {
      if (index === -1) {
        setActiveCard('main');
        onDismiss?.();
      }
    },
    [onDismiss],
  );

  const handleDismiss = useCallback(() => {
    setActiveCard('main');
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    return () => setActiveCard('main');
  }, []);

  const handleSelectSavedPlan = useCallback(
    (planId) => {
      onAssignWorkoutToDay(selectedPlanIndex, planId);
      closeSheet();
    },
    [closeSheet, onAssignWorkoutToDay, selectedPlanIndex],
  );

  const handleSwapWithDay = useCallback(
    (otherPlanIndex) => {
      if (otherPlanIndex === selectedPlanIndex) return;
      onSwapWorkoutBetweenDays(selectedPlanIndex, otherPlanIndex);
      closeSheet();
    },
    [closeSheet, onSwapWorkoutBetweenDays, selectedPlanIndex],
  );

  const handleCreateNew = useCallback(() => {
    closeSheet();
    onCreateNew?.();
  }, [closeSheet, onCreateNew]);

  const renderSplitSchedule = () => (
    <>
      <Text style={styles.planSwapSectionLabel}>In your split</Text>
      {splitSchedule.length > 0 ? (
        splitSchedule.map((entry) => {
          const isCurrentDay = entry.planIndex === selectedPlanIndex;
          return (
            <TouchableOpacity
              key={entry.planIndex}
              style={[styles.planSwapSplitRow, isCurrentDay && styles.planSwapSplitRowCurrent]}
              onPress={() => handleSwapWithDay(entry.planIndex)}
              disabled={isCurrentDay}
              accessibilityRole="button"
              accessibilityState={{ disabled: isCurrentDay }}
              accessibilityLabel={
                isCurrentDay
                  ? `${entry.dayLabel}, ${entry.workoutPlan.name}, current day`
                  : `Swap with ${entry.dayLabel}, ${entry.workoutPlan.name}`
              }>
              <Text style={styles.planSwapSplitRowDay}>{entry.dayLabel.slice(0, 3)}</Text>
              <View style={styles.planSwapSplitRowBody}>
                <Text style={styles.planSwapSplitRowTitle} numberOfLines={1}>
                  {entry.workoutPlan.name}
                </Text>
                <Text style={styles.planSwapSplitRowMeta}>
                  {entry.workoutPlan.exercises.length} exercise{entry.workoutPlan.exercises.length === 1 ? '' : 's'}
                  {entry.isDefault ? ' · default' : ''}
                </Text>
              </View>
              {isCurrentDay ? (
                <View style={styles.planSwapCurrentBadge}>
                  <Text style={styles.planSwapCurrentBadgeText}>Current</Text>
                </View>
              ) : (
                <Text style={[styles.planSwapSplitRowMeta, { fontWeight: '800' }]}>Swap</Text>
              )}
            </TouchableOpacity>
          );
        })
      ) : (
        <Text style={[styles.planEmptyBody, { marginBottom: 12 }]}>
          No training days in your split yet. Edit your split to add workout days.
        </Text>
      )}
    </>
  );

  const renderSavedWorkoutsList = () =>
    savedWorkoutPlans.length > 0 ? (
      savedWorkoutPlans.map((plan) => {
        const selected = selectedWorkoutPlanId === plan.id;
        return (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planPickerOption, selected && styles.planPickerOptionSelected]}
            onPress={() => handleSelectSavedPlan(plan.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}>
            <Text style={[styles.planPickerOptionTitle, selected && styles.planPickerOptionTitleSelected]}>
              {plan.name}
            </Text>
            <Text style={[styles.planPickerOptionMeta, selected && styles.planPickerOptionMetaSelected]}>
              {plan.exercises.length} exercise{plan.exercises.length === 1 ? '' : 's'}
            </Text>
          </TouchableOpacity>
        );
      })
    ) : (
      <Text style={styles.planEmptyBody}>No saved workouts yet. Tap Create to build your first one.</Text>
    );

  return (
    <BottomSheetModal
      ref={ref}
      name="planWorkoutSwap"
      snapPoints={sheetSnapPoints}
      animationConfigs={WORKOUT_SHEET_SPRING_CONFIG}
      enableDynamicSizing={false}
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={renderSheetBackdrop}
      onChange={handleSheetChange}
      onDismiss={handleDismiss}
      handleStyle={{ height: 0, paddingTop: 0, paddingBottom: 0 }}
      handleIndicatorStyle={{ height: 0, width: 0 }}
      enableHandlePanningGesture={false}
      backgroundStyle={sheetBackgroundStyle}>
      <View style={[styles.activeWorkoutSheetCard, { flex: 1, paddingBottom: 8, overflow: 'hidden', backgroundColor: theme.cardBg }]}>
        <View style={styles.activeWorkoutLogSheetHeader}>
          <View style={styles.activeWorkoutLogSheetDragPill} />
          <View style={styles.activeWorkoutLogSheetHeaderTitleRow}>
            {activeCard === 'saved' ? (
              <TouchableOpacity
                onPress={() => setActiveCard('main')}
                style={styles.planSwapBackTouch}
                accessibilityRole="button"
                accessibilityLabel="Back">
                <Text style={[styles.planSwapBackMark, { color: theme.textPrimary }]}>‹</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={[styles.activeWorkoutLogSheetTitleInHeader, { color: theme.textPrimary }]}>{headerTitle}</Text>
            <TouchableOpacity
              onPress={closeSheet}
              style={styles.activeWorkoutLogSheetCloseTouch}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Text style={[styles.activeWorkoutLogSheetCloseMark, { color: theme.navAccent }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeCard === 'main' ? (
          <>
            <View style={styles.planSwapPanelRow}>
              <TouchableOpacity
                style={styles.planSwapPanelButton}
                onPress={() => setActiveCard('saved')}
                accessibilityRole="button"
                accessibilityLabel="Saved workouts">
                <Image source={SAVE_ICON} style={styles.planSwapPanelIcon} resizeMode="contain" />
                <Text style={styles.planSwapPanelLabel}>Saved{'\n'}Workouts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.planSwapPanelButton}
                onPress={handleCreateNew}
                accessibilityRole="button"
                accessibilityLabel="Create new workout">
                <View style={styles.planSwapPanelPlusWrap}>
                  <Text style={styles.planSwapPanelPlusText}>+</Text>
                </View>
                <Text style={styles.planSwapPanelLabel}>Create{'\n'}New</Text>
              </TouchableOpacity>
            </View>

            <BottomSheetScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}>
              {renderSplitSchedule()}
            </BottomSheetScrollView>
          </>
        ) : (
          <View style={[styles.planSwapSavedCard, { borderTopColor: theme.borderSubtle }]}>
            <BottomSheetScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 20 }}>
              {renderSavedWorkoutsList()}
            </BottomSheetScrollView>
          </View>
        )}
      </View>
    </BottomSheetModal>
  );
});

export default memo(WorkoutPlanSwapSheet);
