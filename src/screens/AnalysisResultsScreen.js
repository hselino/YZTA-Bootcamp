import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import PrimaryButton from '../components/PrimaryButton';
import EmptyState from '../components/EmptyState';
import AnimatedScore from '../components/AnimatedScore';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import { scoreColor } from '../utils/scoreColor';

const AnalysisResultsScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const result = route.params?.result;

  if (!result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
          <ScreenHeader title="Analiz Sonuçları" onBack={() => navigation.goBack()} />
        </View>
        <EmptyState
          icon="document-text-outline"
          title="Henüz bir analiz sonucu yok"
          description="Bir CV yükleyip analiz ettiğinde sonuçlar burada görünecek."
        />
      </SafeAreaView>
    );
  }

  const {
    puan_karnesi: scorecard,
    guclu_yonler: strengths = [],
    eksikler_ve_cozumler: gaps = [],
    ozet_degerlendirme: summary,
    hedef_role_uygunluk: roleFit,
    duzeltme_onerileri: fixSuggestions,
  } = result;

  const fixSections = [
    { key: 'eklenmeli', label: 'Eklenmeli', icon: 'add-circle', color: colors.success, items: fixSuggestions?.eklenmeli },
    { key: 'cikarilmali', label: 'Çıkarılmalı', icon: 'remove-circle', color: colors.error, items: fixSuggestions?.cikarilmali },
    { key: 'guncellenmeli', label: 'Güncellenmeli', icon: 'sync-circle', color: colors.warning, items: fixSuggestions?.guncellenmeli },
  ].filter((section) => section.items?.length);

  const overallScore = scorecard?.genel_puan ?? 0;
  const overallColor = scoreColor(overallScore);
  const categoryScores = [
    { label: 'ATS Uyumu', value: scorecard?.ats_uyumu },
    { label: 'Teknik Beceri', value: scorecard?.teknik_beceri },
    { label: 'Etki Odaklılık', value: scorecard?.etki_odaklilik },
  ].filter((c) => typeof c.value === 'number');

  const handleShare = () => {
    const lines = [
      `CV Analiz Sonucum — ${overallScore}/100`,
      summary ? `\n${summary}` : '',
      strengths.length ? `\nGüçlü yönler:\n${strengths.map((s) => `• ${s}`).join('\n')}` : '',
    ].filter(Boolean);
    Share.share({ message: lines.join('\n') });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Analiz Sonuçları" onBack={() => navigation.goBack()} />

        <Card>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Genel Skorunuz</Text>
            <View style={styles.scoreValueContainer}>
              <AnimatedScore value={overallScore} style={[styles.scoreValue, { color: overallColor }]} haptic />
              <Text style={styles.scoreMax}>/ 100</Text>
            </View>
          </View>
          <AnimatedProgressBar value={overallScore} color={overallColor} />
        </Card>

        {summary ? (
          <Card>
            <SectionTitle icon="document-text-outline">Özet Değerlendirme</SectionTitle>
            <Text style={styles.summaryText}>{summary}</Text>
            {roleFit ? <Text style={[styles.summaryText, styles.roleFitText]}>{roleFit}</Text> : null}
          </Card>
        ) : null}

        {categoryScores.length > 0 && (
          <Card>
            <SectionTitle icon="stats-chart-outline">Kategori Bazlı Skorlar</SectionTitle>
            {categoryScores.map((c) => (
              <View key={c.label} style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>{c.label}</Text>
                <AnimatedProgressBar value={c.value} color={scoreColor(c.value)} style={{ flex: 1 }} />
                <Text style={styles.categoryValue}>{c.value}</Text>
              </View>
            ))}
          </Card>
        )}

        {strengths.length > 0 && (
          <Card>
            <SectionTitle icon="checkmark-circle-outline">Güçlü Yönleriniz</SectionTitle>
            {strengths.map((item, idx) => (
              <View key={idx} style={styles.insightRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} style={styles.insightIcon} />
                <Text style={styles.insightText}>{item}</Text>
              </View>
            ))}
          </Card>
        )}

        {gaps.length > 0 && (
          <Card>
            <SectionTitle icon="alert-circle-outline">Geliştirmeniz Gereken Alanlar</SectionTitle>
            {gaps.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.gapItem,
                  idx === gaps.length - 1 && { marginBottom: 0, paddingBottom: 0, borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.insightRow}>
                  <Ionicons name="alert-circle" size={20} color={colors.warning} style={styles.insightIcon} />
                  <Text style={styles.insightText}>{item.eksik}</Text>
                </View>
                {item.cozum ? (
                  <View style={styles.solutionRow}>
                    <Text style={styles.solutionLabel}>Çözüm  </Text>
                    <Text style={styles.solutionText}>{item.cozum}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </Card>
        )}

        {fixSections.length > 0 && (
          <Card>
            <SectionTitle icon="construct-outline">Düzeltme Önerileri</SectionTitle>
            {fixSections.map((section, sIdx) => (
              <View key={section.key} style={[styles.fixSection, sIdx === 0 && { marginTop: 0 }]}>
                <Text style={[styles.fixSectionLabel, { color: section.color }]}>{section.label}</Text>
                {section.items.map((item, idx) => (
                  <View key={idx} style={styles.insightRow}>
                    <Ionicons name={section.icon} size={20} color={section.color} style={styles.insightIcon} />
                    <Text style={styles.insightText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </Card>
        )}

        <PrimaryButton label="Sonuçları Paylaş" icon="share-outline" onPress={handleShare} style={{ marginBottom: 12 }} />

        <PrimaryButton
          label="Ana Sayfaya Dön"
          icon="home-outline"
          variant="outline"
          onPress={() => {
            navigation.popToTop();
            navigation.navigate('Ana Sayfa');
          }}
        />
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
    scoreHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    scoreTitle: {
      ...typography.h3,
      color: colors.text,
    },
    scoreValueContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    scoreValue: {
      ...typography.h1,
      color: colors.primary,
    },
    scoreMax: {
      ...typography.body,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryLabel: {
      ...typography.caption,
      color: colors.text,
      width: 110,
    },
    categoryValue: {
      ...typography.caption,
      color: colors.textSecondary,
      width: 32,
      textAlign: 'right',
    },
    summaryText: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    roleFitText: {
      marginTop: 12,
    },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    insightIcon: {
      marginTop: 1,
    },
    insightText: {
      ...typography.body,
      color: colors.textSecondary,
      marginLeft: 10,
      flex: 1,
      lineHeight: 21,
    },
    gapItem: {
      marginBottom: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    solutionRow: {
      flexDirection: 'row',
      marginLeft: 30,
      backgroundColor: colors.primaryLight,
      borderRadius: 10,
      padding: 12,
    },
    solutionLabel: {
      ...typography.caption,
      fontWeight: 'bold',
      color: colors.primary,
    },
    solutionText: {
      ...typography.caption,
      color: colors.text,
      flex: 1,
      lineHeight: 18,
    },
    fixSection: {
      marginTop: 16,
    },
    fixSectionLabel: {
      ...typography.body,
      fontWeight: 'bold',
      marginBottom: 10,
    },
  });

export default AnalysisResultsScreen;
