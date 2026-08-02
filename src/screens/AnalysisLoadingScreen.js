import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { uploadCv } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

const AnalysisLoadingScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { file, hedefRol } = route.params || {};
  const { token } = useAuth();
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const runAnalysis = useCallback(async () => {
    setError(null);
    try {
      const result = await uploadCv(file, { hedefRol, token });
      if (isMounted.current) navigation.replace('AnalysisResults', { result });
    } catch (err) {
      if (isMounted.current) setError(err.message || 'Analiz sırasında bir hata oluştu.');
    }
  }, [file, hedefRol, token, navigation]);

  useEffect(() => {
    if (!file) {
      setError('Yüklenecek bir dosya bulunamadı.');
      return;
    }
    runAnalysis();
  }, [file, runAnalysis]);

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScreenHeader title="Analiz" onBack={() => navigation.goBack()} />
          <View style={styles.header}>
            <Ionicons name="alert-circle" size={48} color={colors.error} style={{ marginBottom: 16 }} />
            <Text style={styles.title}>Analiz Başarısız</Text>
            <Text style={styles.subtitle}>{error}</Text>
          </View>
          <PrimaryButton label="Tekrar Dene" onPress={runAnalysis} style={{ width: '100%' }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader title="Analiz" onBack={() => navigation.goBack()} />
        <View style={styles.header}>
          <Text style={styles.title}>CV'niz Analiz Ediliyor...</Text>
          <Text style={styles.subtitle}>Yapay zeka CV'nizi inceliyor, lütfen bekleyin.</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>

        <Card style={styles.stepsCard}>
          <View style={styles.step}>
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8, marginLeft: 4 }} />
            <Text style={styles.stepTextActive}>CV metni çıkarılıyor ve analiz ediliyor</Text>
          </View>
        </Card>
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
      borderTopColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepsCard: {
      width: '100%',
      marginBottom: 0,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepTextActive: {
      ...typography.body,
      color: colors.primary,
      fontWeight: 'bold',
      marginLeft: 8,
    },
  });

export default AnalysisLoadingScreen;
