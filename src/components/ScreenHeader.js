import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';

// Ekranlarda tutarlı geri butonu + başlık için ortak header.
const ScreenHeader = ({ title, onBack, rightAction }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.rightSlot}>{rightAction}</View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      width: '100%',
      paddingHorizontal: 8,
      paddingBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      ...typography.h3,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 8,
    },
    rightSlot: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default ScreenHeader;
