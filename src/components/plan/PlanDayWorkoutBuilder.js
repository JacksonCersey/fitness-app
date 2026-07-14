import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameTheme, useStyles, useWorkoutTheme } from '../../app/context/ThemeStylesContext';
import ActiveWorkoutExerciseSwipeRow from '../ActiveWorkoutExerciseSwipeRow';
import { WORKOUT_SHEET_SPRING_CONFIG } from '../../constants/workoutSheetAnimation';
import { EXERCISE_DATABASE } from '../../../data/exerciseDatabase';
import { getHighlightIconSourceForMuscleLabel } from '../../utils/splitDayHighlightIcons';

const SHEET_SNAP_POINTS = ['88%'];
const TARGET_SHEET_SNAP_POINTS = ['52%'];

function presentBottomSheet(ref) {
  requestAnimationFrame(() => {
    if (ref.current) {
      ref.current.present();
      return;
    }
    setTimeout(() => ref.current?.present(), 50);
  });
}

function createExerciseId() {
  return `ex-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeExercises(exercises) {
  if (!Array.isArray(exercises)) return [];
  return exercises
    .map((item, index) => ({
      id: typeof item?.id === 'string' && item.id ? item.id : `${createExerciseId()}-${index}`,
      movement: typeof item?.movement === 'string' ? item.movement.trim() : '',
      targetSets: item?.targetSets ?? null,
      targetReps: item?.targetReps ?? null,
    }))
    .filter((item) => item.movement);
}

function formatTargetSubtitle(exercise) {
  const sets = Number(exercise?.targetSets);
  const reps = Number(exercise?.targetReps);
  if (sets > 0 && reps > 0) return `${sets} sets × ${reps} reps`;
  if (sets > 0) return `${sets} set${sets === 1 ? '' : 's'} · tap to set reps`;
  if (reps > 0) return `${reps} reps · tap to set sets`;
  return 'No target · tap to set sets/reps';
}

function parseOptionalPositiveInt(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Inline Plan day workout builder (add movements, optional sets/reps).
 * Save / Cancel are owned by the parent.
 */
function PlanDayWorkoutBuilder({
  exercises,
  onChangeExercises,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const wt = useWorkoutTheme();
  const insets = useSafeAreaInsets();

  const [addSearch, setAddSearch] = useState('');
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [targetSheetOpen, setTargetSheetOpen] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [targetSetsInput, setTargetSetsInput] = useState('');
  const [targetRepsInput, setTargetRepsInput] = useState('');

  const addSheetRef = useRef(null);
  const targetSheetRef = useRef(null);

  const list = Array.isArray(exercises) ? exercises : [];

  const filteredAddExercises = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    if (!q) return EXERCISE_DATABASE;
    return EXERCISE_DATABASE.filter((ex) => ex.name.toLowerCase().includes(q));
  }, [addSearch]);

  const editingExercise = useMemo(
    () => list.find((item) => item.id === editingExerciseId) ?? null,
    [list, editingExerciseId],
  );

  const sheetBackgroundStyle = useMemo(
    () => ({
      backgroundColor: wt.splitModalCardBg || theme.cardBg,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
    }),
    [theme.cardBg, wt.splitModalCardBg],
  );

  const renderSheetBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.55} />
    ),
    [],
  );

  const closeAddSheet = useCallback(() => {
    addSheetRef.current?.dismiss();
  }, []);

  const syncAddSheetClosed = useCallback(() => {
    setAddSheetOpen(false);
    setAddSearch('');
  }, []);

  const closeTargetSheet = useCallback(() => {
    targetSheetRef.current?.dismiss();
  }, []);

  const syncTargetSheetClosed = useCallback(() => {
    setTargetSheetOpen(false);
    setEditingExerciseId(null);
    setTargetSetsInput('');
    setTargetRepsInput('');
  }, []);

  const openAddSheet = useCallback(() => {
    setAddSheetOpen(true);
    presentBottomSheet(addSheetRef);
  }, []);

  const openTargetSheet = useCallback(
    (exerciseId) => {
      const exercise = list.find((item) => item.id === exerciseId);
      if (!exercise) return;
      setEditingExerciseId(exerciseId);
      setTargetSetsInput(exercise.targetSets != null ? String(exercise.targetSets) : '');
      setTargetRepsInput(exercise.targetReps != null ? String(exercise.targetReps) : '');
      setTargetSheetOpen(true);
      presentBottomSheet(targetSheetRef);
    },
    [list],
  );

  const handlePickExercise = useCallback(
    (exerciseName) => {
      const trimmed = String(exerciseName || '').trim();
      if (!trimmed) return;
      onChangeExercises?.([
        ...list,
        {
          id: createExerciseId(),
          movement: trimmed,
          targetSets: null,
          targetReps: null,
        },
      ]);
      closeAddSheet();
    },
    [closeAddSheet, list, onChangeExercises],
  );

  const handleRemoveExercise = useCallback(
    (exerciseId) => {
      onChangeExercises?.(list.filter((item) => item.id !== exerciseId));
    },
    [list, onChangeExercises],
  );

  const handleApplyTargets = useCallback(() => {
    if (!editingExerciseId) {
      closeTargetSheet();
      return;
    }
    const nextSets = parseOptionalPositiveInt(targetSetsInput);
    const nextReps = parseOptionalPositiveInt(targetRepsInput);
    onChangeExercises?.(
      list.map((item) =>
        item.id === editingExerciseId
          ? { ...item, targetSets: nextSets, targetReps: nextReps }
          : item,
      ),
    );
    closeTargetSheet();
  }, [closeTargetSheet, editingExerciseId, list, onChangeExercises, targetRepsInput, targetSetsInput]);

  const handleClearTargets = useCallback(() => {
    setTargetSetsInput('');
    setTargetRepsInput('');
  }, []);

  const iconForMovement = useCallback((movementName) => {
    const match = EXERCISE_DATABASE.find(
      (item) => item.name.trim().toLowerCase() === String(movementName || '').trim().toLowerCase(),
    );
    return getHighlightIconSourceForMuscleLabel(match?.primaryMuscles?.[0]);
  }, []);

  return (
    <View style={styles.planDayBuilderRoot}>
      <View style={styles.planDayBuilderList}>
        {list.length === 0 ? (
          <TouchableOpacity
            style={styles.activeWorkoutEmptyCard}
            onPress={openAddSheet}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Add your first movement">
            <View style={styles.activeWorkoutAddIconBox}>
              <Text style={styles.activeWorkoutAddPlus}>+</Text>
            </View>
            <View style={styles.activeWorkoutEmptyTextCol}>
              <Text style={styles.activeWorkoutEmptyTitle}>Add your first movement</Text>
              <Text style={styles.activeWorkoutEmptySubtitle}>Tap to search exercises</Text>
            </View>
          </TouchableOpacity>
        ) : (
          list.map((exercise) => (
            <ActiveWorkoutExerciseSwipeRow
              key={exercise.id}
              workoutSlotId={exercise.id}
              movementLabel={exercise.movement}
              setCount={0}
              subtitle={formatTargetSubtitle(exercise)}
              iconSource={iconForMovement(exercise.movement)}
              onOpen={openTargetSheet}
              onRequestDelete={handleRemoveExercise}
            />
          ))
        )}

        {list.length > 0 ? (
          <TouchableOpacity
            style={styles.activeWorkoutAddRow}
            onPress={openAddSheet}
            accessibilityRole="button"
            accessibilityLabel="Add movement">
            <View style={styles.activeWorkoutAddIconBox}>
              <Text style={styles.activeWorkoutAddPlus}>+</Text>
            </View>
            <Text style={styles.activeWorkoutAddLabel}>Add movement</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {addSheetOpen ? (
        <BottomSheetModal
          ref={addSheetRef}
          name="planDayBuilderAddMovement"
          snapPoints={SHEET_SNAP_POINTS}
          animationConfigs={WORKOUT_SHEET_SPRING_CONFIG}
          enableDynamicSizing={false}
          enablePanDownToClose
          topInset={insets.top}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustPan"
          backdropComponent={renderSheetBackdrop}
          onDismiss={syncAddSheetClosed}
          handleStyle={{ height: 0, paddingTop: 0, paddingBottom: 0 }}
          handleIndicatorStyle={{ height: 0, width: 0 }}
          enableHandlePanningGesture={false}
          backgroundStyle={sheetBackgroundStyle}>
          <View style={[styles.activeWorkoutSheetCard, { flex: 1, paddingBottom: 8, overflow: 'hidden' }]}>
            <View style={styles.activeWorkoutLogSheetHeader}>
              <View style={styles.activeWorkoutLogSheetDragPill} />
              <View style={styles.activeWorkoutLogSheetHeaderTitleRow}>
                <Text style={[styles.activeWorkoutLogSheetTitleInHeader, { color: wt.textPrimary }]}>
                  Add movement
                </Text>
                <TouchableOpacity
                  onPress={closeAddSheet}
                  style={styles.activeWorkoutLogSheetCloseTouch}
                  accessibilityRole="button"
                  accessibilityLabel="Close">
                  <Text style={[styles.activeWorkoutLogSheetCloseMark, { color: theme.navAccent }]}>✕</Text>
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
                    onPress={() => handlePickExercise(item.name)}>
                    <View style={styles.activeWorkoutExerciseIconWell}>
                      {src ? (
                        <Image source={src} style={styles.activeWorkoutExerciseIcon} resizeMode="contain" />
                      ) : null}
                    </View>
                    <Text style={[styles.activeWorkoutSheetExerciseName, { color: wt.textPrimary }]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </BottomSheetModal>
      ) : null}

      {targetSheetOpen ? (
        <BottomSheetModal
          ref={targetSheetRef}
          name="planDayBuilderTargets"
          snapPoints={TARGET_SHEET_SNAP_POINTS}
          animationConfigs={WORKOUT_SHEET_SPRING_CONFIG}
          enableDynamicSizing={false}
          enablePanDownToClose
          topInset={insets.top}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          backdropComponent={renderSheetBackdrop}
          onDismiss={syncTargetSheetClosed}
          handleStyle={{ height: 0, paddingTop: 0, paddingBottom: 0 }}
          handleIndicatorStyle={{ height: 0, width: 0 }}
          enableHandlePanningGesture={false}
          backgroundStyle={sheetBackgroundStyle}>
          <BottomSheetScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            <View style={styles.activeWorkoutLogSheetHeader}>
              <View style={styles.activeWorkoutLogSheetDragPill} />
              <View style={styles.activeWorkoutLogSheetHeaderTitleRow}>
                <Text style={[styles.activeWorkoutLogSheetTitleInHeader, { color: wt.textPrimary }]}>
                  {editingExercise?.movement || 'Targets'}
                </Text>
                <TouchableOpacity
                  onPress={closeTargetSheet}
                  style={styles.activeWorkoutLogSheetCloseTouch}
                  accessibilityRole="button"
                  accessibilityLabel="Close">
                  <Text style={[styles.activeWorkoutLogSheetCloseMark, { color: theme.navAccent }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
              <Text style={styles.planBuilderTargetHint}>
                Optional — leave blank if you do not want preset sets or reps.
              </Text>
              <View style={styles.planBuilderTargetRow}>
                <View style={styles.planBuilderTargetField}>
                  <Text style={styles.planBuilderTargetLabel}>Sets</Text>
                  <TextInput
                    value={targetSetsInput}
                    onChangeText={(value) => setTargetSetsInput(value.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor={wt.placeholderText}
                    style={styles.planBuilderTargetInput}
                    accessibilityLabel="Target sets"
                  />
                </View>
                <View style={styles.planBuilderTargetField}>
                  <Text style={styles.planBuilderTargetLabel}>Reps</Text>
                  <TextInput
                    value={targetRepsInput}
                    onChangeText={(value) => setTargetRepsInput(value.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor={wt.placeholderText}
                    style={styles.planBuilderTargetInput}
                    accessibilityLabel="Target reps"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.planInlineLinkButton}
                onPress={handleClearTargets}
                accessibilityRole="button"
                accessibilityLabel="Clear targets">
                <Text style={styles.planInlineLinkText}>Clear targets</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planBuilderSaveButton, { marginTop: 16 }]}
                onPress={handleApplyTargets}
                accessibilityRole="button"
                accessibilityLabel="Done setting targets">
                <Text style={styles.planBuilderSaveButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        </BottomSheetModal>
      ) : null}
    </View>
  );
}

export default memo(PlanDayWorkoutBuilder);
export { normalizeExercises, createExerciseId };
