import React, { memo } from 'react';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

function OnboardingStepShell({
  stepLabel,
  title,
  body,
  children,
  continueLabel = 'Continue',
  onContinue,
  continueDisabled = false,
  showBack = false,
  onBack,
}) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.onboardingScreen}>
      <ScrollView
        style={styles.profileScrollOuter}
        contentContainerStyle={styles.onboardingScrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.menuGradientTopGlow} pointerEvents="none" />
        <View style={styles.menuGradientBottomGlow} pointerEvents="none" />

        {stepLabel ? <Text style={styles.onboardingStepLabel}>{stepLabel}</Text> : null}
        <Text style={styles.onboardingTitle}>{title}</Text>
        {body ? <Text style={styles.onboardingBody}>{body}</Text> : null}
        {children}
      </ScrollView>

      <View style={styles.onboardingFooter}>
        <TouchableOpacity
          style={[
            styles.onboardingPrimaryButton,
            continueDisabled ? styles.onboardingPrimaryButtonDisabled : null,
          ]}
          onPress={onContinue}
          disabled={continueDisabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: continueDisabled }}>
          <Text style={styles.onboardingPrimaryButtonText}>{continueLabel}</Text>
        </TouchableOpacity>
        {showBack ? (
          <TouchableOpacity
            style={styles.onboardingSecondaryButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Text style={styles.onboardingSecondaryButtonText}>Back</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export default memo(OnboardingStepShell);
