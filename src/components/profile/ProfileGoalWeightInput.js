import React, { memo } from 'react';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { Text, TextInput, View } from 'react-native';

function ProfileGoalWeightInput({
  value,
  onChangeText,
  hint = 'Your target body weight in pounds.',
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  return (
    <View style={styles.profileCard}>
      <Text style={styles.profileLabel}>Goal weight (lb)</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Target body weight"
        placeholderTextColor={theme.placeholderText}
        style={styles.profileInput}
        keyboardType="decimal-pad"
        inputMode="decimal"
      />
      <Text style={styles.profileHint}>{hint}</Text>
    </View>
  );
}

export default memo(ProfileGoalWeightInput);
