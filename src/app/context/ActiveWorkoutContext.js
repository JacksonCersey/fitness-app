import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Keyboard,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LogSheetTextInput from '../../components/LogSheetTextInput';
import { useStyles, useGameTheme, useWorkoutTheme } from './ThemeStylesContext';
import { useAppStorage } from './AppStorageContext';
import { useAppNavigation } from './AppNavigationContext';
import { saveHistoryToStorage } from '../storage/persistedStorage';
import { isBodyweightOnlyExercise, formatTime } from '../../utils/formatWorkout';
import { useWorkoutWallClockTimer } from '../../hooks/useWorkoutWallClockTimer';
import { useBodyweightRepsAutofocus } from '../../hooks/useBodyweightRepsAutofocus';
import {
  formatWeightForNotepadInput,
  getMostRecentSetForMovementName,
} from '../../utils/movementSetHistory';
import {
  buildWorkoutSlotsFromPlan,
  createWorkoutSlotId,
  mergeWorkoutSlotsToExerciseMap,
} from '../../utils/workoutSlots';
import {
  countSessionLoggedSets,
  evaluateSetCelebration,
} from '../../utils/workoutSetCelebration';
import { getMondayBasedDayIndex } from '../../data/weeklySplitPlanner';
import { getWorkoutPlanForDay } from '../../data/workoutPlans';
import {
  getMondayWeekKey,
  isSameMondayWeek,
  resolveWeekPlanSourceIndex,
} from '../../data/weekPlanDayOverrides';
import { isSameLocalDay, startOfLocalDay } from '../../utils/homeDashboard';

const ActiveWorkoutContext = createContext(null);

export function useActiveWorkout() {
  const ctx = useContext(ActiveWorkoutContext);
  if (!ctx) {
    throw new Error('useActiveWorkout must be used within ActiveWorkoutProvider');
  }
  return ctx;
}

