import React, { memo } from 'react';
import {
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  formatHeightFeetInchesLabel,
  profileHeightPickersToInches,
  PROFILE_HEIGHT_FT_OPTIONS_MAX,
  PROFILE_HEIGHT_FT_OPTIONS_MIN,
  PROFILE_HEIGHT_FT_SENTINEL,
} from '../../utils/workoutStats';
import { styles } from '../styles';

function ProfileScreen({
  screenTransitionOpacity,
  onBack,
  profileNameDraft,
  setProfileNameDraft,
  profileHeightPickFeet,
  setProfileHeightPickFeet,
  profileHeightPickInches,
  setProfileHeightPickInches,
  profileHeightEditorOpen,
  setProfileHeightEditorOpen,
  profileGoalDraft,
  setProfileGoalDraft,
  onSaveProfile,
}) {
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
              <Text style={[styles.workoutCloseButtonText, { color: '#4B3CC1' }]}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.profileTitle}>Profile</Text>
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>Your name</Text>
            <TextInput
              value={profileNameDraft}
              onChangeText={setProfileNameDraft}
              placeholder="Optional"
              placeholderTextColor="rgba(238, 241, 255, 0.5)"
              style={styles.profileInput}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>Height</Text>
            <View style={styles.heightSummaryRow}>
              <Text style={styles.heightSummaryValue}>
                {profileHeightPickFeet === PROFILE_HEIGHT_FT_SENTINEL
                  ? 'Not set'
                  : formatHeightFeetInchesLabel(
                      profileHeightPickersToInches(profileHeightPickFeet, profileHeightPickInches),
                    )}
              </Text>
              {!profileHeightEditorOpen ? (
                <TouchableOpacity
                  onPress={() => setProfileHeightEditorOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Edit height">
                  <Text style={styles.profileHeightEditLink}>Edit</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {!profileHeightEditorOpen ? (
              <Text style={styles.profileHint}>Tap Edit when you want to change height (feet / inches).</Text>
            ) : null}
            {profileHeightEditorOpen ? (
              <>
                <Text style={styles.profileHint}>
                  Choose below. This is saved when you tap Save profile. Used for BMI on History.
                </Text>
                <View style={styles.heightPickerRow}>
                  <View style={styles.heightPickerColumn}>
                    <Text style={[styles.heightPickerCaption, styles.heightPickerCaptionSpaced]}>Feet</Text>
                    <Picker
                      selectedValue={profileHeightPickFeet}
                      onValueChange={(value) => {
                        const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
                        setProfileHeightPickFeet(Number.isNaN(n) ? PROFILE_HEIGHT_FT_SENTINEL : n);
                      }}
                      style={[
                        styles.profileHeightPickerWheel,
                        Platform.OS === 'ios' ? styles.profileHeightPickerWheelIOS : null,
                      ]}
                      itemStyle={styles.profileHeightPickerItemStyle}>
                      <Picker.Item label="Not set" value={PROFILE_HEIGHT_FT_SENTINEL} />
                      {Array.from(
                        {
                          length: PROFILE_HEIGHT_FT_OPTIONS_MAX - PROFILE_HEIGHT_FT_OPTIONS_MIN + 1,
                        },
                        (_, idx) => PROFILE_HEIGHT_FT_OPTIONS_MIN + idx,
                      ).map((ftOpt) => (
                        <Picker.Item key={`ft-opt-${ftOpt}`} label={`${ftOpt} ft`} value={ftOpt} />
                      ))}
                    </Picker>
                  </View>
                  <View style={styles.heightPickerColumn}>
                    <Text style={[styles.heightPickerCaption, styles.heightPickerCaptionSpaced]}>Inches</Text>
                    <Picker
                      enabled={profileHeightPickFeet >= PROFILE_HEIGHT_FT_OPTIONS_MIN}
                      selectedValue={profileHeightPickInches}
                      onValueChange={(value) => {
                        const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
                        let next = Number.isNaN(n) ? 0 : n;
                        if (next < 0) next = 0;
                        if (next > 11) next = 11;
                        setProfileHeightPickInches(next);
                      }}
                      style={[
                        styles.profileHeightPickerWheel,
                        Platform.OS === 'ios' ? styles.profileHeightPickerWheelIOS : null,
                      ]}
                      itemStyle={styles.profileHeightPickerItemStyle}>
                      {Array.from({ length: 12 }, (_, inchOpt) => (
                        <Picker.Item key={`in-opt-${inchOpt}`} label={`${inchOpt} in`} value={inchOpt} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.profileHeightDoneButton}
                  onPress={() => setProfileHeightEditorOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close height editor">
                  <Text style={styles.profileHeightDoneButtonText}>Done editing height</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>Goal weight (lb)</Text>
            <TextInput
              value={profileGoalDraft}
              onChangeText={setProfileGoalDraft}
              placeholder="Target body weight"
              placeholderTextColor="rgba(238, 241, 255, 0.5)"
              style={styles.profileInput}
              keyboardType="decimal-pad"
              inputMode="decimal"
            />
            <Text style={styles.profileHint}>Shown on History as your target body weight.</Text>
          </View>

          <TouchableOpacity style={styles.profileSaveButton} onPress={onSaveProfile}>
            <Text style={styles.profileSaveButtonText}>Save profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(ProfileScreen);
