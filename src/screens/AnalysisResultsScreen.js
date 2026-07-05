import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const AnalysisResultsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Analiz Sonuçlarınız</Text>
        
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Genel Skorunuz</Text>
            <View style={styles.scoreValueContainer}>
              <Text style={styles.scoreValue}>85</Text>
              <Text style={styles.scoreMax}>/ 100</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '85%' }]} />
          </View>
        </View>

        <View style={styles.radarPlaceholder}>
          <Text style={styles.radarTitle}>Kategori Bazlı Skorlar</Text>
          <View style={styles.radarChart}>
            {/* Radar chart placeholder */}
            <Ionicons name="analytics" size={100} color={colors.primaryLight} />
            <Text style={{color: colors.textSecondary, marginTop: 10}}>Radar Grafiği</Text>
          </View>
        </View>

        <View style={styles.feedbackContainer}>
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Güçlü Yönleriniz</Text>
            <View style={styles.feedbackItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.feedbackText}>Teknik becerileriniz güçlü</Text>
            </View>
            <View style={styles.feedbackItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.feedbackText}>Proje deneyimleriniz iyi</Text>
            </View>
            <View style={styles.feedbackItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.feedbackText}>Sürekli öğrenmeye açıksınız</Text>
            </View>
          </View>

          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Geliştirmeniz Gereken Alanlar</Text>
            <View style={styles.feedbackItem}>
              <Ionicons name="alert-circle" size={20} color={colors.warning} />
              <Text style={styles.feedbackText}>Sertifika sayınızı artırabilirsiniz</Text>
            </View>
            <View style={styles.feedbackItem}>
              <Ionicons name="alert-circle" size={20} color={colors.warning} />
              <Text style={styles.feedbackText}>Soft skill'lerinizi geliştirebilirsiniz</Text>
            </View>
            <View style={styles.feedbackItem}>
              <Ionicons name="alert-circle" size={20} color={colors.warning} />
              <Text style={styles.feedbackText}>Daha fazla proje paylaşabilirsiniz</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Detaylı Rapora Görüntüle</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 24,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 24,
  },
  scoreCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
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
  progressBarBg: {
    height: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  radarPlaceholder: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    alignItems: 'center',
  },
  radarTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  radarChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  feedbackSection: {
    flex: 1,
  },
  feedbackTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  actionButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default AnalysisResultsScreen;
