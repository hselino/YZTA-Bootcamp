import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useThemeColors } from '../context/ThemeContext';

// Tek bir shimmer bloğu — kart/liste/skor yer tutucularında kullanılır.
export const SkeletonBlock = ({ width = '100%', height = 16, borderRadius = 8, style }) => {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.border, opacity },
        style,
      ]}
    />
  );
};

// Geçmiş/analiz kartı biçiminde bir yer tutucu — HistoryScreen ve HomeScreen'de kullanılır.
export const SkeletonCard = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <SkeletonBlock width={44} height={44} borderRadius={22} />
      <View style={styles.textCol}>
        <SkeletonBlock width="70%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonBlock width="45%" height={12} />
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 20,
    },
    textCol: {
      flex: 1,
      marginLeft: 14,
    },
  });

export default SkeletonCard;
