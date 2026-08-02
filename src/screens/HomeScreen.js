import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import ActionCard from '../components/ActionCard';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import AnimatedScore from '../components/AnimatedScore';
import { useUser } from '../context/UserContext';
import { useAnalyses } from '../hooks/useAnalyses';
import { scoreColor } from '../utils/scoreColor';

const formatDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const HomeScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useUser();
  const firstName = profile.name?.trim().split(' ')[0] || 'Kullanıcı';
  const { analyses, isLoading, refetch } = useAnalyses();
  const latestAnalysis = analyses[0];

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Merhaba, {firstName}! 👋</Text>
          <Text style={styles.subtitle}>Kariyer hedeflerinize bugün bir adım daha yaklaşın.</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <ActionCard
            title="CV Analizi"
            description="CV'nizi yükleyin ve analiz edin"
            icon="document-text"
            onPress={() => navigation.navigate('CV Analizi')}
          />
          <ActionCard
            title="Mülakat Simülasyonu"
            description="Yapay zeka ile mülakat pratiği yapın"
            icon="mic"
            onPress={() => navigation.navigate('Mülakat')}
          />
          <ActionCard
            title="LinkedIn Optimizasyonu"
            description="Profilinizi optimize edin"
            icon="logo-linkedin"
            onPress={() => navigation.navigate('LinkedIn')}
          />
        </View>

        {/* Recent Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Analiziniz</Text>
          {isLoading ? (
            <SkeletonCard />
          ) : latestAnalysis ? (
            <Card style={styles.historyCard}>
              <View style={styles.historyCardLeft}>
                <Text style={styles.historyTitle}>{latestAnalysis.file_name}</Text>
                <Text style={styles.historyDate}>Analiz Tarihi: {formatDate(latestAnalysis.created_at)}</Text>
              </View>
              <View style={styles.historyScore}>
                <AnimatedScore
                  value={latestAnalysis.score_general}
                  style={[styles.scoreValue, { color: scoreColor(latestAnalysis.score_general) }]}
                />
                <Text style={styles.scoreMax}>/ 100</Text>
              </View>
            </Card>
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="Henüz bir CV analizin yok"
              description="İlk CV'ni yükle, yapay zeka güçlü ve zayıf yönlerini saniyeler içinde ortaya çıkarsın."
              actionLabel="CV Yükle"
              onAction={() => navigation.navigate('CV Analizi')}
            />
          )}
        </View>
      </ScrollView>
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
      padding: 24,
    },
    header: {
      marginBottom: 32,
      marginTop: 20,
    },
    greeting: {
      ...typography.h2,
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: 16,
    },
    historyCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 0,
    },
    historyCardLeft: {
      flex: 1,
    },
    historyTitle: {
      ...typography.body,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    historyDate: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    historyScore: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    scoreValue: {
      ...typography.h2,
      color: colors.primary,
    },
    scoreMax: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: 2,
    },
  });

export default HomeScreen;
