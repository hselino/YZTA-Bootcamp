import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const HistoryItem = ({ title, date, score }) => (
  <View style={styles.historyCard}>
    <View style={styles.historyLeft}>
      <Text style={styles.historyTitle}>{title}</Text>
      <Text style={styles.historyDate}>{date} - {score}/100</Text>
    </View>
    <TouchableOpacity style={styles.detailButton}>
      <Text style={styles.detailButtonText}>Detayları Gör</Text>
    </TouchableOpacity>
  </View>
);

const HistoryScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Geçmiş Analizlerim</Text>
        <Text style={styles.subtitle}>Daha önce yaptığınız analizlere göz atın.</Text>

        <View style={styles.listContainer}>
          <HistoryItem 
            title="Software Engineer CV"
            date="10 Mayıs 2025"
            score="85"
          />
          <HistoryItem 
            title="Data Analyst CV"
            date="28 Nisan 2025"
            score="72"
          />
          <HistoryItem 
            title="Product Manager CV"
            date="15 Nisan 2025"
            score="68"
          />
          <HistoryItem 
            title="Web Developer CV"
            date="5 Nisan 2025"
            score="80"
          />
        </View>
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
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  listContainer: {
    gap: 16,
  },
  historyCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyLeft: {
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
  detailButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  detailButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default HistoryScreen;
