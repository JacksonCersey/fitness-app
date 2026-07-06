import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameTheme, useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXERCISE_DATABASE } from '../../data/exerciseDatabase';
import { aggregateSessionMuscleHeatFromSets } from '../../data/workoutMuscleHeat';
import ActiveWorkoutExerciseSwipeRow from '../components/ActiveWorkoutExerciseSwipeRow';
import WorkoutCelebrationBanner from '../components/WorkoutCelebrationBanner';
import WorkoutSessionTargetsSheetContent from '../components/WorkoutSessionTargetsSheetContent';
import { formatWorkoutTimerHms } from '../utils/formatWorkout';
import { getHighlightIconSourceForMuscleLabel } from '../utils/splitDayHighlightIcons';
import {
  addSessionToSubcategoryCounts,
  countActiveWorkoutSetsByPpl,
  mergeWeeklyPplWithSession,
} from '../utils/weeklyPplSetTotals';
import { mergeWorkoutSlotsToExerciseMap } from '../utils/workoutSlots';
import LogSheetMovementHistorySheet from '../components/LogSheetMovementHistorySheet';
import LogSheetRestTimer, { DEFAULT_REST_SECONDS } from '../components/LogSheetRestTimer';
import LogSheetTextInput from '../components/LogSheetTextInput';
import { WORKOUT_SHEET_SPRING_CONFIG } from '../constants/workoutSheetAnimation';

const SHEET_SNAP_POINTS = ['88%'];
const LOG_SET_SHEET_SNAP_POINTS = ['96%'];
/** Permanent blank area below saved sets (≈ keyboard). Prevents layout jump when editing. */
const LOG_SHEET_BOTTOM_SLOT_MIN = 280;
const LOG_SHEET_BOTTOM_SLOT_MAX = 360;
/** Sticky Save set footer (button + padding), for scroll alignment. */
const LOG_SHEET_FOOTER_BLOCK = 92;
/** Where an edited row should land in the safe area (0 top, 1 bottom). */
const LOG_SHEET_SAFE_ANCHOR_RATIO = 0.62;

function presentBottomSheet(ref) {
  requestAnimationFrame(() => {
    if (ref.current) {
      ref.current.present();
      return;
    }
    setTimeout(() => ref.current?.present(), 50);
  });
}

