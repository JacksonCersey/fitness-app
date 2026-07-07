import React, { memo } from 'react';
import { Alert, Animated, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAppStorage } from '../app/context/AppStorageContext';
import { useGameTheme, useStyles } from '../app/context/ThemeStylesContext';

function AppearanceScreen({ screenTransitionOpacity, onBack }) {
  const styles = useStyles();
  const theme = useGameTheme();
  const {
    resetAllUserData,
    activeDevUserId,
    devUserOptions,
    switchDevUser,
  } = useAppStorage();

  const handleResetAllData = () => {
    Alert.alert(
      'Reset all app data?',
      'This deletes workouts, profile, goals, and settings. You will go through setup again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetAllUserData().catch((error) => {
              console.warn('Failed to reset app data', error);
              Alert.alert('Reset failed', 'Could not clear saved data. Try again.');
            });
          },
        },
      ],
    );
  };

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
            <Text style={styles.menuSubscreenNavTitle}>Appearance</Text>
          </View>

          <Text style={[styles.menuMoreBodyText, { marginBottom: 16 }]}>
            Testing or starting over
          </Text>
          <TouchableOpacity
            style={[styles.menuPrimaryButton, { backgroundColor: theme.destructive }]}
            onPress={handleResetAllData}
            accessibilityRole="button"
            accessibilityLabel="Reset all app data">
            <Text style={[styles.menuPrimaryButtonText, { color: theme.primaryButtonText }]}>Reset all app data</Text>
          </TouchableOpacity>

          {__DEV__ ? (
            <>
              <Text style={[styles.menuMoreBodyText, { marginTop: 28, marginBottom: 8 }]}>
                Dev: test users
              </Text>
              <Text style={[styles.menuMoreBodyText, { marginBottom: 12 }]}>
                Switch between saved personas to preview the app with different workout data. Your real data stays
                separate under &quot;My data&quot;.
              </Text>
              {devUserOptions.map((option) => {
                const isSelected = (activeDevUserId ?? null) === (option.id ?? null);
                return (
                  <TouchableOpacity
                    key={option.id ?? 'real'}
                    style={[
                      styles.profileCard,
                      {
                        marginBottom: 10,
                        borderColor: isSelected ? theme.accentSolid : theme.cardBorder,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => {
                      switchDevUser(option.id).catch((error) => {
                        console.warn('Dev user switch failed', error);
                      });
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Switch to ${option.label}`}>
                    <Text style={[styles.menuMoreLinkTitle, { color: theme.textPrimary }]}>{option.label}</Text>
                    <Text style={[styles.menuMoreLinkSubtitle, { color: theme.textMuted }]}>{option.description}</Text>
                    {isSelected ? (
                      <Text
                        style={[
                          styles.menuMoreLinkSubtitle,
                          { color: theme.accentSolid, marginTop: 8, fontWeight: '700' },
                        ]}>
                        Active
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </>
          ) : null}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(AppearanceScreen);
