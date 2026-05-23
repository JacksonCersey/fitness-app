import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXERCISE_DATABASE } from '../../data/exerciseDatabase';
import { aggregateSessionMuscleHeatFromSets } from '../../data/workoutMuscleHeat';
import ActiveWorkoutExerciseSwipeRow from '../components/ActiveWorkoutExerciseSwipeRow';
import WorkoutSessionTargetsSheetContent from '../components/WorkoutSessionTargetsSheetContent';
import { WORKOUT_THEME } from '../theme/workoutTheme';
import { formatWorkoutTimerHms } from '../utils/formatWorkout';
import { getHighlightIconSourceForMuscleLabel } from '../utils/splitDayHighlightIcons';
import {
  addSessionToSubcategoryCounts,
  countActiveWorkoutSetsByPpl,
  mergeWeeklyPplWithSession,
} from '../utils/weeklyPplSetTotals';
import { mergeWorkoutSlotsToExerciseMap } from '../utils/workoutSlots';
import { styles } from '../styles';

const SHEET_SNAP_POINTS = ['88%'];

function WorkoutScreen({
  screenTransitionOpacity,
  elapsedSeconds,
  activeIsBodyweightOnly,
  notepadRepsRef,
  notepadWeightInputRef,
  notepadRepsInput,
  notepadWeightInput,
  handleNotepadRepsChange,
  handleNotepadWeightChange,
  commitNotepadSet,
  focusNotepadRepsField,
  handleCancelWorkout,
  workoutMovementOrder,
  setsByMovement,
  exerciseLookup,
  addMovementSheetVisible,
  onOpenAddMovementSheet,
  onCloseAddMovementSheet,
  onPickExerciseForWorkout,
  logSetSheetExercise,
  onOpenLogSetSheet,
  onCloseLogSetSheet,
  onRequestRemoveMovementFromWorkout,
  repeatLastSetEnabled,
  onRepeatLastSet,
  workoutTimerPaused,
  onToggleWorkoutPause,
  hasAnyLoggedSets,
  onRequestCompleteWorkout,
  renderWorkoutStoredSetsForMovement,
  weeklyPplCounts,
  weeklySubcategorySetCounts,
}) {
  const wt = WORKOUT_THEME;
  const insets = useSafeAreaInsets();
  const [addSearch, setAddSearch] = useState('');
  const [targetsSheetVisible, setTargetsSheetVisible] = useState(false);

  const addSheetRef = useRef(null);
  const logSheetRef = useRef(null);
  const targetsSheetRef = useRef(null);

  const sheetSnapPoints = useMemo(() => SHEET_SNAP_POINTS, []);

  const renderSheetBackdrop = useCallback(
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

  const sheetBackgroundStyle = useMemo(
    () => ({
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: 'rgba(255, 255, 255, 0.16)',
      backgroundColor: wt.splitModalCardBg,
    }),
    [wt.splitModalCardBg],
  );

  useEffect(() => {
    if (addMovementSheetVisible) setAddSearch('');
  }, [addMovementSheetVisible]);

  const addSheetEverPresentedRef = useRef(false);
  const addSheetGestureDismissRef = useRef(false);
  const logSheetEverPresentedRef = useRef(false);
  const logSheetGestureDismissRef = useRef(false);
  const targetsSheetEverPresentedRef = useRef(false);
  const targetsSheetGestureDismissRef = useRef(false);

  const syncTargetsSheetClosed = useCallback(() => {
    targetsSheetGestureDismissRef.current = true;
    setTargetsSheetVisible(false);
  }, []);

  const syncAddSheetClosed = useCallback(() => {
    addSheetGestureDismissRef.current = true;
    onCloseAddMovementSheet();
  }, [onCloseAddMovementSheet]);

  const syncLogSheetClosed = useCallback(() => {
    logSheetGestureDismissRef.current = true;
    onCloseLogSetSheet();
  }, [onCloseLogSetSheet]);

  useEffect(() => {
    if (addMovementSheetVisible) {
      addSheetGestureDismissRef.current = false;
      addSheetEverPresentedRef.current = true;
      const id = requestAnimationFrame(() => addSheetRef.current?.present());
      return () => cancelAnimationFrame(id);
    }
    if (!addSheetEverPresentedRef.current) return;
    if (addSheetGestureDismissRef.current) {
      addSheetGestureDismissRef.current = false;
      return;
    }
    addSheetRef.current?.dismiss();
  }, [addMovementSheetVisible]);

  useEffect(() => {
    if (logSetSheetExercise) {
      logSheetGestureDismissRef.current = false;
      logSheetEverPresentedRef.current = true;
      const id = requestAnimationFrame(() => logSheetRef.current?.present());
      return () => cancelAnimationFrame(id);
    }
    if (!logSheetEverPresentedRef.current) return;
    if (logSheetGestureDismissRef.current) {
      logSheetGestureDismissRef.current = false;
      return;
    }
    logSheetRef.current?.dismiss();
  }, [logSetSheetExercise]);

  useEffect(() => {
    if (targetsSheetVisible) {
      targetsSheetGestureDismissRef.current = false;
      targetsSheetEverPresentedRef.current = true;
      const id = requestAnimationFrame(() => targetsSheetRef.current?.present());
      return () => cancelAnimationFrame(id);
    }
    if (!targetsSheetEverPresentedRef.current) return;
    if (targetsSheetGestureDismissRef.current) {
      targetsSheetGestureDismissRef.current = false;
      return;
    }
    targetsSheetRef.current?.dismiss();
  }, [targetsSheetVisible]);

  const handlePressAddMovement = useCallback(() => {
    onOpenAddMovementSheet();
    requestAnimationFrame(() => addSheetRef.current?.present());
  }, [onOpenAddMovementSheet]);

  const handleAddSheetChange = useCallback(
    (index) => {
      if (index === -1) syncAddSheetClosed();
    },
    [syncAddSheetClosed],
  );

  const handleLogSheetChange = useCallback(
    (index) => {
      if (index === -1) syncLogSheetClosed();
    },
    [syncLogSheetClosed],
  );

  const filteredAddExercises = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    if (!q) return EXERCISE_DATABASE;
    return EXERCISE_DATABASE.filter((ex) => ex.name.toLowerCase().includes(q));
  }, [addSearch]);

  const bottomBarPad = 12 + insets.bottom;
  const closeAddSheet = useCallback(() => {
    Keyboard.dismiss();
    addSheetRef.current?.dismiss();
  }, []);

  const closeLogSheet = useCallback(() => {
    Keyboard.dismiss();
    logSheetRef.current?.dismiss();
  }, []);

  const closeTargetsSheet = useCallback(() => {
    Keyboard.dismiss();
    targetsSheetRef.current?.dismiss();
  }, []);

  const handleOpenTargetsSheet = useCallback(() => {
    setTargetsSheetVisible(true);
    requestAnimationFrame(() => targetsSheetRef.current?.present());
  }, []);

  const handleTargetsSheetChange = useCallback(
    (index) => {
      if (index === -1) syncTargetsSheetClosed();
    },
    [syncTargetsSheetClosed],
  );

  const setsMergedForPplHeat = useMemo(
    () => mergeWorkoutSlotsToExerciseMap(workoutMovementOrder, setsByMovement),
    [workoutMovementOrder, setsByMovement],
  );

  const sessionPplCounts = useMemo(
    () => countActiveWorkoutSetsByPpl(setsMergedForPplHeat, exerciseLookup),
    [setsMergedForPplHeat, exerciseLookup],
  );

  const weeklyPplWithSession = useMemo(
    () =>
      mergeWeeklyPplWithSession(
        weeklyPplCounts ?? { push: 0, pull: 0, legs: 0 },
        sessionPplCounts,
      ),
    [weeklyPplCounts, sessionPplCounts],
  );

  const weeklySubWithSession = useMemo(
    () =>
      addSessionToSubcategoryCounts(
        weeklySubcategorySetCounts ?? { push: {}, pull: {}, legs: {} },
        setsMergedForPplHeat,
        exerciseLookup,
      ),
    [weeklySubcategorySetCounts, setsMergedForPplHeat, exerciseLookup],
  );

  const sessionMuscleActivation = useMemo(
    () => aggregateSessionMuscleHeatFromSets(setsMergedForPplHeat, exerciseLookup),
    [setsMergedForPplHeat, exerciseLookup],
  );

  const logSheetExerciseName = useMemo(() => {
    if (!logSetSheetExercise) return '';
    const slot = workoutMovementOrder.find((s) => s.id === logSetSheetExercise);
    return slot?.name ?? '';
  }, [logSetSheetExercise, workoutMovementOrder]);

  const iconForExerciseName = useCallback(
    (name) => {
      const meta = exerciseLookup[name?.toLowerCase?.() ?? ''];
      const primary = meta?.primaryMuscles?.[0];
      return getHighlightIconSourceForMuscleLabel(primary);
    },
    [exerciseLookup],
  );

  const renderExerciseRow = (slot) => {
    const iconSource = iconForExerciseName(slot.name);
    const count = (setsByMovement[slot.id] || []).length;
    return (
      <ActiveWorkoutExerciseSwipeRow
        key={slot.id}
        workoutSlotId={slot.id}
        movementLabel={slot.name}
        setCount={count}
        iconSource={iconSource}
        onOpen={onOpenLogSetSheet}
        onRequestDelete={onRequestRemoveMovementFromWorkout}
      />
    );
  };

  return (
    <Animated.View style={[styles.screenFadeContainer, styles.activeWorkoutRoot, { opacity: screenTransitionOpacity }]}>
      <View style={[styles.activeWorkoutHeaderPad, { paddingTop: insets.top + 6 }]}>
        <Text style={[styles.activeWorkoutTimer, { color: wt.textPrimary }]}>{formatWorkoutTimerHms(elapsedSeconds)}</Text>
      </View>

      <ScrollView
        style={styles.activeWorkoutScroll}
        contentContainerStyle={[
          styles.activeWorkoutScrollInner,
          { paddingBottom: bottomBarPad + 68 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {workoutMovementOrder.map((m) => renderExerciseRow(m))}
        <TouchableOpacity
          style={styles.activeWorkoutAddRow}
          onPress={handlePressAddMovement}
          accessibilityRole="button"
          accessibilityLabel="Add movement">
          <View style={styles.activeWorkoutAddIconBox}>
            <Text style={styles.activeWorkoutAddPlus}>+</Text>
          </View>
          <Text style={styles.activeWorkoutAddLabel}>Add movement</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.activeWorkoutBottomBar, { paddingBottom: bottomBarPad }]}>
        <TouchableOpacity
          style={styles.activeWorkoutCircleButton}
          onPress={onToggleWorkoutPause}
          accessibilityRole="button"
          accessibilityLabel={workoutTimerPaused ? 'Resume timer' : 'Pause timer'}>
          <Text style={styles.activeWorkoutCircleButtonText}>{workoutTimerPaused ? '▶' : '❚❚'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.activeWorkoutCircleButton, !hasAnyLoggedSets && styles.activeWorkoutCircleButtonDisabled]}
          onPress={onRequestCompleteWorkout}
          disabled={!hasAnyLoggedSets}
          accessibilityRole="button"
          accessibilityLabel="Complete workout"
          accessibilityState={{ disabled: !hasAnyLoggedSets }}>
          <Text style={styles.activeWorkoutCircleButtonText}>✓</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.workoutCloseButtonMenu, { top: insets.top + 2 }]}
        onPress={handleCancelWorkout}
        accessibilityRole="button"
        accessibilityLabel="Cancel workout">
        <Text style={[styles.workoutCloseButtonText, { color: '#4B3CC1' }]}>✕</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.workoutTargetsTopButton, { top: insets.top + 2 }]}
        onPress={handleOpenTargetsSheet}
        accessibilityRole="button"
        accessibilityLabel="Targets and muscles this workout">
        <Text style={styles.workoutTargetsTopButtonText}>Targets</Text>
      </TouchableOpacity>

      <BottomSheetModal
        ref={addSheetRef}
        name="workoutAddMovement"
        snapPoints={sheetSnapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        topInset={insets.top}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustPan"
        backdropComponent={renderSheetBackdrop}
        onChange={handleAddSheetChange}
        onDismiss={syncAddSheetClosed}
        handleStyle={{ height: 0, paddingTop: 0, paddingBottom: 0 }}
        handleIndicatorStyle={{ height: 0, width: 0 }}
        enableHandlePanningGesture={false}
        backgroundStyle={sheetBackgroundStyle}>
        <View style={[styles.activeWorkoutSheetCard, { flex: 1, paddingBottom: 8, overflow: 'hidden' }]}>
          <View style={styles.activeWorkoutLogSheetHeader}>
            <View style={styles.activeWorkoutLogSheetDragPill} />
            <View style={styles.activeWorkoutLogSheetHeaderTitleRow}>
              <Text style={[styles.activeWorkoutLogSheetTitleInHeader, { color: wt.textPrimary }]}>Add movement</Text>
              <TouchableOpacity
                onPress={closeAddSheet}
                style={styles.activeWorkoutLogSheetCloseTouch}
                accessibilityRole="button"
                accessibilityLabel="Close">
                <Text style={styles.activeWorkoutLogSheetCloseMark}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }}>
            <TextInput
              value={addSearch}
              onChangeText={setAddSearch}
              placeholder="Search exercises…"
              placeholderTextColor={wt.placeholderText}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="search"
              style={[
                styles.activeWorkoutSheetSearch,
                {
                  backgroundColor: wt.splitModalInnerBg,
                  borderColor: wt.inputBorder,
                  color: wt.inputText,
                },
              ]}
            />
          </View>
          <BottomSheetFlatList
            data={filteredAddExercises}
            keyExtractor={(item) => item.name}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 16 }}
            renderItem={({ item }) => {
              const src = getHighlightIconSourceForMuscleLabel(item.primaryMuscles?.[0]);
              return (
                <TouchableOpacity
                  style={styles.activeWorkoutSheetExerciseRow}
                  onPress={() => {
                    onPickExerciseForWorkout(item.name);
                    closeAddSheet();
                  }}>
                  <View style={styles.activeWorkoutExerciseIconWell}>
                    {src ? (
                      <Image source={src} style={styles.activeWorkoutExerciseIcon} resizeMode="contain" />
                    ) : null}
                  </View>
                  <Text style={[styles.activeWorkoutSheetExerciseName, { color: wt.textPrimary }]}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        ref={logSheetRef}
        name="workoutLogSet"
        snapPoints={sheetSnapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        topInset={insets.top}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustPan"
        backdropComponent={renderSheetBackdrop}
        onChange={handleLogSheetChange}
        onDismiss={syncLogSheetClosed}
        handleStyle={{ height: 0, paddingTop: 0, paddingBottom: 0 }}
        handleIndicatorStyle={{ height: 0, width: 0 }}
        enableHandlePanningGesture={false}
        backgroundStyle={sheetBackgroundStyle}>
        <View style={[styles.activeWorkoutSheetCard, { flex: 1, paddingBottom: 8, overflow: 'hidden' }]}>
          <View style={styles.activeWorkoutLogSheetHeader}>
            <View style={styles.activeWorkoutLogSheetDragPill} />
            <View style={styles.activeWorkoutLogSheetHeaderTitleRow}>
              <Text style={[styles.activeWorkoutLogSheetTitleInHeader, { color: wt.textPrimary }]} numberOfLines={2}>
                {logSheetExerciseName || logSetSheetExercise}
              </Text>
              <TouchableOpacity
                onPress={closeLogSheet}
                style={styles.activeWorkoutLogSheetCloseTouch}
                accessibilityRole="button"
                accessibilityLabel="Close">
                <Text style={styles.activeWorkoutLogSheetCloseMark}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.activeWorkoutLogHint, { color: wt.textSecondary }]}>
              Enter weight and reps (or reps only for bodyweight moves). Use Space in weight to jump to reps; Done on reps
              saves the set.
            </Text>
          </View>
          <BottomSheetScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: insets.bottom + 280,
            }}
            keyboardDismissMode="on-drag">
            <View
              style={[
                styles.notepadTwinRow,
                {
                  backgroundColor: wt.splitModalInnerBg,
                  borderColor: wt.inputBorder,
                },
              ]}>
              {activeIsBodyweightOnly ? (
                <TextInput
                  ref={notepadRepsRef}
                  value={notepadRepsInput}
                  onChangeText={handleNotepadRepsChange}
                  onSubmitEditing={() => commitNotepadSet()}
                  placeholder="reps"
                  placeholderTextColor={wt.placeholderText}
                  keyboardType="default"
                  inputMode="numeric"
                  returnKeyType="done"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectTextOnFocus
                  style={[styles.notepadTwinField, { flex: 1, color: wt.inputText }]}
                />
              ) : (
                <>
                  <TextInput
                    ref={notepadWeightInputRef}
                    value={notepadWeightInput}
                    onChangeText={handleNotepadWeightChange}
                    onSubmitEditing={focusNotepadRepsField}
                    placeholder="weight"
                    placeholderTextColor={wt.placeholderText}
                    keyboardType="default"
                    inputMode="decimal"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectTextOnFocus
                    style={[styles.notepadTwinField, styles.notepadTwinFieldWeight, { color: wt.inputText }]}
                  />
                  <Text style={[styles.notepadTwinFor, { color: wt.textSecondary }]}>for</Text>
                  <TextInput
                    ref={notepadRepsRef}
                    value={notepadRepsInput}
                    onChangeText={handleNotepadRepsChange}
                    onSubmitEditing={() => commitNotepadSet()}
                    placeholder="reps"
                    placeholderTextColor={wt.placeholderText}
                    keyboardType="default"
                    inputMode="numeric"
                    returnKeyType="done"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectTextOnFocus
                    style={[styles.notepadTwinField, { color: wt.inputText }]}
                  />
                </>
              )}
              <TouchableOpacity
                style={[styles.notepadRepeatButton, !repeatLastSetEnabled && styles.notepadRepeatButtonDisabled]}
                onPress={onRepeatLastSet}
                disabled={!repeatLastSetEnabled}
                accessibilityRole="button"
                accessibilityLabel="Repeat previous set"
                accessibilityState={{ disabled: !repeatLastSetEnabled }}>
                <Image
                  source={require('../../assets/images/repeaticon.png')}
                  style={styles.notepadRepeatIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.menuPrimaryButton, { marginTop: 14, backgroundColor: wt.primaryButtonBg }]}
              onPress={() => commitNotepadSet()}>
              <Text style={[styles.menuPrimaryButtonText, { color: wt.primaryButtonText }]}>Save set</Text>
            </TouchableOpacity>

            <Text style={[styles.notepadSectionLabel, { color: wt.textMuted, marginTop: 18 }]}>Sets this workout</Text>
            <View style={{ marginBottom: 12 }}>
              {logSetSheetExercise
                ? renderWorkoutStoredSetsForMovement(logSetSheetExercise, logSheetExerciseName)
                : null}
            </View>
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        ref={targetsSheetRef}
        name="workoutTargets"
        snapPoints={sheetSnapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        topInset={insets.top}
        backdropComponent={renderSheetBackdrop}
        onChange={handleTargetsSheetChange}
        onDismiss={syncTargetsSheetClosed}
        handleStyle={{ height: 0, paddingTop: 0, paddingBottom: 0 }}
        handleIndicatorStyle={{ height: 0, width: 0 }}
        enableHandlePanningGesture={false}
        backgroundStyle={sheetBackgroundStyle}>
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <WorkoutSessionTargetsSheetContent
            weeklyPplCountsWithSession={weeklyPplWithSession}
            weeklySubcategorySetCountsWithSession={weeklySubWithSession}
            sessionActivationBySlug={sessionMuscleActivation}
            onClose={closeTargetsSheet}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </Animated.View>
  );
}

export default memo(WorkoutScreen);
