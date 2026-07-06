import React, { memo } from 'react';
import { useGameTheme, useStyles } from '../app/context/ThemeStylesContext';
import { Animated, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

function MoreGoalsScreen({
  screenTransitionOpacity,
  onBack,
  profileGoalDraft,
  setProfileGoalDraft,
  onSaveGoal,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  return (
    <SafeAreaView style={styles.menuScreen}>
      <Animated.View style={[styles.screenFadeContainer, { opacity: screenTransitionOpacity }]}>
        <ScrollView
          style={styles.profileScrollOuter}
          contentContainerStyle={styles.profileScrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.menuGradientTopGlow} pointerEvents="none" />
          <View style={styles.menuGradientBottomGlow} pointerEvents="none" />

          <View style={styles.profileHeaderRow}>
            <TouchableOpacity
              style={styles.profileCloseInlineButton}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <Text style={[styles.workoutCloseButtonText, { color: theme.navBack }]}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.menuSubscreenNavTitle}>Goals</Text>
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.menuMoreSectionTitle}>Goal weight (lb)</Text>
            <TextInput
              value={profileGoalDraft}
              onChangeText={setProfileGoalDraft}
              placeholder="Target body weight"
              placeholderTextColor="rgba(238, 241, 255, 0.5)"
              style={styles.profileInput}
              keyboardType="decimal-pad"
              inputMode="decimal"
            />
            <Text style={styles.profileHint}>
              Used on the Progress tab with your history. Leave blank to clear your goal. Height and name are edited
              under Profile.
            </Text>
          </View>

          <TouchableOpacity style={styles.profileSaveButton} onPress={onSaveGoal}>
            <Text style={styles.profileSaveButtonText}>Save goal</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(MoreGoalsScreen);
