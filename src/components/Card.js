import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '../context/ThemeContext';
import { cardShadow } from '../theme/shadow';

// Uygulama genelinde kullanılan standart kart yüzeyi (arka plan, kenarlık, gölge, boşluk).
const Card = ({ children, style }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
};

const createStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
      ...cardShadow,
    },
  });

export default Card;
