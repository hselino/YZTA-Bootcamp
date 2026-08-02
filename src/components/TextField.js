import React, { useMemo } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';

// Uygulama genelinde kullanılan standart metin girişi.
const TextField = ({ style, multiline, ...props }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TextInput
      style={[styles.input, multiline && styles.multiline, style]}
      placeholderTextColor={colors.textSecondary}
      multiline={multiline}
      {...props}
    />
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    input: {
      ...typography.body,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 16,
    },
    multiline: {
      minHeight: 90,
      textAlignVertical: 'top',
    },
  });

export default TextField;
