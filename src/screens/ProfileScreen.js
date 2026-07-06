import React, { memo, useMemo } from 'react';
import { useGameTheme, useStyles } from '../app/context/ThemeStylesContext';
import {
  Animated,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ProfileGoalWeightInput from '../components/profile/ProfileGoalWeightInput';
import ProfileNameInput from '../components/profile/ProfileNameInput';
import ProfileStatsSummary from '../components/profile/ProfileStatsSummary';
import { getStreakRankProgress } from '../data/streakRanks';
import {
  bmiLbIn,
  formatHeightFeetInchesLabel,
  profileHeightPickersToInches,
  PROFILE_HEIGHT_FT_OPTIONS_MAX,
  PROFILE_HEIGHT_FT_OPTIONS_MIN,
  PROFILE_HEIGHT_FT_SENTINEL,
} from '../../utils/workoutStats';

function getLatestLoggedWeightLb(weightLogs) {
  if (!Array.isArray(weightLogs) || weightLogs.length === 0) return null;
  const sorted = [...weightLogs]
    .filter((log) => log?.dateISO && !Number.isNaN(new Date(log.dateISO).getTime()))
    .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  const weightLb = Number(sorted[0]?.weightLb);
  return !Number.isNaN(weightLb) && weightLb > 0 ? weightLb : null;
}

function ProfileScreen({
  screenTransitionOpacity,
  onBack,
  profileName,
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
  workoutHistory,
  weightLogs,
  consecutiveTrainingWeekStreak,
}) {
  const styles = useStyles();
  const theme = useGameTheme();

  const displayName = useMemo(() => {
    const draft = profileNameDraft.trim();
    if (draft) return draft;
    const saved = profileName.trim();
    if (saved) return saved;
    return 'Your profile';
  }, [profileNameDraft, profileName]);

  const rankSubtitle = useMemo(() => {
    const rank = getStreakRankProgress(consecutiveTrainingWeekStreak);
    const rankLabel = rank.displayRank.label;
    const streakLabel = `${rank.streakWeeks} week${rank.streakWeeks === 1 ? '' : 's'} streak`;
    return `${rankLabel} · ${streakLabel}`;
  }, [consecutiveTrainingWeekStreak]);

  const statsSummary = useMemo(() => {
    const workoutsLogged = Array.isArray(workoutHistory) ? workoutHistory.length : 0;
    const streakWeeks = consecutiveTrainingWeekStreak ?? 0;
    const latestWeightLb = getLatestLoggedWeightLb(weightLogs);
    const latestWeightLabel =
      latestWeightLb != null ? `${Math.round(latestWeightLb * 10) / 10} lb` : 'Not logged';

    const heightIn = profileHeightPickersToInches(profileHeightPickFeet, profileHeightPickInches);
    const bmi =
      latestWeightLb != null && heightIn != null && heightIn > 0
        ? bmiLbIn(latestWeightLb, heightIn)
        : null;
    const bmiLabel = bmi != null ? bmi.toFixed(1) : '—';

    return { workoutsLogged, streakWeeks, latestWeightLabel, bmiLabel };
  }, [
    workoutHistory,
    consecutiveTrainingWeekStreak,
    weightLogs,
    profileHeightPickFeet,
    profileHeightPickInches,
  ]);

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
              <Text style={[styles.workoutCloseButtonText, { color: theme.navBack }]}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.menuSubscreenNavTitle}>Profile</Text>
          </View>

          <View style={styles.profileHeroRow}>
            <View style={styles.profileHeroIconWell}>
              <Image
                source={require('../../assets/images/profileicon.png')}
                style={styles.profileHeroIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.profileHeroTextCol}>
              <Text style={styles.profileHeroName} numberOfLines={2}>
                {displayName}
              </Text>
              <Text style={styles.profileHeroSubtitle} numberOfLines={1}>
                {rankSubtitle}
              </Text>
            </View>
          </View>

          <Text style={[styles.menuMoreBodyText, { marginBottom: 16 }]}>
            Your name, height, and goal weight feed into History and Progress. Update them here anytime.
          </Text>

          <ProfileStatsSummary
            workoutsLogged={statsSummary.workoutsLogged}
            streakWeeks={statsSummary.streakWeeks}
            latestWeightLabel={statsSummary.latestWeightLabel}
            bmiLabel={statsSummary.bmiLabel}
          />

          <Text style={styles.menuMoreSectionHeading}>About you</Text>
          <ProfileNameInput value={profileNameDraft} onChangeText={setProfileNameDraft} placeholder="Optional" />

          <Text style={styles.menuMoreSectionHeading}>Body</Text>
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

          <ProfileGoalWeightInput
            value={profileGoalDraft}
            onChangeText={setProfileGoalDraft}
            hint="Shown on History as your target body weight."
          />

          <TouchableOpacity style={styles.profileSaveButton} onPress={onSaveProfile}>
            <Text style={styles.profileSaveButtonText}>Save profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(ProfileScreen);
