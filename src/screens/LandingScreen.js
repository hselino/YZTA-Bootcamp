import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import PrimaryButton from '../components/PrimaryButton';

const LandingScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logoText}>🤖 AI Career Coach</Text>
          </View>

          <Text style={styles.title}>
            Kariyer Yolculuğunda Yapay Zeka Destekli Akıllı Rehberin
          </Text>
          <Text style={styles.subtitle}>
            CV'nizi analiz edin, güçlü yönlerinizi keşfedin, kişiselleştirilmiş kariyer önerileri alın ve hedeflerinize daha hızlı ulaşın.
          </Text>

          <View style={styles.illustrationContainer}>
            <View style={styles.illustrationCircle}>
              <Ionicons name="document-text" size={72} color={colors.primary} />
              <View style={styles.illustrationBadge}>
                <Ionicons name="sparkles" size={20} color={colors.white} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton label="Ücretsiz Başla" onPress={() => navigation.navigate('Register')} />
          <PrimaryButton
            label="Zaten Hesabım Var"
            variant="outline"
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 24,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    header: {
      marginBottom: 40,
    },
    logoText: {
      ...typography.h3,
      color: colors.primary,
      fontWeight: 'bold',
    },
    title: {
      ...typography.h1,
      color: colors.text,
      marginBottom: 16,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 40,
    },
    illustrationContainer: {
      alignItems: 'center',
      marginVertical: 20,
    },
    illustrationCircle: {
      width: 200,
      height: 200,
      backgroundColor: colors.primaryLight,
      borderRadius: 100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    illustrationBadge: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },
    footer: {
      marginBottom: 20,
    },
  });

export default LandingScreen;
