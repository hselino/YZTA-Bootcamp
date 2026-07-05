import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import ActionCard from '../components/ActionCard';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba, Sena! 👋</Text>
            <Text style={styles.subtitle}>Kariyer hedeflerinize bugün bir adım daha yaklaşın.</Text>
          </View>
          <View style={styles.avatarPlaceholder} />
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
            title="Kariyer Yol Haritası" 
            description="Size özel yol haritası oluşturun" 
            icon="map" 
            onPress={() => navigation.navigate('Roadmap')}
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
            onPress={() => console.log('LinkedIn')}
          />
        </View>

        {/* Recent Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Analiziniz</Text>
          <View style={styles.historyCard}>
            <View style={styles.historyCardLeft}>
              <Text style={styles.historyTitle}>Software Engineer CV</Text>
              <Text style={styles.historyDate}>Analiz Tarihi: 10 Mayıs 2025</Text>
            </View>
            <View style={styles.historyScore}>
              <Text style={styles.scoreValue}>78</Text>
              <Text style={styles.scoreMax}>/ 100</Text>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
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
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
