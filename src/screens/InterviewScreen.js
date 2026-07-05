import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const InterviewScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mülakat Simülasyonu</Text>
          <Text style={styles.subtitle}>Yapay zeka ile mülakat pratiği yapın.</Text>
        </View>

        <View style={styles.controlsRow}>
          <View style={styles.controlBox}>
            <Text style={styles.controlLabel}>Pozisyon</Text>
            <Text style={styles.controlValue}>Software Engineer</Text>
          </View>
          <View style={styles.controlBox}>
            <Text style={styles.controlLabel}>Zorluk Seviyesi</Text>
            <Text style={styles.controlValue}>Orta</Text>
          </View>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionCounter}>Soru 1 / 8</Text>
          <Text style={styles.questionText}>Kendinizi kısaca tanıtır mısınız?</Text>
        </View>

        <View style={styles.wavePlaceholder}>
          {/* Decorative wave pattern */}
          {Array.from({ length: 40 }).map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.waveBar, 
                { height: 10 + Math.random() * 50 }
              ]} 
            />
          ))}
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.timer}>02:30</Text>
          <TouchableOpacity style={styles.recordButton}>
            <Text style={styles.recordButtonText}>Cevabınızı Kaydet</Text>
            <View style={styles.recordingDot} />
          </TouchableOpacity>
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
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  controlBox: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  controlValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
  },
  questionContainer: {
    marginBottom: 48,
  },
  questionCounter: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  questionText: {
    ...typography.h2,
    color: colors.text,
  },
  wavePlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 100,
    marginBottom: 48,
  },
  waveBar: {
    width: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    opacity: 0.6,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  timer: {
    ...typography.h2,
    color: colors.text,
  },
  recordButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
    marginRight: 12,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
  },
});

export default InterviewScreen;