function WorkoutScreen({
  screenTransitionOpacity,
  elapsedSeconds,
  activeIsBodyweightOnly,
  notepadRepsRef,
  notepadWeightInputRef,
  notepadRepsInput,
  notepadRepsIsSuggested,
  notepadWeightInput,
  handleNotepadRepsChange,
  handleNotepadWeightChange,
  handleRepsSubmitEditing,
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
  workoutTimerPaused,
  onToggleWorkoutPause,
  hasAnyLoggedSets,
  onRequestCompleteWorkout,
  renderWorkoutStoredSetsForMovement,
  weeklyPplCounts,
  weeklySubcategorySetCounts,
  workoutCelebration,
  onDismissWorkoutCelebration,
  editingSetKey,
  workoutHistory,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const wt = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const [addSearch, setAddSearch] = useState('');
  const [targetsSheetVisible, setTargetsSheetVisible] = useState(false);
  const [notepadFieldFocus, setNotepadFieldFocus] = useState('weight');
  const [logSheetKeyboardHeight, setLogSheetKeyboardHeight] = useState(0);
  const [movementHistoryVisible, setMovementHistoryVisible] = useState(false);
  const [restDurationSec, setRestDurationSec] = useState(DEFAULT_REST_SECONDS);
  const [restEndsAtMs, setRestEndsAtMs] = useState(null);
  const prevLogSheetKeyboardHeightRef = useRef(0);
  const prevEditingSetKeyRef = useRef(null);
  const prevLoggedSetCountRef = useRef(0);
  const storedSetRowLayoutsRef = useRef({});
  const logSheetScrollViewportHeightRef = useRef(0);

  useEffect(() => {
    setNotepadFieldFocus(activeIsBodyweightOnly ? 'reps' : 'weight');
  }, [activeIsBodyweightOnly, logSetSheetExercise]);

  useEffect(() => {
    if (!logSetSheetExercise) {
      suppressLogSheetCloseForHistoryRef.current = false;
      setMovementHistoryVisible(false);
      setRestEndsAtMs(null);
      prevLoggedSetCountRef.current = 0;
      return;
    }
    prevLoggedSetCountRef.current = (setsByMovement[logSetSheetExercise] || []).length;
  }, [logSetSheetExercise]);

  useEffect(() => {
    if (!logSetSheetExercise) return;
    const count = (setsByMovement[logSetSheetExercise] || []).length;
    if (count > prevLoggedSetCountRef.current) {
      setRestEndsAtMs(Date.now() + restDurationSec * 1000);
    }
    prevLoggedSetCountRef.current = count;
  }, [logSetSheetExercise, setsByMovement, restDurationSec]);

  const handleRestTimerEnd = useCallback(() => {
    setRestEndsAtMs(null);
  }, []);

  const notepadAdvanceLabel =
    activeIsBodyweightOnly || notepadFieldFocus === 'reps' ? 'Done' : 'Next';

  const handleNotepadAdvancePress = useCallback(() => {
    if (activeIsBodyweightOnly || notepadFieldFocus === 'reps') {
      handleRepsSubmitEditing();
    } else {
      focusNotepadRepsField();
    }
  }, [activeIsBodyweightOnly, notepadFieldFocus, handleRepsSubmitEditing, focusNotepadRepsField]);

  const logSheetBottomSlotHeight = useMemo(() => {
    const screenH = Dimensions.get('window').height;
    return Math.round(Math.min(LOG_SHEET_BOTTOM_SLOT_MAX, Math.max(LOG_SHEET_BOTTOM_SLOT_MIN, screenH * 0.38)));
  }, []);

  const logSheetScrollContentPaddingBottom = useMemo(
    () => LOG_SHEET_FOOTER_BLOCK + insets.bottom + 16 + logSheetBottomSlotHeight,
    [insets.bottom, logSheetBottomSlotHeight],
  );

  const addSheetRef = useRef(null);
  const logSheetRef = useRef(null);
  const logSheetScrollRef = useRef(null);
  const targetsSheetRef = useRef(null);

  const sheetSnapPoints = useMemo(() => SHEET_SNAP_POINTS, []);
  const logSetSheetSnapPoints = useMemo(() => LOG_SET_SHEET_SNAP_POINTS, []);

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
  const suppressLogSheetCloseForHistoryRef = useRef(false);
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
      const frameId = requestAnimationFrame(() => presentBottomSheet(addSheetRef));
      return () => cancelAnimationFrame(frameId);
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
      presentBottomSheet(logSheetRef);
      return;
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
      presentBottomSheet(targetsSheetRef);
      return;
    }
    if (!targetsSheetEverPresentedRef.current) return;
    if (targetsSheetGestureDismissRef.current) {
      targetsSheetGestureDismissRef.current = false;
      return;
    }
    targetsSheetRef.current?.dismiss();
  }, [targetsSheetVisible]);

  useEffect(() => {
    if (!logSetSheetExercise) {
      setLogSheetKeyboardHeight(0);
      return undefined;
    }

    const onKeyboardShow = (event) => {
      const height = event?.endCoordinates?.height ?? 0;
      setLogSheetKeyboardHeight(Math.max(0, height - insets.bottom));
    };
    const onKeyboardHide = () => {
      setLogSheetKeyboardHeight(0);
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subs = [
      Keyboard.addListener(showEvent, onKeyboardShow),
      Keyboard.addListener(hideEvent, onKeyboardHide),
      // iOS number pad can skip "will" events.
      Keyboard.addListener('keyboardDidShow', onKeyboardShow),
      Keyboard.addListener('keyboardDidHide', onKeyboardHide),
    ];

    return () => subs.forEach((sub) => sub.remove());
  }, [insets.bottom, logSetSheetExercise]);

  const renderLogSheetSaveButton = useCallback(
    () => (
      <TouchableOpacity
        style={[styles.menuPrimaryButton, { backgroundColor: wt.primaryButtonBg }]}
        onPress={() => commitNotepadSet()}
        accessibilityRole="button"
        accessibilityLabel="Save set">
        <Text style={[styles.menuPrimaryButtonText, { color: wt.primaryButtonText }]}>Save set</Text>
      </TouchableOpacity>
    ),
    [commitNotepadSet, wt.primaryButtonBg, wt.primaryButtonText],
  );

  const renderLogSheetFooter = useCallback(
    (footerProps) => {
      if (!logSetSheetExercise) return null;
      return (
        <BottomSheetFooter {...footerProps} bottomInset={insets.bottom}>
          <View style={styles.logSheetSaveFooter}>{renderLogSheetSaveButton()}</View>
        </BottomSheetFooter>
      );
    },
    [logSetSheetExercise, insets.bottom, renderLogSheetSaveButton],
  );

  useEffect(() => {
    storedSetRowLayoutsRef.current = {};
  }, [logSetSheetExercise, setsByMovement]);

  const handleStoredSetRowLayout = useCallback((index, layout) => {
    storedSetRowLayoutsRef.current[index] = layout;
  }, []);

  const scrollEditedSetAboveSaveButton = useCallback(
    (setIndex) => {
      const layout = storedSetRowLayoutsRef.current[setIndex];
      const viewportH = logSheetScrollViewportHeightRef.current;
      if (!layout || viewportH <= 0) {
        logSheetScrollRef.current?.scrollToEnd({ animated: true });
        return;
      }

      const footerBlock = LOG_SHEET_FOOTER_BLOCK + insets.bottom + 12;
      const keyboardBlock = logSheetKeyboardHeight > 0 ? logSheetKeyboardHeight + 10 : 0;
      const safeTopY = 0;
      const safeBottomY = Math.max(safeTopY + 1, viewportH - footerBlock - keyboardBlock);
      const safeAnchorY =
        safeTopY + (safeBottomY - safeTopY) * LOG_SHEET_SAFE_ANCHOR_RATIO;
      const rowCenterY = layout.y + layout.height / 2;

      // Keep rows already above the safe anchor where they are.
      if (rowCenterY <= safeAnchorY) {
        return;
      }

      // Move the row center to the safe anchor so it stays clear of footer + keyboard.
      const targetY = rowCenterY - safeAnchorY;

      logSheetScrollRef.current?.scrollTo({
        y: Math.max(0, targetY),
        animated: true,
      });
    },
    [insets.bottom, logSheetKeyboardHeight],
  );

  useEffect(() => {
    if (!editingSetKey || !logSetSheetExercise) return undefined;
    const sep = editingSetKey.indexOf('::');
    if (sep < 0) return undefined;
    const setIndex = Number.parseInt(editingSetKey.slice(sep + 2), 10);
    if (Number.isNaN(setIndex)) return undefined;

    const editingSetChanged = prevEditingSetKeyRef.current !== editingSetKey;
    const keyboardOpenedMore = logSheetKeyboardHeight > prevLogSheetKeyboardHeightRef.current;
    prevEditingSetKeyRef.current = editingSetKey;
    prevLogSheetKeyboardHeightRef.current = logSheetKeyboardHeight;

    // Do not auto-scroll while keyboard is closing; user is controlling the gesture.
    if (!editingSetChanged && !keyboardOpenedMore) {
      return undefined;
    }

    const scrollTimer = setTimeout(() => scrollEditedSetAboveSaveButton(setIndex), 64);
    return () => clearTimeout(scrollTimer);
  }, [editingSetKey, logSetSheetExercise, logSheetKeyboardHeight, scrollEditedSetAboveSaveButton]);

  useEffect(() => {
    if (!editingSetKey) {
      prevEditingSetKeyRef.current = null;
      prevLogSheetKeyboardHeightRef.current = logSheetKeyboardHeight;
    }
  }, [editingSetKey, logSheetKeyboardHeight]);

  const handlePressAddMovement = useCallback(() => {
    addSheetGestureDismissRef.current = false;
    addSheetEverPresentedRef.current = true;
    onOpenAddMovementSheet();
    // Also present directly so a second tap works if visible is already true.
    presentBottomSheet(addSheetRef);
  }, [onOpenAddMovementSheet]);

  const handleAddSheetChange = useCallback(
    (index) => {
      if (index === -1) syncAddSheetClosed();
    },
    [syncAddSheetClosed],
  );

  const handleLogSheetChange = useCallback(
    (index) => {
      if (index === -1) {
        // History stacks on top and temporarily minimizes the log sheet — don't treat that as close.
        if (suppressLogSheetCloseForHistoryRef.current) return;
        syncLogSheetClosed();
      }
    },
    [syncLogSheetClosed],
  );

  const handleOpenMovementHistory = useCallback(() => {
    suppressLogSheetCloseForHistoryRef.current = true;
    setMovementHistoryVisible(true);
  }, []);

  const handleCloseMovementHistory = useCallback(() => {
    suppressLogSheetCloseForHistoryRef.current = false;
    setMovementHistoryVisible(false);
  }, []);

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
        <Text style={[styles.workoutCloseButtonText, { color: theme.navBack }]}>✕</Text>
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
        animationConfigs={WORKOUT_SHEET_SPRING_CONFIG}
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
        snapPoints={logSetSheetSnapPoints}
        animationConfigs={WORKOUT_SHEET_SPRING_CONFIG}
        enableDynamicSizing={false}
        enablePanDownToClose
        topInset={insets.top}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        footerComponent={renderLogSheetFooter}
        backdropComponent={renderSheetBackdrop}
        onChange={handleLogSheetChange}
        onDismiss={syncLogSheetClosed}
        handleStyle={{ height: 0, paddingTop: 0, paddingBottom: 0 }}
        handleIndicatorStyle={{ height: 0, width: 0 }}
        enableHandlePanningGesture={false}
        backgroundStyle={sheetBackgroundStyle}>
        <View style={[styles.activeWorkoutSheetCard, { flex: 1 }]}>
          <WorkoutCelebrationBanner
            event={workoutCelebration}
            topInset={insets.top}
            embeddedInLogSheet
            onDismiss={onDismissWorkoutCelebration}
          />
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
            <View style={styles.activeWorkoutLogSheetToolbarRow}>
              <TouchableOpacity
                style={[styles.logSheetToolbarButton, styles.logSheetToolbarButtonHistory]}
                onPress={handleOpenMovementHistory}
                accessibilityRole="button"
                accessibilityLabel="View exercise history">
                <Text style={[styles.logSheetToolbarButtonLabel, { color: wt.textMuted }]}>History</Text>
                <Text style={[styles.logSheetToolbarButtonValue, { color: wt.textPrimary }]}>Past sets</Text>
              </TouchableOpacity>
              <LogSheetRestTimer
                restDurationSec={restDurationSec}
                restEndsAtMs={restEndsAtMs}
                onRestDurationChange={setRestDurationSec}
                onRestTimerEnd={handleRestTimerEnd}
                bottomInset={insets.bottom}
              />
            </View>
          </View>

          <BottomSheetScrollView
            ref={logSheetScrollRef}
            style={{ flex: 1 }}
            onLayout={(e) => {
              logSheetScrollViewportHeightRef.current = e.nativeEvent.layout.height;
            }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: logSheetScrollContentPaddingBottom,
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
                <LogSheetTextInput
                  ref={notepadRepsRef}
                  value={notepadRepsInput}
                  onChangeText={handleNotepadRepsChange}
                  onFocus={() => setNotepadFieldFocus('reps')}
                  placeholder="reps"
                  placeholderTextColor={wt.placeholderText}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectTextOnFocus
                  style={[
                    styles.notepadTwinField,
                    {
                      flex: 1,
                      color: notepadRepsIsSuggested ? wt.placeholderText : wt.inputText,
                    },
                  ]}
                />
              ) : (
                <>
                  <LogSheetTextInput
                    ref={notepadWeightInputRef}
                    value={notepadWeightInput}
                    onChangeText={handleNotepadWeightChange}
                    onFocus={() => setNotepadFieldFocus('weight')}
                    placeholder="weight"
                    placeholderTextColor={wt.placeholderText}
                    keyboardType="decimal-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectTextOnFocus
                    style={[styles.notepadTwinField, styles.notepadTwinFieldWeight, { color: wt.inputText }]}
                  />
                  <Text style={[styles.notepadTwinFor, { color: wt.textSecondary }]}>for</Text>
                  <LogSheetTextInput
                    ref={notepadRepsRef}
                    value={notepadRepsInput}
                    onChangeText={handleNotepadRepsChange}
                    onFocus={() => setNotepadFieldFocus('reps')}
                    placeholder="reps"
                    placeholderTextColor={wt.placeholderText}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectTextOnFocus
                    style={[
                      styles.notepadTwinField,
                      {
                        color: notepadRepsIsSuggested ? wt.placeholderText : wt.inputText,
                      },
                    ]}
                  />
                </>
              )}
              <TouchableOpacity
                style={[styles.notepadAdvanceButton, { backgroundColor: wt.primaryButtonBg }]}
                onPress={handleNotepadAdvancePress}
                accessibilityRole="button"
                accessibilityLabel={notepadAdvanceLabel}>
                <Text style={[styles.notepadAdvanceButtonText, { color: wt.primaryButtonText }]}>
                  {notepadAdvanceLabel}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.notepadSectionLabel, { color: wt.textMuted, marginTop: 18 }]}>Sets this workout</Text>
            <View style={{ marginBottom: 0 }}>
              {logSetSheetExercise
                ? renderWorkoutStoredSetsForMovement(
                    logSetSheetExercise,
                    logSheetExerciseName,
                    handleStoredSetRowLayout,
                  )
                : null}
              <View style={{ height: logSheetBottomSlotHeight }} />
            </View>
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>

      <LogSheetMovementHistorySheet
        visible={movementHistoryVisible}
        exerciseName={logSheetExerciseName}
        workoutHistory={workoutHistory ?? []}
        exerciseLookup={exerciseLookup}
        onClose={handleCloseMovementHistory}
        topInset={insets.top}
        bottomInset={insets.bottom}
        sheetBackgroundStyle={sheetBackgroundStyle}
      />

      <BottomSheetModal
        ref={targetsSheetRef}
        name="workoutTargets"
        snapPoints={sheetSnapPoints}
        animationConfigs={WORKOUT_SHEET_SPRING_CONFIG}
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
