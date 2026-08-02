import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';

// Kart başlıklarında tutarlı ikon + başlık düzeni.
const SectionTitle = ({ icon, children, style }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.row, style]}>
      {icon ? <Ionicons name={icon} size={18} color={colors.primary} /> : null}
      <Text style={styles.title}>{children}</Text>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    title: { ...typography.h3, color: colors.text },
  });

export default SectionTitle;
