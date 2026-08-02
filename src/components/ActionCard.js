import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { cardShadow } from '../theme/shadow';

const ActionCard = ({ title, description, icon, onPress }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...cardShadow,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      ...typography.h3,
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    description: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  });

export default ActionCard;
