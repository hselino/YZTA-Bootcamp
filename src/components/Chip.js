import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';

// Onboarding ve Mülakat kurulumunda kullanılan seçilebilir etiket.
const Chip = ({ label, selected, onPress }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={handlePress} activeOpacity={0.8}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    chip: {
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: { ...typography.body, color: colors.text },
    chipTextSelected: { color: colors.white, fontWeight: '600' },
  });

export default Chip;
