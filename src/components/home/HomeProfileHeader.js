import React, { memo, useMemo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { formatWeekdayShort, startOfLocalDay } from '../../utils/homeDashboard';

/**
 * @param {{
 *   onOpenProfile: () => void;
 *   sessionTitle: string;
 *   showBackToToday: boolean;
 *   onBackToToday: () => void;
 * }} props
 */
function HomeProfileHeader({ onOpenProfile, sessionTitle, showBackToToday, onBackToToday }) {
  const styles = useStyles();
  const today = useMemo(() => startOfLocalDay(new Date()), []);

  return (
    <View style={styles.homeTopHeaderRow}>
      <View style={styles.homeTopHeaderLeft}>
        <TouchableOpacity
          style={styles.menuProfileButtonSmall}
          activeOpacity={0.88}
          onPress={onOpenProfile}
          accessibilityRole="button"
          accessibilityLabel="Open profile">
          <Image
            source={require('../../../assets/images/icons/profileicon.png')}
            style={styles.menuProfileIconSmall}
          />
        </TouchableOpacity>
        <Text style={styles.homeSessionTitle} numberOfLines={2}>
          {sessionTitle}
        </Text>
      </View>

      <View style={styles.homeTopDateCol} accessibilityLabel={`Today, ${today.toLocaleDateString()}`}>
        <Text style={styles.homeTopDateWeekday}>{formatWeekdayShort(today)}</Text>
        <Text style={styles.homeTopDateNumber}>{today.getDate()}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.homeTopBackToTodayButton,
          !showBackToToday && styles.homeTopBackToTodayButtonHidden,
        ]}
        activeOpacity={0.85}
        onPress={onBackToToday}
        disabled={!showBackToToday}
        accessibilityRole="button"
        accessibilityLabel="Return to today"
        accessibilityElementsHidden={!showBackToToday}
        importantForAccessibility={showBackToToday ? 'yes' : 'no-hide-descendants'}
        pointerEvents={showBackToToday ? 'auto' : 'none'}>
        <Text style={styles.homeTopBackToTodayText}>‹</Text>
      </TouchableOpacity>
    </View>
  );
}

export default memo(HomeProfileHeader);
