import React, { memo } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatTime, formatWorkoutSetSummaryText, isBodyweightOnlyExercise } from '../utils/formatWorkout';
import { styles } from '../styles';

function SummaryScreen({
  colors,
  screenTransitionOpacity,
  elapsedSeconds,
  totalReps,
  movementNamesNewestFirst,
  setsByMovement,
  exerciseLookup,
  editingSetKey,
  editingReps,
  setEditingReps,
  editingWeight,
  setEditingWeight,
  startEditingStoredSet,
  deleteStoredSet,
  saveEditingStoredSet,
  cancelEditingStoredSet,
  onStartNewWorkout,
  onReturnToMenu,
}) {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.screenBackground }]}>
      <Animated.View style={[styles.screenFadeContainer, { opacity: screenTransitionOpacity }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Workout Summary</Text>
          <Text style={[styles.summaryStat, { color: colors.setText }]}>Total Time: {formatTime(elapsedSeconds)}</Text>
          <Text style={[styles.summaryStat, { color: colors.setText }]}>Total Reps: {totalReps}</Text>

          {movementNamesNewestFirst.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sets were saved in this workout.</Text>
          ) : (
            movementNamesNewestFirst.map((movement) => {
              const movementSets = setsByMovement[movement] || [];
              return (
                <View key={movement} style={[styles.movementCard, { backgroundColor: colors.cardBg }]}>
                  <Text style={[styles.movementTitle, { color: colors.textPrimary }]}>{movement}</Text>
                  {movementSets.map((setItem, index) => {
                    const hideWeightWhileEditing =
                      isBodyweightOnlyExercise(movement, exerciseLookup) && Number(setItem.weight) === 0;
                    return (
                      <View key={`${movement}-${index}`} style={styles.storedSetRow}>
                        <Text style={[styles.setText, { color: colors.setText }]}>
                          {formatWorkoutSetSummaryText(movement, setItem, exerciseLookup)}
                        </Text>
                        <View style={styles.storedSetActions}>
                          <TouchableOpacity
                            style={[styles.smallActionButton, { backgroundColor: colors.secondaryButton }]}
                            onPress={() => startEditingStoredSet(movement, index, setItem)}>
                            <Text style={[styles.smallActionButtonText, { color: colors.secondaryButtonText }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.smallActionButton, styles.smallDeleteButton]}
                            onPress={() => deleteStoredSet(movement, index)}>
                            <Text style={styles.smallDeleteButtonText}>Delete</Text>
                          </TouchableOpacity>
                        </View>

                        {editingSetKey === `${movement}::${index}` ? (
                          <View style={[styles.editSetPanel, { borderColor: colors.inputBorder }]}>
                            <TextInput
                              value={editingReps}
                              onChangeText={setEditingReps}
                              keyboardType="number-pad"
                              placeholder="Reps"
                              placeholderTextColor="#8A8A8A"
                              style={[
                                styles.editSetInput,
                                {
                                  backgroundColor: colors.inputBg,
                                  color: colors.inputText,
                                  borderColor: colors.inputBorder,
                                },
                              ]}
                            />
                            {hideWeightWhileEditing ? null : (
                              <TextInput
                                value={editingWeight}
                                onChangeText={setEditingWeight}
                                keyboardType="decimal-pad"
                                placeholder="Weight"
                                placeholderTextColor="#8A8A8A"
                                style={[
                                  styles.editSetInput,
                                  {
                                    backgroundColor: colors.inputBg,
                                    color: colors.inputText,
                                    borderColor: colors.inputBorder,
                                  },
                                ]}
                              />
                            )}
                            <View style={styles.editSetActions}>
                              <TouchableOpacity
                                style={[styles.smallActionButton, { backgroundColor: colors.primaryButton }]}
                                onPress={() => saveEditingStoredSet(movement, index)}>
                                <Text style={[styles.smallActionButtonText, { color: colors.primaryButtonText }]}>Save</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.smallActionButton, { backgroundColor: colors.secondaryButton }]}
                                onPress={cancelEditingStoredSet}>
                                <Text style={[styles.smallActionButtonText, { color: colors.secondaryButtonText }]}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primaryButton }]}
            onPress={onStartNewWorkout}>
            <Text style={[styles.primaryButtonText, { color: colors.primaryButtonText }]}>Start New Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.secondaryButton }]}
            onPress={onReturnToMenu}>
            <Text style={[styles.secondaryButtonText, { color: colors.secondaryButtonText }]}>Return to Menu</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(SummaryScreen);
