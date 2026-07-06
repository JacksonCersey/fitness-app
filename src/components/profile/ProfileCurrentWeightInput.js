import React, { memo } from 'react';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { Text, TextInput, View } from 'react-native';

function ProfileCurrentWeightInput({
  value,
  onChangeText,
  hint = 'Your current body weight in pounds. This starts your weight log on Progress.',
}) {
  const styles = useStyles();
  return (
    <View style={styles.profileCard}>
      <Text style={styles.profileLabel}>Current weight (lb)</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Body weight"
        placeholderTextColor="rgba(238, 241, 255, 0.5)"
        style={styles.profileInput}
        keyboardType="decimal-pad"
        inputMode="decimal"
      />
      <Text style={styles.profileHint}>{hint}</Text>
    </View>
  );
}

export default memo(ProfileCurrentWeightInput);
