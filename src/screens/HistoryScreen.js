import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useAnalyses } from '../hooks/useAnalyses';
import { useLinkedinAnalyses } from '../hooks/useLinkedinAnalyses';
import { useInterviews } from '../hooks/useInterviews';
import { getAnalysisDetail, getLinkedinAnalysisDetail, getInterviewDetail, ApiError } from '../services/api';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { scoreColor } from '../utils/scoreColor';

const formatDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const TABS = [
  { key: 'cv', label: 'CV', icon: 'document-text-outline' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin' },
  { key: 'interview', label: 'Mülakat', icon: 'mic-outline' },
];

const TabBar = ({ active, onChange, styles }) => (
  <View style={styles.tabBar}>
    {TABS.map((tab) => {
      const isActive = active === tab.key;
      return (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabItem, isActive && styles.tabItemActive]}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.8}
        >
          <Ionicons name={tab.icon} size={16} color={isActive ? styles.tabLabelActive.color : styles.tabLabel.color} />
          <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const HistoryItem = ({ title, subtitle, date, score, onPress, isLoading, colors, styles }) => (
  <TouchableOpacity onPress={onPress} disabled={isLoading} activeOpacity={0.8}>
    <Card style={styles.historyCard}>
      <View style={[styles.scoreBadge, { backgroundColor: scoreColor(score) + '20' }]}>
        <Text style={[styles.scoreBadgeText, { color: scoreColor(score) }]}>{score}</Text>
      </View>
      <View style={styles.historyLeft}>
        <Text style={styles.historyTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.historyDate}>{subtitle ? `${subtitle} · ` : ''}{date}</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </Card>
  </TouchableOpacity>
);

const HistoryScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('cv');
  const [openingId, setOpeningId] = useState(null);
  const [detailError, setDetailError] = useState(null);

  const cv = useAnalyses();
  const linkedin = useLinkedinAnalyses();
  const interview = useInterviews();

  useFocusEffect(
    useCallback(() => {
      cv.refetch();
      linkedin.refetch();
      interview.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const handleOpenCv = async (id) => {
    setDetailError(null);
    setOpeningId(id);
    try {
      const result = await getAnalysisDetail(id, token);
      navigation.navigate('CV Analizi', { screen: 'AnalysisResults', params: { result } });
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : 'Analiz detayı açılamadı.');
    } finally {
      setOpeningId(null);
    }
  };

  const handleOpenLinkedin = async (id) => {
    setDetailError(null);
    setOpeningId(id);
    try {
      const result = await getLinkedinAnalysisDetail(id, token);
      navigation.navigate('LinkedIn', { result });
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : 'LinkedIn analizi açılamadı.');
    } finally {
      setOpeningId(null);
    }
  };

  const handleOpenInterview = async (id) => {
    setDetailError(null);
    setOpeningId(id);
    try {
      const detail = await getInterviewDetail(id, token);
      navigation.navigate('Mülakat', { report: detail.report });
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : 'Mülakat detayı açılamadı.');
    } finally {
      setOpeningId(null);
    }
  };

  const active = activeTab === 'cv' ? cv : activeTab === 'linkedin' ? linkedin : interview;
  const items = activeTab === 'cv' ? cv.analyses : activeTab === 'linkedin' ? linkedin.analyses : interview.interviews;
  const showSkeleton = active.isLoading && items.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={active.isLoading} onRefresh={active.refetch} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Geçmişim</Text>
        <Text style={styles.subtitle}>Daha önce yaptığınız analiz ve pratiklere göz atın.</Text>

        <TabBar active={activeTab} onChange={setActiveTab} styles={styles} />

        {active.error ? <Text style={styles.errorText}>{active.error}</Text> : null}
        {detailError ? <Text style={styles.errorText}>{detailError}</Text> : null}

        {showSkeleton && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!active.isLoading && items.length === 0 && !active.error && activeTab === 'cv' && (
          <EmptyState
            icon="document-text-outline"
            title="Henüz bir CV analizin yok"
            description="CV'ni analiz ettiğinde sonuçların burada birikecek."
            actionLabel="CV Yükle"
            onAction={() => navigation.navigate('CV Analizi')}
          />
        )}

        {!active.isLoading && items.length === 0 && !active.error && activeTab === 'linkedin' && (
          <EmptyState
            icon="logo-linkedin"
            title="Henüz bir LinkedIn analizin yok"
            description="Profilini analiz ettirdiğinde sonuçların burada birikecek."
            actionLabel="Profilimi Analiz Et"
            onAction={() => navigation.navigate('LinkedIn')}
          />
        )}

        {!active.isLoading && items.length === 0 && !active.error && activeTab === 'interview' && (
          <EmptyState
            icon="mic-outline"
            title="Henüz bir mülakat pratiğin yok"
            description="Mülakat simülasyonu yaptığında raporların burada birikecek."
            actionLabel="Mülakata Başla"
            onAction={() => navigation.navigate('Mülakat')}
          />
        )}

        {activeTab === 'cv' &&
          items.map((item) => (
            <HistoryItem
              key={item.id}
              title={item.file_name}
              date={formatDate(item.created_at)}
              score={item.score_general}
              isLoading={openingId === item.id}
              onPress={() => handleOpenCv(item.id)}
              colors={colors}
              styles={styles}
            />
          ))}

        {activeTab === 'linkedin' &&
          items.map((item) => (
            <HistoryItem
              key={item.id}
              title={item.target_role || 'LinkedIn Analizi'}
              date={formatDate(item.created_at)}
              score={item.score_general}
              isLoading={openingId === item.id}
              onPress={() => handleOpenLinkedin(item.id)}
              colors={colors}
              styles={styles}
            />
          ))}

        {activeTab === 'interview' &&
          items.map((item) => (
            <HistoryItem
              key={item.id}
              title={item.position}
              subtitle={item.difficulty}
              date={formatDate(item.created_at)}
              score={item.overall_score}
              isLoading={openingId === item.id}
              onPress={() => handleOpenInterview(item.id)}
              colors={colors}
              styles={styles}
            />
          ))}
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
      flexGrow: 1,
    },
    title: {
      ...typography.h2,
      color: colors.text,
      marginBottom: 8,
      marginTop: 20,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
      marginBottom: 24,
    },
    tabItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 9,
    },
    tabItemActive: {
      backgroundColor: colors.primary,
    },
    tabLabel: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabLabelActive: {
      color: colors.white,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      marginBottom: 16,
    },
    historyCard: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    scoreBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    scoreBadgeText: {
      ...typography.body,
      fontWeight: 'bold',
    },
    historyLeft: {
      flex: 1,
      marginRight: 8,
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
  });

export default HistoryScreen;