export function ActiveWorkoutProvider({ children, workoutStartRef }) {
  const styles = useStyles();
  const theme = useGameTheme();
  const wt = useWorkoutTheme();
  const {
    workoutHistory,
    setWorkoutHistory,
    exerciseLookup,
    weeklyPplCounts,
    weeklySubcategorySetCounts,
    activeDevUserId,
    weeklySplitPlan,
    savedWorkoutPlans,
    dayWorkoutAssignments,
    weekPlanDayOverrides,
    handleApplyWeekOnlyDaySwap,
  } = useAppStorage();
  const { currentScreen, setCurrentScreen } = useAppNavigation();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const workoutTimerOriginMsRef = useRef(null);
  const pendingHomeDaySwapRef = useRef(null);
  const [selectedMovement, setSelectedMovement] = useState('');
  const [customMovementName, setCustomMovementName] = useState('');
  const [notepadWeightInput, setNotepadWeightInput] = useState('');
  const [notepadRepsInput, setNotepadRepsInput] = useState('');
  const [notepadRepsIsSuggested, setNotepadRepsIsSuggested] = useState(false);
  const notepadWeightInputRef = useRef(null);
  const notepadRepsRef = useRef(null);
  const editingRepsInputRef = useRef(null);
  const editingWeightInputRef = useRef(null);
  const [useCustomMovement, setUseCustomMovement] = useState(false);
  const [editingSetKey, setEditingSetKey] = useState(null);
  const [editingReps, setEditingReps] = useState('0');
  const [editingWeight, setEditingWeight] = useState('0');
  const [workoutTimerPaused, setWorkoutTimerPaused] = useState(false);
  const [workoutMovementOrder, setWorkoutMovementOrder] = useState([]);
  const [addMovementSheetVisible, setAddMovementSheetVisible] = useState(false);
  const [logSetSheetExercise, setLogSetSheetExercise] = useState(null);
  const [workoutCelebration, setWorkoutCelebration] = useState(null);
  const workoutCelebrationShownKeysRef = useRef(new Set());
  const [setsByMovement, setSetsByMovement] = useState({});

  const activeMovementName = useCustomMovement ? customMovementName.trim() : selectedMovement.trim();
  const activeIsBodyweightOnly = isBodyweightOnlyExercise(activeMovementName, exerciseLookup);

  useWorkoutWallClockTimer(currentScreen, setElapsedSeconds, workoutTimerOriginMsRef, workoutTimerPaused);
  useBodyweightRepsAutofocus({
    currentScreen,
    useCustomMovement,
    selectedMovement,
    exerciseLookup,
    notepadRepsRef,
  });

  function getSafeWeightValue(weightText) {
    const numericValue = Number.parseFloat(weightText);
    if (Number.isNaN(numericValue) || numericValue < 0) return 0;
    return numericValue;
  }

  function appendSetForExercise(workoutSlotId, setWeight, setReps, timeSeconds) {
    const originMs = workoutTimerOriginMsRef.current;
    const resolvedElapsed =
      typeof timeSeconds === 'number'
        ? timeSeconds
        : originMs != null
          ? Math.max(0, Math.floor((Date.now() - originMs) / 1000))
          : elapsedSeconds;
    const newSet = {
      reps: setReps,
      weight: setWeight,
      elapsedSeconds: resolvedElapsed,
    };
    setSetsByMovement((previousValue) => {
      const existingSets = previousValue[workoutSlotId] || [];
      return {
        ...previousValue,
        [workoutSlotId]: [...existingSets, newSet],
      };
    });
  }

  const dismissWorkoutCelebration = useCallback(() => {
    setWorkoutCelebration(null);
  }, []);

  function tryCelebrateLoggedSet(exerciseName, weightLb, reps) {
    const celebration = evaluateSetCelebration({
      exerciseName,
      weightLb,
      reps,
      workoutHistory,
      setsByMovement,
      workoutMovementOrder,
      exerciseLookup,
      sessionSetCountBefore: countSessionLoggedSets(setsByMovement),
    });
    if (!celebration) return;
    if (celebration.dedupeKey && workoutCelebrationShownKeysRef.current.has(celebration.dedupeKey)) {
      return;
    }
    if (celebration.dedupeKey) {
      workoutCelebrationShownKeysRef.current.add(celebration.dedupeKey);
    }
    setWorkoutCelebration({
      ...celebration,
      id: `${celebration.kind}-${Date.now()}`,
    });
  }

  function sanitizeNotepadWeight(text) {
    let out = '';
    let sawDot = false;
    for (let i = 0; i < text.length; i += 1) {
      const c = text[i];
      if (c >= '0' && c <= '9') {
        out += c;
      } else if (c === '.' && !sawDot) {
        sawDot = true;
        out += c;
      }
    }
    return out;
  }

  function sanitizeNotepadReps(text) {
    return text.replace(/\D/g, '');
  }

  function resetNotepadInput() {
    setNotepadWeightInput('');
    setNotepadRepsInput('');
    setNotepadRepsIsSuggested(false);
  }

  function applyNotepadPrefillForExercise(exerciseName) {
    const name = String(exerciseName || '').trim();
    if (!name) {
      resetNotepadInput();
      return;
    }
    const last = getMostRecentSetForMovementName(
      name,
      setsByMovement,
      workoutMovementOrder,
      workoutHistory,
    );
    if (!last) {
      resetNotepadInput();
      return;
    }
    setNotepadRepsInput('');
    setNotepadRepsIsSuggested(false);
    if (isBodyweightOnlyExercise(name, exerciseLookup)) {
      setNotepadWeightInput('');
      return;
    }
    setNotepadWeightInput(formatWeightForNotepadInput(last.weight));
  }

  function focusNotepadRepsField() {
    notepadRepsRef.current?.focus();
  }

  function handleNotepadWeightChange(text) {
    if (notepadRepsIsSuggested) {
      setNotepadRepsIsSuggested(false);
    }
    if (/\s/.test(text)) {
      const beforeSpace = text.split(/\s/)[0];
      setNotepadWeightInput(sanitizeNotepadWeight(beforeSpace));
      focusNotepadRepsField();
      return;
    }
    setNotepadWeightInput(sanitizeNotepadWeight(text));
  }

  function handleNotepadRepsChange(text) {
    if (text.includes('\n')) {
      const cleaned = sanitizeNotepadReps(text.replace(/\n/g, ''));
      setNotepadRepsIsSuggested(false);
      setNotepadRepsInput(cleaned);
      commitNotepadSet(undefined, cleaned, { dismissIfIncomplete: true });
      return;
    }
    let cleaned = sanitizeNotepadReps(text);
    if (notepadRepsIsSuggested) {
      setNotepadRepsIsSuggested(false);
      const previous = notepadRepsInput;
      if (cleaned.length > previous.length && cleaned.startsWith(previous)) {
        cleaned = cleaned.slice(previous.length);
      }
    }
    setNotepadRepsInput(cleaned);
  }

  function dismissNotepadKeyboard() {
    Keyboard.dismiss();
    notepadRepsRef.current?.blur();
    notepadWeightInputRef.current?.blur();
    editingRepsInputRef.current?.blur();
    editingWeightInputRef.current?.blur();
  }

  function handleRepsSubmitEditing() {
    commitNotepadSet(undefined, undefined, { dismissIfIncomplete: true, saveStoredEdit: false });
  }

  function commitNotepadSet(weightOverride, repsOverride, options = {}) {
    const exercise = activeMovementName.trim();
    const slotId = logSetSheetExercise;
    if (!exercise) {
      Alert.alert('Exercise Required', 'Choose an exercise below before saving a set.');
      return;
    }
    if (!slotId) {
      Alert.alert('Exercise Required', 'Open an exercise from your workout list before saving a set.');
      return;
    }

    const saveStoredEdit = options.saveStoredEdit !== false;
    let didSaveStoredEdit = false;
    if (saveStoredEdit && editingSetKey) {
      const sep = editingSetKey.indexOf('::');
      if (sep > 0) {
        const movement = editingSetKey.slice(0, sep);
        const setIndex = Number.parseInt(editingSetKey.slice(sep + 2), 10);
        if (movement && !Number.isNaN(setIndex)) {
          saveEditingStoredSet(movement, setIndex);
          didSaveStoredEdit = true;
        }
      }
    }

    const needsWeight = !isBodyweightOnlyExercise(exercise, exerciseLookup);
    const dismissIfIncomplete = options.dismissIfIncomplete === true;
    const w = (weightOverride !== undefined ? weightOverride : notepadWeightInput).trim();
    const r = (repsOverride !== undefined ? repsOverride : notepadRepsInput).trim();
    const hasNewSetInput = needsWeight ? Boolean(w && r) : Boolean(r);

    if (!hasNewSetInput) {
      if (didSaveStoredEdit) {
        dismissNotepadKeyboard();
        return;
      }
      if (needsWeight) {
        if (dismissIfIncomplete && !r) {
          dismissNotepadKeyboard();
          return;
        }
        Alert.alert('Incomplete set', 'Enter weight and reps, then press Enter.');
        return;
      }
      if (dismissIfIncomplete) {
        dismissNotepadKeyboard();
        return;
      }
      Alert.alert('Incomplete set', 'Enter reps, then press Enter.');
      return;
    }
    const parsedWeight = needsWeight ? Number.parseFloat(w) : 0;
    const parsedReps = Number.parseInt(r, 10);
    if (needsWeight) {
      if (Number.isNaN(parsedWeight) || parsedWeight < 0 || Number.isNaN(parsedReps) || parsedReps < 0) {
        Alert.alert('Invalid numbers', 'Weight must be 0 or more. Reps must be 0 or more.');
        return;
      }
    } else if (Number.isNaN(parsedReps) || parsedReps < 0) {
      Alert.alert('Invalid numbers', 'Reps must be 0 or more.');
      return;
    }
    tryCelebrateLoggedSet(exercise, parsedWeight, parsedReps);
    appendSetForExercise(slotId, parsedWeight, parsedReps);
    setNotepadRepsInput(String(parsedReps));
    setNotepadRepsIsSuggested(true);
    requestAnimationFrame(() => {
      notepadRepsRef.current?.focus();
    });
  }

  async function handleEndWorkout() {
    setWorkoutTimerPaused(false);
    setAddMovementSheetVisible(false);
    setLogSetSheetExercise(null);
    const originMs = workoutTimerOriginMsRef.current;
    const finalElapsedSeconds =
      originMs != null ? Math.max(0, Math.floor((Date.now() - originMs) / 1000)) : elapsedSeconds;
    const setsForHistory = mergeWorkoutSlotsToExerciseMap(workoutMovementOrder, setsByMovement);
    const historyTotalReps = Object.values(setsForHistory).reduce((sum, movementSets) => {
      if (!Array.isArray(movementSets)) return sum;
      return (
        sum +
        movementSets.reduce((innerSum, setItem) => innerSum + (Number(setItem.reps) || 0), 0)
      );
    }, 0);
    const completedWorkout = {
      id: `${Date.now()}`,
      completedAt: new Date().toISOString(),
      elapsedSeconds: finalElapsedSeconds,
      setsByMovement: setsForHistory,
      totalReps: historyTotalReps,
    };

    try {
      const updatedHistory = [completedWorkout, ...workoutHistory];
      setWorkoutHistory(updatedHistory);
      // Must pass activeDevUserId so fixture data never overwrites real storage keys.
      await saveHistoryToStorage(updatedHistory, activeDevUserId);
    } catch (error) {
      console.warn('Failed to save workout history', error);
      Alert.alert('Save Failed', 'Workout ended, but history could not be saved this time.');
    }

    setSetsByMovement(setsForHistory);
    setWorkoutMovementOrder([]);

    const pendingSwap = pendingHomeDaySwapRef.current;
    pendingHomeDaySwapRef.current = null;
    if (
      pendingSwap &&
      typeof pendingSwap.weekKey === 'string' &&
      Number.isInteger(pendingSwap.indexA) &&
      Number.isInteger(pendingSwap.indexB)
    ) {
      handleApplyWeekOnlyDaySwap(pendingSwap.weekKey, pendingSwap.indexA, pendingSwap.indexB);
    }

    setCurrentScreen('summary');
  }

  const getWorkoutPlanForDate = useCallback(
    (forDate = new Date()) => {
      const planIndex = getMondayBasedDayIndex(forDate);
      const sourceIndex = resolveWeekPlanSourceIndex(weekPlanDayOverrides, forDate, planIndex);
      const dayEntry = weeklySplitPlan?.days?.[sourceIndex] ?? null;
      return getWorkoutPlanForDay(dayWorkoutAssignments, savedWorkoutPlans, sourceIndex, dayEntry);
    },
    [weeklySplitPlan, dayWorkoutAssignments, savedWorkoutPlans, weekPlanDayOverrides],
  );

  /** FAB / Summary / home level popup: open active workout seeded with a day's plan (today by default). */
  const handleStartNewWorkout = useCallback(
    (forDate) => {
      const date = forDate instanceof Date ? forDate : new Date();
      const today = startOfLocalDay(new Date());
      const selected = startOfLocalDay(date);
      const sameWeek = isSameMondayWeek(selected, today);
      const todayIndex = getMondayBasedDayIndex(today);
      const selectedIndex = getMondayBasedDayIndex(selected);

      if (!isSameLocalDay(selected, today) && sameWeek && todayIndex !== selectedIndex) {
        pendingHomeDaySwapRef.current = {
          weekKey: getMondayWeekKey(today),
          indexA: todayIndex,
          indexB: selectedIndex,
        };
      } else {
        pendingHomeDaySwapRef.current = null;
      }

      const plan = getWorkoutPlanForDate(date);
      const initialMovementOrder = buildWorkoutSlotsFromPlan(plan);

      setElapsedSeconds(0);
      setSelectedMovement('');
      setCustomMovementName('');
      setUseCustomMovement(false);
      setSetsByMovement({});
      setWorkoutMovementOrder(initialMovementOrder);
      setWorkoutTimerPaused(false);
      setAddMovementSheetVisible(false);
      setLogSetSheetExercise(null);
      setWorkoutCelebration(null);
      workoutCelebrationShownKeysRef.current.clear();
      workoutTimerOriginMsRef.current = null;
      resetNotepadInput();
      setCurrentScreen('workout');
    },
    [getWorkoutPlanForDate, setCurrentScreen],
  );

  function resetCurrentWorkoutFields() {
    setElapsedSeconds(0);
    setSelectedMovement('');
    setCustomMovementName('');
    setUseCustomMovement(false);
    setSetsByMovement({});
    setWorkoutMovementOrder([]);
    setWorkoutTimerPaused(false);
    setAddMovementSheetVisible(false);
    setLogSetSheetExercise(null);
    setWorkoutCelebration(null);
    workoutCelebrationShownKeysRef.current.clear();
    workoutTimerOriginMsRef.current = null;
    resetNotepadInput();
    cancelEditingStoredSet();
  }

  function handleCancelWorkout() {
    const hasAnyLoggedSets = Object.values(setsByMovement).some(
      (movementSets) => Array.isArray(movementSets) && movementSets.length > 0,
    );
    if (!hasAnyLoggedSets) {
      pendingHomeDaySwapRef.current = null;
      resetCurrentWorkoutFields();
      setCurrentScreen('menu');
      return;
    }
    Alert.alert('Cancel Workout?', 'This workout will not be saved to history.', [
      { text: 'Keep Workout', style: 'cancel' },
      {
        text: 'Cancel Workout',
        style: 'destructive',
        onPress: () => {
          pendingHomeDaySwapRef.current = null;
          resetCurrentWorkoutFields();
          setCurrentScreen('menu');
        },
      },
    ]);
  }

  function handleToggleWorkoutPause() {
    if (workoutTimerPaused) {
      const origin = workoutTimerOriginMsRef.current;
      const e =
        origin != null
          ? Math.max(0, Math.floor((Date.now() - origin) / 1000))
          : elapsedSeconds;
      workoutTimerOriginMsRef.current = Date.now() - e * 1000;
      setWorkoutTimerPaused(false);
    } else {
      const origin = workoutTimerOriginMsRef.current;
      const e =
        origin != null
          ? Math.max(0, Math.floor((Date.now() - origin) / 1000))
          : elapsedSeconds;
      setElapsedSeconds(e);
      workoutTimerOriginMsRef.current = null;
      setWorkoutTimerPaused(true);
    }
  }

  function handlePickExerciseForWorkout(exerciseName) {
    const trimmed = String(exerciseName || '').trim();
    if (!trimmed) return;
    const slot = { id: createWorkoutSlotId(), name: trimmed };
    setWorkoutMovementOrder((prev) => [...prev, slot]);
  }

  function handleOpenLogSetSheet(workoutSlotId) {
    const id = String(workoutSlotId || '').trim();
    if (!id) return;
    const slot = workoutMovementOrder.find((s) => s.id === id);
    if (!slot) return;
    setUseCustomMovement(false);
    setSelectedMovement(slot.name);
    applyNotepadPrefillForExercise(slot.name);
    setLogSetSheetExercise(id);
  }

  function handleCloseLogSetSheet() {
    cancelEditingStoredSet();
    setLogSetSheetExercise(null);
    setSelectedMovement('');
    resetNotepadInput();
  }

  function removeMovementFromWorkout(workoutSlotId) {
    const id = String(workoutSlotId || '').trim();
    if (!id) return;
    setWorkoutMovementOrder((prev) => prev.filter((slot) => slot.id !== id));
    setSetsByMovement((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
    if (logSetSheetExercise === id) {
      setLogSetSheetExercise(null);
      setSelectedMovement('');
      resetNotepadInput();
    }
    if (editingSetKey?.startsWith(`${id}::`)) {
      cancelEditingStoredSet();
    }
  }

  function handleRequestRemoveMovementFromWorkout(movementName) {
    removeMovementFromWorkout(movementName);
  }

  function handleRequestCompleteWorkout() {
    Alert.alert('Complete workout?', 'This workout will be saved to your history.', [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Complete', style: 'default', onPress: () => handleEndWorkout() },
    ]);
  }

  function startEditingStoredSet(movement, setIndex, setItem, focusField = 'reps') {
    const nextKey = `${movement}::${setIndex}`;
    if (editingSetKey && editingSetKey !== nextKey) {
      cancelEditingStoredSet();
    }
    notepadRepsRef.current?.blur();
    notepadWeightInputRef.current?.blur();
    setEditingSetKey(nextKey);
    setEditingReps(String(setItem.reps));
    setEditingWeight(String(setItem.weight));
    const focusRef = focusField === 'weight' ? editingWeightInputRef : editingRepsInputRef;
    requestAnimationFrame(() => {
      setTimeout(() => focusRef.current?.focus(), 60);
    });
  }

  function cancelEditingStoredSet() {
    setEditingSetKey(null);
    setEditingReps('0');
    setEditingWeight('0');
  }

  function saveEditingStoredSet(movement, setIndex) {
    const safeReps = Math.max(0, Number.parseInt(editingReps || '0', 10) || 0);
    const safeWeight = getSafeWeightValue(editingWeight);

    setSetsByMovement((previousValue) => {
      const movementSets = previousValue[movement] || [];
      const updatedSets = movementSets.map((setItem, index) => {
        if (index !== setIndex) return setItem;
        return {
          ...setItem,
          reps: safeReps,
          weight: safeWeight,
        };
      });

      return {
        ...previousValue,
        [movement]: updatedSets,
      };
    });

    cancelEditingStoredSet();
  }

  function deleteStoredSet(movement, setIndex) {
    setSetsByMovement((previousValue) => {
      const movementSets = previousValue[movement] || [];
      const updatedSets = movementSets.filter((_, index) => index !== setIndex);

      if (updatedSets.length === 0) {
        const { [movement]: _removedMovement, ...restMovements } = previousValue;
        return restMovements;
      }

      return {
        ...previousValue,
        [movement]: updatedSets,
      };
    });

    if (editingSetKey === `${movement}::${setIndex}`) {
      cancelEditingStoredSet();
    }
  }

  function renderWorkoutStoredSetsForMovement(storageKey, exerciseDisplayName, onStoredSetRowLayout) {
    const nameForMeta = String(exerciseDisplayName || storageKey || '').trim();
    const movementSets = setsByMovement[storageKey] || [];
    if (movementSets.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: wt.textMuted }]}>No sets for this exercise yet.</Text>
      );
    }
    return movementSets.map((setItem, index) => {
      const isLast = index === movementSets.length - 1;
      const isEditing = editingSetKey === `${storageKey}::${index}`;
      const hideWeightWhileEditing =
        isBodyweightOnlyExercise(nameForMeta, exerciseLookup) && Number(setItem.weight) === 0;
      const wNum = Number(setItem.weight ?? 0);
      const weightDisplay =
        isBodyweightOnlyExercise(nameForMeta, exerciseLookup) && wNum === 0
          ? 'BW'
          : Number.isFinite(wNum) && !Number.isNaN(wNum) && Math.abs(wNum - Math.round(wNum)) < 1e-6
            ? String(Math.round(wNum))
            : String(setItem.weight ?? '');
      const valueBoxStyle = [
        styles.logSheetSetListValueBox,
        {
          backgroundColor: wt.splitModalInnerBg,
          borderColor: isEditing ? theme.navAccent : 'rgba(255, 43, 58, 0.25)',
        },
      ];
      const beginEditReps = () => startEditingStoredSet(storageKey, index, setItem, 'reps');
      const beginEditWeight = () => startEditingStoredSet(storageKey, index, setItem, 'weight');

      return (
        <View
          key={`${storageKey}-${index}`}
          onLayout={
            onStoredSetRowLayout
              ? (e) => onStoredSetRowLayout(index, e.nativeEvent.layout)
              : undefined
          }
          style={[
            styles.logSheetSetListRow,
            isLast && { borderBottomWidth: 0, marginBottom: 4, paddingBottom: 0 },
          ]}>
          <Text style={styles.logSheetSetListNumber}>{index + 1}</Text>
          <View style={styles.logSheetSetListMain}>
            <View style={styles.logSheetSetListValuesRow}>
              <View style={styles.logSheetSetListFieldCol}>
                <Text style={[styles.logSheetSetListFieldLabel, { color: wt.textMuted }]}>Reps</Text>
                {isEditing ? (
                  <View style={valueBoxStyle}>
                    <LogSheetTextInput
                      ref={editingRepsInputRef}
                      value={editingReps}
                      onChangeText={setEditingReps}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      placeholder="Reps"
                      placeholderTextColor={wt.placeholderText}
                      style={[styles.logSheetSetListValueInput, { color: wt.inputText }]}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={valueBoxStyle}
                    onPress={beginEditReps}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit reps for set ${index + 1}`}>
                    <Text style={[styles.logSheetSetListValueText, { color: wt.textPrimary }]}>
                      {setItem.reps}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.logSheetSetListAt, { color: wt.textSecondary }]}>@</Text>
              <View style={styles.logSheetSetListFieldCol}>
                <Text style={[styles.logSheetSetListFieldLabel, { color: wt.textMuted }]}>Weight</Text>
                {hideWeightWhileEditing ? (
                  <View style={valueBoxStyle}>
                    <Text style={[styles.logSheetSetListValueText, { color: wt.textPrimary }]}>
                      {weightDisplay}
                    </Text>
                  </View>
                ) : isEditing ? (
                  <View style={valueBoxStyle}>
                    <LogSheetTextInput
                      ref={editingWeightInputRef}
                      value={editingWeight}
                      onChangeText={setEditingWeight}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                      placeholder="Weight"
                      placeholderTextColor={wt.placeholderText}
                      style={[styles.logSheetSetListValueInput, { color: wt.inputText }]}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={valueBoxStyle}
                    onPress={beginEditWeight}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit weight for set ${index + 1}`}>
                    <Text style={[styles.logSheetSetListValueText, { color: wt.textPrimary }]}>
                      {weightDisplay}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={[styles.logSheetSetListMeta, { color: wt.textMuted }]}>
              {formatTime(setItem.elapsedSeconds)}
            </Text>
            <View style={styles.logSheetSetListActions}>
              <TouchableOpacity
                style={[styles.smallActionButton, styles.smallDeleteButton]}
                onPress={() => deleteStoredSet(storageKey, index)}>
                <Text style={styles.smallDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    });
  }

  const displaySetsByMovement = useMemo(() => {
    if (!workoutMovementOrder || workoutMovementOrder.length === 0) {
      return setsByMovement;
    }
    return mergeWorkoutSlotsToExerciseMap(workoutMovementOrder, setsByMovement);
  }, [workoutMovementOrder, setsByMovement]);

  const movementNamesNewestFirst = useMemo(() => {
    const names = Object.keys(displaySetsByMovement);
    return [...names].sort((a, b) => {
      const setsA = displaySetsByMovement[a] || [];
      const setsB = displaySetsByMovement[b] || [];
      const maxA = setsA.length === 0 ? -1 : Math.max(...setsA.map((s) => Number(s.elapsedSeconds) || 0));
      const maxB = setsB.length === 0 ? -1 : Math.max(...setsB.map((s) => Number(s.elapsedSeconds) || 0));
      if (maxB !== maxA) return maxB - maxA;
      return a.localeCompare(b);
    });
  }, [displaySetsByMovement]);

  const totalReps = useMemo(() => {
    return Object.values(setsByMovement).reduce((sum, movementSets) => {
      if (!Array.isArray(movementSets)) return sum;
      return (
        sum +
        movementSets.reduce((innerSum, setItem) => innerSum + (Number(setItem.reps) || 0), 0)
      );
    }, 0);
  }, [setsByMovement]);

  const hasAnyLoggedSets = useMemo(
    () =>
      Object.values(setsByMovement).some((arr) => Array.isArray(arr) && arr.length > 0),
    [setsByMovement],
  );

  useEffect(() => {
    if (!workoutStartRef) return undefined;
    workoutStartRef.current = handleStartNewWorkout;
    return () => {
      if (workoutStartRef.current === handleStartNewWorkout) {
        workoutStartRef.current = () => {};
      }
    };
  }, [workoutStartRef, handleStartNewWorkout]);

  const value = {
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
    addMovementSheetVisible,
    setAddMovementSheetVisible,
    logSetSheetExercise,
    handlePickExerciseForWorkout,
    handleOpenLogSetSheet,
    handleCloseLogSetSheet,
    handleRequestRemoveMovementFromWorkout,
    workoutTimerPaused,
    handleToggleWorkoutPause,
    hasAnyLoggedSets,
    handleRequestCompleteWorkout,
    renderWorkoutStoredSetsForMovement,
    weeklyPplCounts,
    weeklySubcategorySetCounts,
    workoutCelebration,
    dismissWorkoutCelebration,
    handleStartNewWorkout,
    displaySetsByMovement,
    movementNamesNewestFirst,
    totalReps,
    editingSetKey,
    editingReps,
    setEditingReps,
    editingWeight,
    setEditingWeight,
    startEditingStoredSet,
    deleteStoredSet,
    saveEditingStoredSet,
    cancelEditingStoredSet,
    exerciseLookup,
  };

  return <ActiveWorkoutContext.Provider value={value}>{children}</ActiveWorkoutContext.Provider>;
}
