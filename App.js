import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const HISTORY_STORAGE_KEY = 'workout_history_v1';

// Converts seconds to mm:ss format (example: 125 -> "02:05")
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [theme, setTheme] = useState('light');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedMovement, setSelectedMovement] = useState('');
  const [customMovementName, setCustomMovementName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState('0');
  const [useCustomMovement, setUseCustomMovement] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  // Save a full history array to AsyncStorage.
  // We keep this in one helper so save logic is easy to reuse.
  async function saveHistoryToStorage(historyArray) {
    console.log('Saving history to AsyncStorage...');
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyArray));
    console.log(`Saved ${historyArray.length} workouts to AsyncStorage`);
  }

  // Load history from AsyncStorage when app opens.
  // If nothing is saved yet, return an empty list.
  async function loadHistoryFromStorage() {
    console.log('Loading history from AsyncStorage...');
    const savedHistoryJson = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!savedHistoryJson) return [];

    const parsedHistory = JSON.parse(savedHistoryJson);
    if (!Array.isArray(parsedHistory)) return [];
    return parsedHistory;
  }


  // We store sets grouped by movement name:
  // {
  //   "Bench Press": [{ reps: 10, elapsedSeconds: 75 }, ...],
  //   "Pull Up": [{ reps: 12, elapsedSeconds: 220 }]
  // }
  const [setsByMovement, setSetsByMovement] = useState({});
  const sampleMovements = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Pull Up', 'Barbell Row'];
  const activeMovementName = useCustomMovement ? customMovementName.trim() : selectedMovement.trim();
  const isLightTheme = theme === 'light';
  const colors = isLightTheme
    ? {
        screenBackground: '#EDEDED',
        menuBackground: '#EDEDED',
        dashboardCard: '#3B73BB',
        dashboardText: '#EAF0FF',
        streakValue: '#F4F8FF',
        menuPanel: '#C8D1E0',
        menuActionButton: '#F4F4F5',
        menuActionText: '#151266',
        primaryButton: '#3B73BB',
        primaryButtonText: '#FFFFFF',
        secondaryButton: '#C8D1E0',
        secondaryButtonText: '#151266',
        textPrimary: '#151266',
        textSecondary: '#2F343C',
        inputBg: '#FFFFFF',
        inputText: '#1B1E23',
        inputBorder: '#C8D1E0',
        cardBg: '#FFFFFF',
        setText: '#2F343C',
        deleteText: '#B42318',
        weightButton: '#DDE3EF',
        arrowButton: '#DDE3EF',
        cancelButton: '#AAB4C5',
      }
    : {
        screenBackground: '#111214',
        menuBackground: '#111214',
        dashboardCard: '#2F66AD',
        dashboardText: '#EAF1FF',
        streakValue: '#F2F6FF',
        menuPanel: '#171A1F',
        menuActionButton: '#252A32',
        menuActionText: '#E6E8EC',
        primaryButton: '#3B82F6',
        primaryButtonText: '#FFFFFF',
        secondaryButton: '#252A32',
        secondaryButtonText: '#E6E8EC',
        textPrimary: '#FFFFFF',
        textSecondary: '#B7BCC5',
        inputBg: '#1B1E23',
        inputText: '#FFFFFF',
        inputBorder: '#2F343C',
        cardBg: '#1E232B',
        setText: '#D8DDE6',
        deleteText: '#FF7C7C',
        weightButton: '#2A2F38',
        arrowButton: '#2A2F38',
        cancelButton: '#3A3F48',
      };

  // Timer: runs every second while workout is active.
  useEffect(() => {
    if (currentScreen !== 'workout') return undefined;

    const timerId = setInterval(() => {
      setElapsedSeconds((previousValue) => previousValue + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [currentScreen]);

  // On first app load, read saved workouts from device storage
  // and place them into local React state.
  useEffect(() => {
    async function loadWorkoutHistory() {
      try {
        const loadedHistory = await loadHistoryFromStorage();
        setWorkoutHistory(loadedHistory);
        console.log(`Number of workouts loaded: ${loadedHistory.length}`);
      } catch (error) {
        console.log('Failed to load workout history', error);
      } finally {
        setHasLoadedHistory(true);
      }
    }

    loadWorkoutHistory();
  }, []);

  // Compute streak count based on consecutive days with a workout
  function calculateStreak(history) {
    if (!Array.isArray(history) || history.length === 0) return 0;
    // Ensure sorted descending by date (newest first)
    const sorted = [...history].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const today = new Date();
    // Reset time components for comparison
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let streak = 0;
    for (let i = 0; i < sorted.length; i++) {
      const workoutDate = startOfDay(new Date(sorted[i].completedAt));
      const compareDate = new Date(startOfDay(today));
      compareDate.setDate(compareDate.getDate() - streak);
      if (workoutDate.getTime() === compareDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  const streakCount = React.useMemo(() => calculateStreak(workoutHistory), [workoutHistory]);

  const currentDateString = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  // Persist automatically whenever history changes.
  // We wait until initial load finishes so we do not overwrite storage
  // with an empty array before reading existing data.
  useEffect(() => {
    if (!hasLoadedHistory) return;

    async function persistHistory() {
      try {
        await saveHistoryToStorage(workoutHistory);
      } catch (error) {
        console.log('Failed to auto-save workout history', error);
      }
    }

    persistHistory();
  }, [workoutHistory, hasLoadedHistory]);

  function increaseReps() {
    setReps((previousValue) => previousValue + 1);
  }

  function decreaseReps() {
    setReps((previousValue) => Math.max(0, previousValue - 1));
  }

  // Converts input text to a safe, non-negative number.
  function getSafeWeightValue(weightText) {
    const numericValue = Number.parseFloat(weightText);
    if (Number.isNaN(numericValue) || numericValue < 0) return 0;
    return numericValue;
  }

  function increaseWeightByFive() {
    const nextValue = getSafeWeightValue(weight) + 5;
    setWeight(String(nextValue));
  }

  function decreaseWeightByFive() {
    const nextValue = Math.max(0, getSafeWeightValue(weight) - 5);
    setWeight(String(nextValue));
  }

  function handleNextSet() {
    const cleanMovementName = activeMovementName;

    if (!cleanMovementName) {
      Alert.alert('Movement Name Required', 'Please enter movement name before saving a set.');
      return;
    }

    const newSet = {
      reps,
      weight: getSafeWeightValue(weight),
      elapsedSeconds,
    };

    setSetsByMovement((previousValue) => {
      const existingSets = previousValue[cleanMovementName] || [];
      return {
        ...previousValue,
        [cleanMovementName]: [...existingSets, newSet],
      };
    });

    setReps(0);
  }

  function handleNextMovement() {
    setSelectedMovement('');
    setCustomMovementName('');
    setUseCustomMovement(false);
    setIsDropdownOpen(false);
    setReps(0);
    setWeight('0');
  }

  async function handleEndWorkout() {
    const completedWorkout = {
      id: `${Date.now()}`,
      completedAt: new Date().toISOString(),
      elapsedSeconds,
      setsByMovement,
      totalReps,
    };

    try {
      const updatedHistory = [completedWorkout, ...workoutHistory];
      setWorkoutHistory(updatedHistory);
      // Save immediately when workout ends so it still exists
      // after app close/reopen.
      await saveHistoryToStorage(updatedHistory);
    } catch (error) {
      console.log('Failed to save workout history', error);
      Alert.alert('Save Failed', 'Workout ended, but history could not be saved this time.');
    }

    setCurrentScreen('summary');
  }

  function handleStartNewWorkout() {
    setElapsedSeconds(0);
    setSelectedMovement('');
    setCustomMovementName('');
    setUseCustomMovement(false);
    setIsDropdownOpen(false);
    setReps(0);
    setWeight('0');
    setSetsByMovement({});
    setCurrentScreen('workout');
  }

  function handleSelectMovement(movement) {
    setSelectedMovement(movement);
    setUseCustomMovement(false);
    setIsDropdownOpen(false);
  }

  function handleSelectCustomMovement() {
    setSelectedMovement('');
    setUseCustomMovement(true);
    setIsDropdownOpen(false);
  }

  function handleReturnToMenu() {
    setCurrentScreen('menu');
  }

  function handleOpenHistory() {
    setCurrentScreen('history');
  }

  function handleOpenSettings() {
    setCurrentScreen('settings');
  }

  function resetCurrentWorkoutFields() {
    setElapsedSeconds(0);
    setSelectedMovement('');
    setCustomMovementName('');
    setUseCustomMovement(false);
    setIsDropdownOpen(false);
    setReps(0);
    setWeight('0');
    setSetsByMovement({});
  }

  function handleCancelWorkout() {
    Alert.alert('Cancel Workout?', 'This workout will not be saved to history.', [
      { text: 'Keep Workout', style: 'cancel' },
      {
        text: 'Cancel Workout',
        style: 'destructive',
        onPress: () => {
          resetCurrentWorkoutFields();
          setCurrentScreen('menu');
        },
      },
    ]);
  }

  function handleDeleteWorkout(workoutId) {
    Alert.alert('Delete Workout?', 'Remove this workout from history?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setWorkoutHistory((previousHistory) =>
            previousHistory.filter((workoutItem) => workoutItem.id !== workoutId),
          );
        },
      },
    ]);
  }

  const movementNames = useMemo(() => Object.keys(setsByMovement), [setsByMovement]);
  const totalReps = useMemo(() => {
    return movementNames.reduce((sum, movement) => {
      const movementSets = setsByMovement[movement] || [];
      const repsForMovement = movementSets.reduce((innerSum, setItem) => innerSum + setItem.reps, 0);
      return sum + repsForMovement;
    }, 0);
  }, [movementNames, setsByMovement]);

  if (currentScreen === 'menu') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.menuBackground }]}>
        <View style={styles.menuContainer}>
          <View style={[styles.dashboardCard, { backgroundColor: colors.dashboardCard }]}>
            <Text style={[styles.dashboardTitle, { color: colors.dashboardText }]}>DASHBOARD</Text>
            <Text style={[styles.dateLabel, { color: colors.dashboardText }]}>{currentDateString}</Text>
            <Text style={[styles.streakLabel, { color: colors.dashboardText }]}>Streak</Text>
            <View style={styles.streakRow}>
              <Image
                source={require('./assets/images/streakicon.png')}
                style={[styles.streakIcon, streakCount === 0 && { tintColor: '#888' }]}
              />
              <Text style={[styles.streakValue, { color: colors.streakValue }]}>
                {streakCount > 0 ? `${streakCount} Day${streakCount > 1 ? 's' : ''}` : 'No Streak'}
              </Text>
            </View>
          </View>

          <View style={[styles.menuButtonsPanel, { backgroundColor: colors.menuPanel }]}>
            <TouchableOpacity
              style={[styles.menuActionButton, { backgroundColor: colors.menuActionButton }]}
              onPress={handleStartNewWorkout}>
              <Text style={[styles.menuActionButtonText, { color: colors.menuActionText }]}>New Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuActionButton, { backgroundColor: colors.menuActionButton }]}
              onPress={handleOpenHistory}>
              <Text style={[styles.menuActionButtonText, { color: colors.menuActionText }]}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuActionButton, { backgroundColor: colors.menuActionButton }]}
              onPress={handleOpenSettings}>
              <Text style={[styles.menuActionButtonText, { color: colors.menuActionText }]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (currentScreen === 'settings') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.screenBackground }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Settings</Text>

          <View style={[styles.savedSetsSection, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.savedSetsTitle, { color: colors.textPrimary }]}>Theme</Text>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: theme === 'light' ? colors.primaryButton : colors.secondaryButton },
              ]}
              onPress={() => setTheme('light')}>
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme === 'light' ? colors.primaryButtonText : colors.secondaryButtonText },
                ]}>
                Light Mode
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: theme === 'dark' ? colors.primaryButton : colors.secondaryButton },
              ]}
              onPress={() => setTheme('dark')}>
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme === 'dark' ? colors.primaryButtonText : colors.secondaryButtonText },
                ]}>
                Dark Mode
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.secondaryButton }]}
            onPress={handleReturnToMenu}>
            <Text style={[styles.secondaryButtonText, { color: colors.secondaryButtonText }]}>Return to Menu</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === 'history') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.screenBackground }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Workout History</Text>

          {workoutHistory.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No completed workouts yet.</Text>
          ) : (
            workoutHistory.map((workoutItem, workoutIndex) => {
              const movementKeys = Object.keys(workoutItem.setsByMovement || {});
              return (
                <View
                  key={workoutItem.id || `${workoutIndex}`}
                  style={[styles.movementCard, { backgroundColor: colors.cardBg }]}>
                  <View style={styles.historyCardHeader}>
                    <Text style={[styles.movementTitle, { color: colors.textPrimary }]}>
                      Workout {workoutHistory.length - workoutIndex}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteWorkout(workoutItem.id)}>
                      <Text style={[styles.deleteText, { color: colors.deleteText }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.setText, { color: colors.setText }]}>
                    Finished: {new Date(workoutItem.completedAt).toLocaleString()}
                  </Text>
                  <Text style={[styles.setText, { color: colors.setText }]}>
                    Total Time: {formatTime(workoutItem.elapsedSeconds)}
                  </Text>
                  <Text style={[styles.setText, { color: colors.setText }]}>Total Reps: {workoutItem.totalReps}</Text>

                  {movementKeys.map((movement) => {
                    const movementSets = workoutItem.setsByMovement[movement] || [];
                    return (
                      <View key={`${workoutItem.id}-${movement}`} style={styles.historyMovementBlock}>
                        <Text style={[styles.historyMovementTitle, { color: colors.textPrimary }]}>{movement}</Text>
                        {movementSets.map((setItem, setIndex) => (
                          <Text
                            key={`${workoutItem.id}-${movement}-${setIndex}`}
                            style={[styles.setText, { color: colors.setText }]}>
                            Set {setIndex + 1} - {setItem.reps} reps @ {setItem.weight} lb (
                            {formatTime(setItem.elapsedSeconds)})
                          </Text>
                        ))}
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.secondaryButton }]}
            onPress={handleReturnToMenu}>
            <Text style={[styles.secondaryButtonText, { color: colors.secondaryButtonText }]}>Return to Menu</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Summary screen after ending workout.
  if (currentScreen === 'summary') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.screenBackground }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Workout Summary</Text>
          <Text style={[styles.summaryStat, { color: colors.setText }]}>Total Time: {formatTime(elapsedSeconds)}</Text>
          <Text style={[styles.summaryStat, { color: colors.setText }]}>Total Reps: {totalReps}</Text>

          {movementNames.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sets were saved in this workout.</Text>
          ) : (
            movementNames.map((movement) => {
              const movementSets = setsByMovement[movement];
              return (
                <View key={movement} style={[styles.movementCard, { backgroundColor: colors.cardBg }]}>
                  <Text style={[styles.movementTitle, { color: colors.textPrimary }]}>{movement}</Text>
                  {movementSets.map((setItem, index) => (
                    <Text key={`${movement}-${index}`} style={[styles.setText, { color: colors.setText }]}>
                      Set {index + 1} - {setItem.reps} reps @ {setItem.weight} lb (
                      {formatTime(setItem.elapsedSeconds)})
                    </Text>
                  ))}
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primaryButton }]}
            onPress={handleStartNewWorkout}>
            <Text style={[styles.primaryButtonText, { color: colors.primaryButtonText }]}>Start New Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.secondaryButton }]}
            onPress={handleReturnToMenu}>
            <Text style={[styles.secondaryButtonText, { color: colors.secondaryButtonText }]}>Return to Menu</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.screenBackground }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Workout Timer</Text>
        <Text style={[styles.timerValue, { color: colors.textPrimary }]}>{formatTime(elapsedSeconds)}</Text>

        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Movement Name</Text>

          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            onPress={() => setIsDropdownOpen((prev) => !prev)}>
            <Text style={[styles.dropdownButtonText, { color: colors.inputText }]}>
              {activeMovementName || 'Select a movement'}
            </Text>
            <Text style={[styles.dropdownChevron, { color: colors.textSecondary }]}>{isDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {isDropdownOpen ? (
            <View style={[styles.dropdownList, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              {sampleMovements.map((movement) => (
                <TouchableOpacity
                  key={movement}
                  style={[styles.dropdownItem, { borderBottomColor: colors.inputBorder }]}
                  onPress={() => handleSelectMovement(movement)}>
                  <Text style={[styles.dropdownItemText, { color: colors.inputText }]}>{movement}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: colors.inputBorder }]}
                onPress={handleSelectCustomMovement}>
                <Text style={[styles.dropdownItemText, { color: colors.inputText }]}>Custom...</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {useCustomMovement ? (
            <TextInput
              value={customMovementName}
              onChangeText={setCustomMovementName}
              placeholder="Type your movement name"
              placeholderTextColor="#8A8A8A"
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.inputBorder }]}
            />
          ) : null}
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Reps</Text>
        <Text style={[styles.repsValue, { color: colors.textPrimary }]}>{reps}</Text>

        <View style={styles.repsButtonsRow}>
          <TouchableOpacity style={[styles.arrowButton, { backgroundColor: colors.arrowButton }]} onPress={decreaseReps}>
            <Text style={styles.arrowText}>↓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.arrowButton, { backgroundColor: colors.arrowButton }]} onPress={increaseReps}>
            <Text style={styles.arrowText}>↑</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primaryButton }]} onPress={handleNextSet}>
          <Text style={[styles.primaryButtonText, { color: colors.primaryButtonText }]}>Next Set</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.secondaryButton }]} onPress={handleNextMovement}>
          <Text style={[styles.secondaryButtonText, { color: colors.secondaryButtonText }]}>Next Movement</Text>
        </TouchableOpacity>

        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Weight (lb)</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder="0"
            placeholderTextColor="#8A8A8A"
            keyboardType="decimal-pad"
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.inputBorder }]}
          />
        </View>

        <View style={styles.weightButtonsRow}>
          <TouchableOpacity style={[styles.weightButton, { backgroundColor: colors.weightButton }]} onPress={decreaseWeightByFive}>
            <Text style={styles.weightButtonText}>-5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.weightButton, { backgroundColor: colors.weightButton }]} onPress={increaseWeightByFive}>
            <Text style={styles.weightButtonText}>+5</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.savedSetsSection, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.savedSetsTitle, { color: colors.textPrimary }]}>Stored Sets</Text>
          {movementNames.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sets saved yet.</Text>
          ) : (
            movementNames.map((movement) => {
              const movementSets = setsByMovement[movement];
              return (
                <View key={movement} style={[styles.movementCard, { backgroundColor: colors.cardBg }]}>
                  <Text style={[styles.movementTitle, { color: colors.textPrimary }]}>{movement}</Text>
                  {movementSets.map((setItem, index) => (
                    <Text key={`${movement}-${index}`} style={[styles.setText, { color: colors.setText }]}>
                      Set {index + 1} - {setItem.reps} reps @ {setItem.weight} lb (
                      {formatTime(setItem.elapsedSeconds)})
                    </Text>
                  ))}
                </View>
              );
            })
          )}
        </View>

        <TouchableOpacity style={styles.endButton} onPress={handleEndWorkout}>
          <Text style={styles.endButtonText}>End Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.cancelButton }]} onPress={handleCancelWorkout}>
          <Text style={styles.cancelButtonText}>Cancel Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111214',
  },
  menuSafeArea: {
    backgroundColor: '#EDEDED',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    alignItems: 'center',
  },
  dashboardCard: {
    width: '100%',
    borderRadius: 30,
    backgroundColor: '#3B73BB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  dashboardTitle: {
    color: '#EAF0FF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  streakLabel: {
    color: '#EAF0FF',
    fontSize: 42,
    marginBottom: 8,
  },
  dateLabel: {
    color: '#EAF0FF',
    fontSize: 20,
    marginBottom: 6,
    textAlign: 'center',
  },

  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  streakValue: {
    color: '#F4F8FF',
    fontSize: 48,
    fontWeight: '500',
  },
  menuButtonsPanel: {
    width: '90%',
    borderRadius: 40,
    backgroundColor: '#C8D1E0',
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 22,
  },
  menuActionButton: {
    width: '100%',
    backgroundColor: '#F4F4F5',
    borderRadius: 28,
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  menuActionButtonText: {
    color: '#151266',
    fontSize: 24,
    fontWeight: '500',
  },
  timerLabel: {
    color: '#B7BCC5',
    fontSize: 16,
    marginTop: 8,
  },
  timerValue: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 24,
  },
  inputSection: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    color: '#E6E8EC',
    fontSize: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    backgroundColor: '#1B1E23',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2F343C',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 10,
  },
  dropdownButton: {
    width: '100%',
    backgroundColor: '#1B1E23',
    borderWidth: 1,
    borderColor: '#2F343C',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  dropdownChevron: {
    color: '#9AA1AC',
    fontSize: 14,
  },
  dropdownList: {
    width: '100%',
    backgroundColor: '#1B1E23',
    borderWidth: 1,
    borderColor: '#2F343C',
    borderRadius: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343C',
  },
  dropdownItemText: {
    color: '#E6E8EC',
    fontSize: 16,
  },
  repsValue: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '700',
    marginBottom: 12,
  },
  repsButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  arrowButton: {
    width: 100,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#2A2F38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#252A32',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#E6E8EC',
    fontSize: 18,
    fontWeight: '700',
  },
  weightButtonsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  weightButton: {
    flex: 1,
    backgroundColor: '#2A2F38',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  weightButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  savedSetsSection: {
    width: '100%',
    backgroundColor: '#171A1F',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  savedSetsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    color: '#9AA1AC',
    fontSize: 15,
  },
  movementCard: {
    backgroundColor: '#1E232B',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteText: {
    color: '#FF7C7C',
    fontSize: 14,
    fontWeight: '700',
  },
  movementTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  historyMovementBlock: {
    marginTop: 8,
  },
  historyMovementTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  setText: {
    color: '#D8DDE6',
    fontSize: 14,
    marginBottom: 2,
  },
  endButton: {
    width: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    width: '100%',
    backgroundColor: '#3A3F48',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 14,
  },
  summaryStat: {
    color: '#E6E8EC',
    fontSize: 18,
    marginBottom: 8,
  },
});
