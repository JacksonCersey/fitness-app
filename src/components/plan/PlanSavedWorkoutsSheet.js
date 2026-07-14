import React, { forwardRef, memo, useCallback, useMemo } from 'react';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { WORKOUT_SHEET_SPRING_CONFIG } from '../../constants/workoutSheetAnimation';

const SHEET_SNAP_POINTS = ['72%'];

const PlanSavedWorkoutsSheet = forwardRef(function PlanSavedWorkoutsSheet(
  { savedWorkoutPlans, onOpenWorkout, onDismiss },
  ref,
) {
  const styles = useStyles();
  const theme = useGameTheme();
  const insets = useSafeAreaInsets();

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

  const closeSheet = useCallback(() => {
    ref?.current?.dismiss();
  }, [ref]);

  const handleSelectPlan = useCallback(
    (planId) => {
      closeSheet();
      onOpenWorkout?.(planId);
    },
    [closeSheet, onOpenWorkout],
  );

  return (
    <BottomSheetModal
      ref={ref}
      name="planSavedWorkouts"
      snapPoints={sheetSnapPoints}
      animationConfigs={WORKOUT_SHEET_SPRING_CONFIG}
      enableDynamicSizing={false}
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={renderSheetBackdrop}
      onDismiss={onDismiss}
      handleStyle={{ height: 0, paddingTop: 0, paddingBottom: 0 }}
      handleIndicatorStyle={{ height: 0, width: 0 }}
      enableHandlePanningGesture={false}
      backgroundStyle={sheetBackgroundStyle}>
      <View
        style={[
          styles.activeWorkoutSheetCard,
          { flex: 1, paddingBottom: 8, overflow: 'hidden', backgroundColor: theme.cardBg },
        ]}>
        <View style={styles.activeWorkoutLogSheetHeader}>
          <View style={styles.activeWorkoutLogSheetDragPill} />
          <View style={styles.activeWorkoutLogSheetHeaderTitleRow}>
            <Text style={[styles.activeWorkoutLogSheetTitleInHeader, { color: theme.textPrimary }]}>
              Saved workouts
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}>
          {savedWorkoutPlans.length > 0 ? (
            savedWorkoutPlans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={styles.planPickerOption}
                onPress={() => handleSelectPlan(plan.id)}
                accessibilityRole="button"
                accessibilityLabel={`Assign ${plan.name}`}>
                <Text style={styles.planPickerOptionTitle}>{plan.name}</Text>
                <Text style={styles.planPickerOptionMeta}>
                  {plan.exercises.length} exercise{plan.exercises.length === 1 ? '' : 's'}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.planEmptyBody}>
              No saved workouts yet. Tap Create on a training day to build your first one.
            </Text>
          )}
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
});

export default memo(PlanSavedWorkoutsSheet);
