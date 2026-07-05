import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const LandingScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logoText}>🤖 AI Career Coach</Text>
        </View>
        
        <Text style={styles.title}>
          Kariyer Yolculuğunda Yapay Zeka Destekli Akıllı Rehberin
        </Text>
        <Text style={styles.subtitle}>
          CV'nizi analiz edin, güçlü yönlerinizi keşfedin, kişiselleştirilmiş kariyer önerileri alın ve hedeflerinize daha hızlı ulaşın.
        </Text>

        <View style={styles.illustrationContainer}>
          {/* Placeholder for illustration */}
          <View style={styles.illustrationPlaceholder}>
            <Text style={{color: colors.primary, fontWeight: 'bold'}}>CV Analysis</Text>
          </View>
        </View>

      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.replace('MainTabs')}
        >
          <Text style={styles.primaryButtonText}>Ücretsiz Başla</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Nasıl Çalışır?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  logoText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: 16,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 40,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});

export default LandingScreen;
