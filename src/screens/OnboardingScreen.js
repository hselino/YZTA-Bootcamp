import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { useUser } from '../context/UserContext';
import { ApiError } from '../services/api';
import Chip from '../components/Chip';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { EDUCATION_OPTIONS, ROLE_OPTIONS, EXPERIENCE_OPTIONS, PRIORITY_OPTIONS } from '../constants/profileOptions';

const TOTAL_STEPS = 3;

const OnboardingScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, saveProfileStep } = useUser();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name || '');
  const [egitimDurumu, setEgitimDurumu] = useState('');
  const [hedefRol, setHedefRol] = useState('');
  const [deneyimSeviyesi, setDeneyimSeviyesi] = useState('');
  const [oncelikler, setOncelikler] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const togglePriority = (option) => {
    setOncelikler((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const canContinue =
    !isSaving &&
    ((step === 0 && name.trim() && egitimDurumu) ||
      (step === 1 && hedefRol) ||
      (step === 2 && deneyimSeviyesi && oncelikler.length > 0));

  const stepPayload = () => {
    if (step === 0) return { name: name.trim(), education: egitimDurumu };
    if (step === 1) return { target_role: hedefRol };
    return { experience: deneyimSeviyesi, support_needs: oncelikler };
  };

  const handleNext = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await saveProfileStep(stepPayload());
      if (step < TOTAL_STEPS - 1) {
        setStep(step + 1);
      } else {
        navigation.replace('MainTabs');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          {step > 0 ? (
            <TouchableOpacity onPress={() => setStep(step - 1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Atla</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <>
              <Text style={styles.title}>Seni tanıyalım</Text>
              <Text style={styles.subtitle}>Adını ve eğitim durumunu öğrenip sana özel bir deneyim sunalım.</Text>
              <TextField placeholder="Adınız" value={name} onChangeText={setName} autoFocus />
              <Text style={styles.questionLabel}>Eğitim durumun nedir?</Text>
              <View style={styles.chipGroup}>
                {EDUCATION_OPTIONS.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={egitimDurumu === option}
                    onPress={() => setEgitimDurumu(option)}
                  />
                ))}
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.title}>Hedefin ne?</Text>
              <Text style={styles.subtitle}>CV'ni bu alana göre değerlendirelim.</Text>
              <View style={styles.chipGroup}>
                {ROLE_OPTIONS.map((option) => (
                  <Chip key={option} label={option} selected={hedefRol === option} onPress={() => setHedefRol(option)} />
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>Nerede duruyorsun?</Text>
              <Text style={styles.subtitle}>Deneyim seviyeni ve öncelikli ihtiyacını seçelim.</Text>
              <View style={styles.chipGroup}>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={deneyimSeviyesi === option}
                    onPress={() => setDeneyimSeviyesi(option)}
                  />
                ))}
              </View>
              <Text style={styles.questionLabel}>Öncelikli olarak ne için destek istiyorsun? (birden fazla seçebilirsin)</Text>
              <View style={styles.chipGroup}>
                {PRIORITY_OPTIONS.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={oncelikler.includes(option)}
                    onPress={() => togglePriority(option)}
                  />
                ))}
              </View>
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={step === TOTAL_STEPS - 1 ? 'Başla' : 'İleri'}
            onPress={handleNext}
            disabled={!canContinue}
            loading={isSaving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    dots: {
      flexDirection: 'row',
      gap: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 20,
    },
    skipText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    content: {
      flexGrow: 1,
      padding: 24,
      justifyContent: 'center',
    },
    title: {
      ...typography.h1,
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: 32,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      marginTop: 20,
    },
    questionLabel: {
      ...typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    chipGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    footer: {
      padding: 24,
    },
  });

export default OnboardingScreen;
