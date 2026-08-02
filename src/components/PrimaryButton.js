import React, { useMemo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';

// Uygulama genelinde kullanılan standart aksiyon butonu.
// variant="outline" ikincil aksiyonlar için (örn. "Atla", "Geri").
const PrimaryButton = ({ label, onPress, disabled, loading, icon, variant = 'primary', style }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isOutline = variant === 'outline';

  const handlePress = (event) => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      style={[styles.button, isOutline && styles.outline, disabled && !isOutline && styles.disabled, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.white} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={20} color={isOutline ? colors.primary : colors.white} /> : null}
          <Text style={[styles.label, isOutline && styles.outlineLabel]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    disabled: {
      backgroundColor: colors.primaryLight,
    },
    label: {
      ...typography.body,
      color: colors.white,
      fontWeight: 'bold',
    },
    outlineLabel: {
      color: colors.text,
    },
  });

export default PrimaryButton;
