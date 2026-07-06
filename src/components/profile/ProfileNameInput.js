import React, { memo } from 'react';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { Text, TextInput, View } from 'react-native';

function ProfileNameInput({ value, onChangeText, placeholder = 'Your name' }) {
  const styles = useStyles();
  const theme = useGameTheme();
  return (
    <View style={styles.profileCard}>
      <Text style={styles.profileLabel}>Your name</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholderText}
        style={styles.profileInput}
        autoCapitalize="words"
        returnKeyType="done"
      />
    </View>
  );
}

export default memo(ProfileNameInput);
