import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameTheme } from '../app/context/ThemeStylesContext';

const STARS = [
  { top: '6%', left: '8%', size: 16, opacity: 0.42, char: '✦', tint: 'coral' },
  { top: '14%', left: '78%', size: 22, opacity: 0.28, char: '★', tint: 'sky' },
  { top: '22%', left: '42%', size: 12, opacity: 0.35, char: '✧', tint: 'gold' },
  { top: '31%', left: '18%', size: 10, opacity: 0.5, char: '✦', tint: 'coral' },
  { top: '38%', left: '88%', size: 14, opacity: 0.32, char: '☆', tint: 'sky' },
  { top: '48%', left: '6%', size: 18, opacity: 0.25, char: '★', tint: 'gold' },
  { top: '55%', left: '62%', size: 11, opacity: 0.45, char: '✦', tint: 'coral' },
  { top: '63%', left: '28%', size: 15, opacity: 0.3, char: '✧', tint: 'sky' },
  { top: '72%', left: '82%', size: 20, opacity: 0.22, char: '★', tint: 'gold' },
  { top: '78%', left: '12%', size: 13, opacity: 0.38, char: '☆', tint: 'coral' },
  { top: '86%', left: '48%', size: 17, opacity: 0.26, char: '✦', tint: 'sky' },
  { top: '92%', left: '72%', size: 10, opacity: 0.4, char: '✧', tint: 'gold' },
  { top: '18%', left: '55%', size: 9, opacity: 0.55, char: '✦', tint: 'coral' },
  { top: '68%', left: '44%', size: 12, opacity: 0.33, char: '☆', tint: 'sky' },
];

function MenuStarfieldBackground() {
  const theme = useGameTheme();
  const starColors = {
    coral: theme.cardBorderCoral,
    sky: theme.cardBorderSky,
    gold: theme.streakGold,
  };

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={[styles.washTop, { backgroundColor: theme.glowTop }]} />
      <View style={[styles.washBottom, { backgroundColor: theme.glowBottom }]} />
      {STARS.map((star, index) => (
        <Text
          key={`star-${index}`}
          style={[
            styles.star,
            {
              top: star.top,
              left: star.left,
              fontSize: star.size,
              opacity: star.opacity,
              color: starColors[star.tint],
            },
          ]}>
          {star.char}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  washTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  washBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  star: {
    position: 'absolute',
    fontWeight: '400',
  },
});

export default memo(MenuStarfieldBackground);
