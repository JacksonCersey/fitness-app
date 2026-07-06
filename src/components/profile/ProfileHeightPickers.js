import React, { memo } from 'react';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { Platform, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  PROFILE_HEIGHT_FT_OPTIONS_MAX,
  PROFILE_HEIGHT_FT_OPTIONS_MIN,
  PROFILE_HEIGHT_FT_SENTINEL,
} from '../../../utils/workoutStats';

function ProfileHeightPickers({
  feet,
  inches,
  onChangeFeet,
  onChangeInches,
  requireSelection = false,
  hint = 'Choose your height in feet and inches.',
}) {
  const styles = useStyles();
  return (
    <View style={styles.profileCard}>
      <Text style={styles.profileLabel}>Height</Text>
      <Text style={styles.profileHint}>{hint}</Text>
      <View style={styles.heightPickerRow}>
        <View style={styles.heightPickerColumn}>
          <Text style={[styles.heightPickerCaption, styles.heightPickerCaptionSpaced]}>Feet</Text>
          <Picker
            selectedValue={feet}
            onValueChange={(value) => {
              const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
              onChangeFeet(Number.isNaN(n) ? PROFILE_HEIGHT_FT_SENTINEL : n);
            }}
            style={[
              styles.profileHeightPickerWheel,
              Platform.OS === 'ios' ? styles.profileHeightPickerWheelIOS : null,
            ]}
            itemStyle={styles.profileHeightPickerItemStyle}>
            {!requireSelection ? <Picker.Item label="Not set" value={PROFILE_HEIGHT_FT_SENTINEL} /> : null}
            {Array.from(
              { length: PROFILE_HEIGHT_FT_OPTIONS_MAX - PROFILE_HEIGHT_FT_OPTIONS_MIN + 1 },
              (_, idx) => PROFILE_HEIGHT_FT_OPTIONS_MIN + idx,
            ).map((ftOpt) => (
              <Picker.Item key={`ft-opt-${ftOpt}`} label={`${ftOpt} ft`} value={ftOpt} />
            ))}
          </Picker>
        </View>
        <View style={styles.heightPickerColumn}>
          <Text style={[styles.heightPickerCaption, styles.heightPickerCaptionSpaced]}>Inches</Text>
          <Picker
            enabled={feet >= PROFILE_HEIGHT_FT_OPTIONS_MIN}
            selectedValue={inches}
            onValueChange={(value) => {
              const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
              let next = Number.isNaN(n) ? 0 : n;
              if (next < 0) next = 0;
              if (next > 11) next = 11;
              onChangeInches(next);
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
    </View>
  );
}

export default memo(ProfileHeightPickers);
