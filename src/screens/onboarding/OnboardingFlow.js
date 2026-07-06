import React, { useCallback, useMemo, useState } from 'react';
import { useStyles, useWorkoutTheme } from '../../app/context/ThemeStylesContext';
import { Alert, Text, View } from 'react-native';
import ProfileCurrentWeightInput from '../../components/profile/ProfileCurrentWeightInput';
import ProfileGoalWeightInput from '../../components/profile/ProfileGoalWeightInput';
import ProfileHeightPickers from '../../components/profile/ProfileHeightPickers';
import ProfileNameInput from '../../components/profile/ProfileNameInput';
import WeeklySplitPlanBuilder from '../../components/WeeklySplitPlanBuilder';
import { weeklySplitPlanIsConfigured } from '../../data/weeklySplitPlanner';
import { useAppStorage } from '../../app/context/AppStorageContext';
import {
  PROFILE_HEIGHT_FT_OPTIONS_MIN,
  PROFILE_HEIGHT_FT_SENTINEL,
  profileHeightPickersToInches,
} from '../../../utils/workoutStats';
import OnboardingStepShell from './OnboardingStepShell';

const STEP_WELCOME = 0;
const STEP_NAME = 1;
const STEP_HEIGHT = 2;
const STEP_CURRENT_WEIGHT = 3;
const STEP_GOAL_WEIGHT = 4;
const STEP_SPLIT = 5;

const DATA_STEP_COUNT = 5;

function parseRequiredPositive(value, label) {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false };
  const n = Number.parseFloat(trimmed);
  if (Number.isNaN(n) || n <= 0) {
    return { ok: false, message: `${label} must be a positive number.` };
  }
  return { ok: true, value: n };
}

