import React, { memo } from 'react';
import { useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import WeeklySplitPlanBuilder from '../components/WeeklySplitPlanBuilder';

function WeeklySplitPlannerScreen({ screenTransitionOpacity, onBack, weeklySplitPlan, onChangeWeeklySplitPlan }) {
  const styles = useStyles();
  const wt = useWorkoutTheme();

  return (
    <SafeAreaView style={[styles.splitPlannerScreen, { backgroundColor: wt.screenBg }]}>
      <Animated.View style={[styles.screenFadeContainer, { opacity: screenTransitionOpacity, flex: 1 }]}>
        <ScrollView
          style={styles.profileScrollOuter}
          contentContainerStyle={[styles.profileScrollContent, { paddingBottom: 32 }]}
          keyboardShouldPersistTaps="handled">
          <View style={styles.profileHeaderRow}>
            <TouchableOpacity
              style={styles.profileCloseInlineButton}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <Text style={[styles.workoutCloseButtonText, { color: wt.textPrimary }]}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.menuSubscreenNavTitle}>Plan</Text>
          </View>

          <WeeklySplitPlanBuilder
            weeklySplitPlan={weeklySplitPlan}
            onChangeWeeklySplitPlan={onChangeWeeklySplitPlan}
            theme={wt}
            hint="Pick how many days you train, then choose a split. Use Customize days for fine-tuning."
          />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(WeeklySplitPlannerScreen);
