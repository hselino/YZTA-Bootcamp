import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const RoadmapStep = ({ title, description, progress, total, isLast, isActive }) => (
  <View style={styles.stepContainer}>
    <View style={styles.stepLeft}>
      <View style={[styles.stepCircle, isActive ? styles.stepCircleActive : styles.stepCircleInactive]}>
        {progress === total ? (
          <Ionicons name="checkmark" size={16} color={colors.white} />
        ) : (
          <Text style={[styles.stepNumber, isActive ? styles.stepNumberActive : styles.stepNumberInactive]}>
            {progress}/{total}
          </Text>
        )}
      </View>
      {!isLast && <View style={[styles.stepLine, isActive ? styles.stepLineActive : styles.stepLineInactive]} />}
    </View>
    <View style={styles.stepRight}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
      <Text style={styles.stepProgressText}>{progress} / {total} Tamamlandı</Text>
    </View>
  </View>
);

const RoadmapScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Kariyer Yol Haritası</Text>
        <Text style={styles.subtitle}>Hedeflerinize ulaşmanız için size özel yol haritası.</Text>

        <View style={styles.roadmapContainer}>
          <RoadmapStep 
            title="1. Aşama: Temel Güçlendirme" 
            description="Temel becerilerinizi geliştirin ve sağlam temeller atın." 
            progress={3} 
            total={3} 
            isActive={true} 
          />
          <RoadmapStep 
            title="2. Aşama: Deneyim Kazanımı" 
            description="Pratik yaparak deneyim kazanımınızı artırın." 
            progress={0} 
            total={4} 
            isActive={true} 
          />
          <RoadmapStep 
            title="3. Aşama: Uzmanlaşma" 
            description="Uzmanlık alanınızı belirleyin ve derinleşin." 
            progress={0} 
            total={3} 
            isActive={false} 
          />
          <RoadmapStep 
            title="4. Aşama: Kariyer Hedefi" 
            description="Hedeflerinize odaklanın ve ilerlemeye devam edin." 
            progress={0} 
            total={2} 
            isLast={true} 
            isActive={false} 
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
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  roadmapContainer: {
    marginTop: 16,
  },
  stepContainer: {
    flexDirection: 'row',
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleInactive: {
    backgroundColor: colors.primaryLight,
  },
  stepNumber: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepNumberInactive: {
    color: colors.primary,
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginVertical: -8, // Connects perfectly
    zIndex: 0,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepLineInactive: {
    backgroundColor: colors.border,
  },
  stepRight: {
    flex: 1,
    paddingBottom: 40,
  },
  stepTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  stepProgressText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default RoadmapScreen;