export default function OnboardingFlow() {
  const styles = useStyles();
  const workoutTheme = useWorkoutTheme();
  const {
    weeklySplitPlan,
    handleChangeWeeklySplitPlan,
    saveOnboardingProfile,
    completeOnboarding,
  } = useAppStorage();

  const [stepIndex, setStepIndex] = useState(STEP_WELCOME);
  const [nameDraft, setNameDraft] = useState('');
  const [heightFeet, setHeightFeet] = useState(PROFILE_HEIGHT_FT_SENTINEL);
  const [heightInches, setHeightInches] = useState(0);
  const [currentWeightDraft, setCurrentWeightDraft] = useState('');
  const [goalWeightDraft, setGoalWeightDraft] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const goNext = useCallback(() => {
    setStepIndex((prev) => prev + 1);
  }, []);

  const goBack = useCallback(() => {
    setStepIndex((prev) => Math.max(STEP_WELCOME, prev - 1));
  }, []);

  const nameIsValid = useMemo(() => nameDraft.trim().length > 0, [nameDraft]);

  const heightIsValid = useMemo(
    () => heightFeet >= PROFILE_HEIGHT_FT_OPTIONS_MIN,
    [heightFeet],
  );

  const currentWeightIsValid = useMemo(() => {
    const result = parseRequiredPositive(currentWeightDraft, 'Current weight');
    return result.ok;
  }, [currentWeightDraft]);

  const goalWeightIsValid = useMemo(() => {
    const result = parseRequiredPositive(goalWeightDraft, 'Goal weight');
    return result.ok;
  }, [goalWeightDraft]);

  const splitIsValid = useMemo(
    () => weeklySplitPlanIsConfigured(weeklySplitPlan),
    [weeklySplitPlan],
  );

  const dataStepNumber = stepIndex - STEP_NAME + 1;

  const handleFinish = useCallback(async () => {
    if (isFinishing) return;

    const heightIn = profileHeightPickersToInches(heightFeet, heightInches);
    const currentWeightResult = parseRequiredPositive(currentWeightDraft, 'Current weight');
    const goalWeightResult = parseRequiredPositive(goalWeightDraft, 'Goal weight');

    if (!nameIsValid || heightIn == null || !currentWeightResult.ok || !goalWeightResult.ok || !splitIsValid) {
      Alert.alert('Setup incomplete', 'Please go back and fill in every step before continuing.');
      return;
    }

    setIsFinishing(true);
    try {
      await saveOnboardingProfile({
        name: nameDraft,
        heightIn,
        goalWeightLb: goalWeightResult.value,
        currentWeightLb: currentWeightResult.value,
      });
      await completeOnboarding();
    } catch (error) {
      console.warn('Failed to complete onboarding', error);
      Alert.alert('Setup failed', 'Could not save your profile. Please try again.');
      setIsFinishing(false);
    }
  }, [
    isFinishing,
    heightFeet,
    heightInches,
    nameDraft,
    nameIsValid,
    currentWeightDraft,
    goalWeightDraft,
    splitIsValid,
    saveOnboardingProfile,
    completeOnboarding,
  ]);

  if (stepIndex === STEP_WELCOME) {
    return (
      <OnboardingStepShell
        title="Welcome to your fitness assistant"
        body="A quick setup helps personalize your home screen, progress tracking, and weekly training targets."
        continueLabel="Get started"
        onContinue={goNext}>
        <View style={styles.onboardingWelcomeIcon}>
          <Text style={styles.onboardingWelcomeIconText}>💪</Text>
        </View>
      </OnboardingStepShell>
    );
  }

  if (stepIndex === STEP_NAME) {
    return (
      <OnboardingStepShell
        stepLabel={`Step ${dataStepNumber} of ${DATA_STEP_COUNT}`}
        title="What should we call you?"
        body="Your name appears on your profile and helps make the app feel like yours."
        continueDisabled={!nameIsValid}
        showBack
        onBack={goBack}
        onContinue={goNext}>
        <ProfileNameInput value={nameDraft} onChangeText={setNameDraft} placeholder="Enter your name" />
      </OnboardingStepShell>
    );
  }

  if (stepIndex === STEP_HEIGHT) {
    return (
      <OnboardingStepShell
        stepLabel={`Step ${dataStepNumber} of ${DATA_STEP_COUNT}`}
        title="How tall are you?"
        body="Height is used for BMI and other body metrics on your Progress tab."
        continueDisabled={!heightIsValid}
        showBack
        onBack={goBack}
        onContinue={goNext}>
        <ProfileHeightPickers
          feet={heightFeet}
          inches={heightInches}
          onChangeFeet={setHeightFeet}
          onChangeInches={setHeightInches}
          requireSelection
        />
      </OnboardingStepShell>
    );
  }

  if (stepIndex === STEP_CURRENT_WEIGHT) {
    return (
      <OnboardingStepShell
        stepLabel={`Step ${dataStepNumber} of ${DATA_STEP_COUNT}`}
        title="What's your current weight?"
        body="We'll log this as your starting point so you can track changes over time."
        continueDisabled={!currentWeightIsValid}
        showBack
        onBack={goBack}
        onContinue={goNext}>
        <ProfileCurrentWeightInput value={currentWeightDraft} onChangeText={setCurrentWeightDraft} />
      </OnboardingStepShell>
    );
  }

  if (stepIndex === STEP_GOAL_WEIGHT) {
    return (
      <OnboardingStepShell
        stepLabel={`Step ${dataStepNumber} of ${DATA_STEP_COUNT}`}
        title="What's your goal weight?"
        body="This target shows on Progress so you always know where you're headed."
        continueDisabled={!goalWeightIsValid}
        showBack
        onBack={goBack}
        onContinue={goNext}>
        <ProfileGoalWeightInput value={goalWeightDraft} onChangeText={setGoalWeightDraft} />
      </OnboardingStepShell>
    );
  }

  if (stepIndex === STEP_SPLIT) {
    return (
      <OnboardingStepShell
        stepLabel={`Step ${dataStepNumber} of ${DATA_STEP_COUNT}`}
        title="Plan your weekly split"
        body="Pick how many days you train and choose a split. You can change this anytime from More → Plan."
        continueDisabled={!splitIsValid}
        showBack
        onBack={goBack}
        onContinue={goNext}>
        <WeeklySplitPlanBuilder
          weeklySplitPlan={weeklySplitPlan}
          onChangeWeeklySplitPlan={handleChangeWeeklySplitPlan}
          theme={workoutTheme}
          hint="Select your training days per week, then tap a split template."
        />
      </OnboardingStepShell>
    );
  }

  return (
    <OnboardingStepShell
      title={`You're all set${nameDraft.trim() ? `, ${nameDraft.trim()}` : ''}!`}
      body="Your profile, weight log, and weekly split are ready. Tap below to open your home screen and log your first workout."
      continueLabel={isFinishing ? 'Saving…' : 'Start training'}
      continueDisabled={isFinishing}
      showBack
      onBack={goBack}
      onContinue={handleFinish}
    />
  );
}
