import React, { memo } from 'react';
import { Animated, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

function AppearanceScreen({ screenTransitionOpacity, onBack }) {
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
              <Text style={[styles.workoutCloseButtonText, { color: '#4B3CC1' }]}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.menuSubscreenNavTitle}>Appearance</Text>
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.menuMoreBodyText}>
              Light and dark mode options are temporarily removed while we update the new color scheme.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(AppearanceScreen);
