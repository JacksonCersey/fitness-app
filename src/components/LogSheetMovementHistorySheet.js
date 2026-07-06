import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import {
  formatRecentSetLine,
  getPastSetsForMovementName,
} from '../utils/movementSetHistory';
import { WORKOUT_SHEET_SPRING_CONFIG } from '../constants/workoutSheetAnimation';

function presentBottomSheet(ref) {
  if (ref.current) {
    ref.current.present();
    return;
  }
  setTimeout(() => ref.current?.present(), 100);
}

function LogSheetMovementHistorySheet({
  visible,
  exerciseName,
  workoutHistory,
  exerciseLookup,
  onClose,
  topInset,
  bottomInset = 0,
  sheetBackgroundStyle,
}) {
  const styles = useStyles();
  const wt = useWorkoutTheme();
  const sheetRef = useRef(null);
  const everPresentedRef = useRef(false);
  const gestureDismissRef = useRef(false);

  const snapPoints = useMemo(() => ['55%', '82%'], []);
  const pastSets = useMemo(
    () => getPastSetsForMovementName(exerciseName, workoutHistory),
    [exerciseName, workoutHistory],
  );

  const syncClosed = useCallback(() => {
    gestureDismissRef.current = true;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      gestureDismissRef.current = false;
      everPresentedRef.current = true;
      presentBottomSheet(sheetRef);
      return;
    }
    if (!everPresentedRef.current) return;
    if (gestureDismissRef.current) {
      gestureDismissRef.current = false;
      return;
    }
    sheetRef.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.48}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleChange = useCallback(
    (index) => {
      if (index === -1) syncClosed();
    },
    [syncClosed],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.logSheetHistoryRow}>
        <Text style={[styles.logSheetHistoryRowText, { color: wt.textPrimary }]}>
          {formatRecentSetLine(item, exerciseName, exerciseLookup)}
        </Text>
      </View>
    ),
    [exerciseName, exerciseLookup, wt.textPrimary],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      name="workoutLogSetHistory"
      snapPoints={snapPoints}
      stackBehavior="push"
      animationConfigs={WORKOUT_SHEET_SPRING_CONFIG}
      enableDynamicSizing={false}
      enablePanDownToClose
      topInset={topInset}
      backdropComponent={renderBackdrop}
      onChange={handleChange}
      onDismiss={syncClosed}
      handleStyle={{ height: 0, paddingTop: 0, paddingBottom: 0 }}
      handleIndicatorStyle={{ height: 0, width: 0 }}
      enableHandlePanningGesture={false}
      backgroundStyle={sheetBackgroundStyle}>
      <View style={[styles.activeWorkoutSheetCard, { flex: 1 }]}>
        <View style={styles.activeWorkoutLogSheetHeader}>
          <View style={styles.activeWorkoutLogSheetDragPill} />
          <View style={styles.activeWorkoutLogSheetHeaderTitleRow}>
            <Text style={[styles.activeWorkoutLogSheetTitleInHeader, { color: wt.textPrimary }]} numberOfLines={2}>
              History · {exerciseName || 'Exercise'}
            </Text>
            <TouchableOpacity
              onPress={() => sheetRef.current?.dismiss()}
              style={styles.activeWorkoutLogSheetCloseTouch}
              accessibilityRole="button"
              accessibilityLabel="Close history">
              <Text style={styles.activeWorkoutLogSheetCloseMark}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        {pastSets.length === 0 ? (
          <View style={styles.logSheetHistoryEmpty}>
            <Text style={[styles.emptyText, { color: wt.textMuted }]}>
              No past sets saved for this exercise yet.
            </Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={pastSets}
            keyExtractor={(item, index) => `${item.completedAtISO}-${item.sortKey}-${index}`}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset + 20 }}
            renderItem={renderItem}
          />
        )}
      </View>
    </BottomSheetModal>
  );
}

export default memo(LogSheetMovementHistorySheet);
