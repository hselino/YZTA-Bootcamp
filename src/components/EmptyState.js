import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import PrimaryButton from './PrimaryButton';

// Liste/veri boş olduğunda gösterilen tutarlı durum: ikon + başlık + açıklama + opsiyonel aksiyon.
const EmptyState = ({ icon = 'file-tray-outline', title, description, actionLabel, onAction, style }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel ? (
        <PrimaryButton label={actionLabel} onPress={onAction} icon="add" style={styles.action} />
      ) : null}
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      ...typography.h3,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 6,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },
    action: {
      marginTop: 20,
      alignSelf: 'stretch',
    },
  });

export default EmptyState;
