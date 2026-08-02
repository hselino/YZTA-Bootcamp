import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useAnalyses } from '../hooks/useAnalyses';
import { useLinkedinAnalyses } from '../hooks/useLinkedinAnalyses';
import { useInterviews } from '../hooks/useInterviews';
import { ApiError } from '../services/api';
import { EDUCATION_OPTIONS, ROLE_OPTIONS, EXPERIENCE_OPTIONS, PRIORITY_OPTIONS } from '../constants/profileOptions';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import Chip from '../components/Chip';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { scoreColor } from '../utils/scoreColor';

const StatTile = ({ icon, value, label, styles }) => (
  <View style={styles.statTile}>
    <View style={styles.statIconCircle}>
      <Ionicons name={icon} size={18} color={styles.statIcon.color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ProfileScreen = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { email, logout } = useAuth();
  const { profile, saveProfileStep } = useUser();
  const { analyses: cvAnalyses } = useAnalyses();
  const { analyses: linkedinAnalyses } = useLinkedinAnalyses();
  const { interviews } = useInterviews();

  const avgCvScore = cvAnalyses.length
    ? Math.round(cvAnalyses.reduce((sum, a) => sum + (a.score_general || 0), 0) / cvAnalyses.length)
    : null;

  const [name, setName] = useState(profile.name || '');
  const [education, setEducation] = useState(profile.education || '');
  const [targetRole, setTargetRole] = useState(profile.target_role || '');
  const [experience, setExperience] = useState(profile.experience || '');
  const [supportNeeds, setSupportNeeds] = useState(profile.support_needs || []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedJustNow, setSavedJustNow] = useState(false);

  const isDirty =
    name !== (profile.name || '') ||
    education !== (profile.education || '') ||
    targetRole !== (profile.target_role || '') ||
    experience !== (profile.experience || '') ||
    JSON.stringify(supportNeeds) !== JSON.stringify(profile.support_needs || []);

  const initial = (name || email || '?').charAt(0).toUpperCase();

  const toggleSupportNeed = (option) => {
    setSupportNeeds((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]));
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await saveProfileStep({
        name: name.trim(),
        education,
        target_role: targetRole,
        experience,
        support_needs: supportNeeds,
      });
      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkış yapmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Text style={styles.name}>{name || 'İsimsiz Kullanıcı'}</Text>
            {email ? <Text style={styles.email}>{email}</Text> : null}
          </View>

          <Card>
            <SectionTitle icon="stats-chart-outline">İstatistiklerin</SectionTitle>
            <View style={styles.statsRow}>
              <StatTile icon="document-text-outline" value={cvAnalyses.length} label="CV Analizi" styles={styles} />
              <StatTile icon="logo-linkedin" value={linkedinAnalyses.length} label="LinkedIn" styles={styles} />
              <StatTile icon="mic-outline" value={interviews.length} label="Mülakat" styles={styles} />
            </View>
            {avgCvScore !== null ? (
              <View style={styles.avgScoreRow}>
                <Text style={styles.avgScoreLabel}>Ortalama CV Skorun</Text>
                <Text style={[styles.avgScoreValue, { color: scoreColor(avgCvScore) }]}>{avgCvScore}/100</Text>
              </View>
            ) : null}
          </Card>

          <Card>
            <SectionTitle icon="person-outline">Ad Soyad</SectionTitle>
            <TextField placeholder="Adın" value={name} onChangeText={setName} style={{ marginBottom: 0 }} />
          </Card>

          <Card>
            <SectionTitle icon="school-outline">Eğitim Durumu</SectionTitle>
            <View style={styles.chipGroup}>
              {EDUCATION_OPTIONS.map((option) => (
                <Chip key={option} label={option} selected={education === option} onPress={() => setEducation(option)} />
              ))}
            </View>
          </Card>

          <Card>
            <SectionTitle icon="briefcase-outline">Hedef Rol</SectionTitle>
            <View style={styles.chipGroup}>
              {ROLE_OPTIONS.map((option) => (
                <Chip key={option} label={option} selected={targetRole === option} onPress={() => setTargetRole(option)} />
              ))}
            </View>
          </Card>

          <Card>
            <SectionTitle icon="trending-up-outline">Deneyim Seviyesi</SectionTitle>
            <View style={styles.chipGroup}>
              {EXPERIENCE_OPTIONS.map((option) => (
                <Chip key={option} label={option} selected={experience === option} onPress={() => setExperience(option)} />
              ))}
            </View>
          </Card>

          <Card>
            <SectionTitle icon="heart-outline">Öncelikli İhtiyaçlar</SectionTitle>
            <View style={styles.chipGroup}>
              {PRIORITY_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={supportNeeds.includes(option)}
                  onPress={() => toggleSupportNeed(option)}
                />
              ))}
            </View>
          </Card>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={savedJustNow ? 'Kaydedildi ✓' : 'Değişiklikleri Kaydet'}
            icon={savedJustNow ? 'checkmark' : 'save-outline'}
            onPress={handleSave}
            disabled={!isDirty}
            loading={isSaving}
            style={{ marginBottom: 12 }}
          />

          <PrimaryButton label="Çıkış Yap" icon="log-out-outline" variant="outline" onPress={handleLogout} style={styles.logoutButton} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    container: { padding: 24, flexGrow: 1 },
    header: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 32,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarText: {
      ...typography.h1,
      color: colors.white,
    },
    name: {
      ...typography.h2,
      color: colors.text,
    },
    email: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statTile: {
      flex: 1,
      alignItems: 'center',
    },
    statIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statIcon: {
      color: colors.primary,
    },
    statValue: {
      ...typography.h3,
      color: colors.text,
    },
    statLabel: {
      ...typography.small,
      color: colors.textSecondary,
      marginTop: 2,
    },
    avgScoreRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    avgScoreLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    avgScoreValue: {
      ...typography.body,
      fontWeight: 'bold',
    },
    chipGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    errorBox: {
      backgroundColor: colors.error + '15',
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
    },
    logoutButton: {
      borderColor: colors.error + '40',
    },
  });

export default ProfileScreen;
