import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useThemeColors } from '../context/ThemeContext';

// Yüklenirken 0'dan hedef genişliğe dolan skor çubuğu.
const AnimatedProgressBar = ({ value = 0, color, height = 12, style, duration = 900 }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors, height), [colors, height]);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.bg, style]}>
      <Animated.View style={[styles.fill, { width: widthInterpolated, backgroundColor: color || colors.primary }]} />
    </View>
  );
};

const createStyles = (colors, height) =>
  StyleSheet.create({
    bg: {
      height,
      backgroundColor: colors.primaryLight,
      borderRadius: height / 2,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: height / 2,
    },
  });

export default AnimatedProgressBar;
