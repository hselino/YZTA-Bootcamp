import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const AnalysisLoadingScreen = ({ navigation }) => {
  useEffect(() => {
    // Simulate analysis loading time
    const timer = setTimeout(() => {
      navigation.replace('AnalysisResults');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>CV'niz Analiz Ediliyor...</Text>
          <Text style={styles.subtitle}>Yapay zeka CV'nizi inceliyor, lütfen bekleyin.</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>%75</Text>
          </View>
        </View>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.stepTextCompleted}>CV metni çıkarılıyor</Text>
          </View>
          <View style={styles.step}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.stepTextCompleted}>Yetenekler analiz ediliyor</Text>
          </View>
          <View style={styles.step}>
            <ActivityIndicator size="small" color={colors.primary} style={{marginRight: 8, marginLeft: 4}} />
            <Text style={styles.stepTextActive}>Deneyimler değerlendiriliyor</Text>
          </View>
          <View style={styles.step}>
            <Ionicons name="ellipse-outline" size={24} color={colors.border} />
            <Text style={styles.stepTextPending}>Skor hesaplanıyor</Text>
          </View>
          <View style={styles.step}>
            <Ionicons name="ellipse-outline" size={24} color={colors.border} />
            <Text style={styles.stepTextPending}>Sonuçlar hazırlanıyor</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 20,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 48,
  },
  progressCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: colors.primary,
    borderTopColor: colors.primaryLight, // Simulate progress
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    ...typography.h1,
    color: colors.text,
  },
  stepsContainer: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTextCompleted: {
    ...typography.body,
    color: colors.text,
    marginLeft: 12,
  },
  stepTextActive: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  stepTextPending: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: 12,
  },
});

export default AnalysisLoadingScreen;
