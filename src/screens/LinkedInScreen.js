import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { linkedinAnalyze, ApiError } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import AnimatedScore from '../components/AnimatedScore';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import { scoreColor } from '../utils/scoreColor';

const splitLines = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);
const splitCommas = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);

const ScoreRow = ({ label, value, styles }) => (
  <View style={styles.categoryRow}>
    <Text style={styles.categoryLabel}>{label}</Text>
    <AnimatedProgressBar value={value} color={scoreColor(value)} style={{ flex: 1 }} />
    <Text style={styles.categoryValue}>{value}</Text>
  </View>
);

const LinkedInScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token } = useAuth();
  const { profile } = useUser();
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [hedefRol, setHedefRol] = useState(profile.target_role || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(route.params?.result ?? null);

  // Geçmiş sekmesinden bir kayda dokununca History ekranı bu ekrana yeni bir
  // "result" param'ı ile geliyor; ekran zaten açık olsa bile o sonucu göster.
  useEffect(() => {
    if (route.params?.result) {
      setResult(route.params.result);
    }
  }, [route.params?.result]);

  const canSubmit = (headline.trim() || about.trim() || experience.trim() || skills.trim()) && !isSubmitting;

  const handleAnalyze = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await linkedinAnalyze(
        {
          headline: headline.trim() || undefined,
          about: about.trim() || undefined,
          experience: splitLines(experience),
          skills: splitCommas(skills),
          hedef_rol: hedefRol.trim() || undefined,
        },
        token
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Analiz sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    const scorecard = result.puan_karnesi || {};
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <ScreenHeader title="LinkedIn Analizi" onBack={() => navigation.goBack()} />

          <Card>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreTitle}>Genel Puan</Text>
              <View style={styles.scoreValueContainer}>
                <AnimatedScore value={scorecard.genel_puan} style={[styles.scoreValue, { color: scoreColor(scorecard.genel_puan) }]} haptic />
                <Text style={styles.scoreMax}>/ 100</Text>
              </View>
            </View>
            <AnimatedProgressBar value={scorecard.genel_puan} color={scoreColor(scorecard.genel_puan)} />
          </Card>

          <Card>
            <SectionTitle icon="stats-chart-outline">Kategori Bazlı Skorlar</SectionTitle>
            <ScoreRow label="Profil Tamlığı" value={scorecard.profil_tamligi} styles={styles} />
            <ScoreRow label="Anahtar Kelime" value={scorecard.anahtar_kelime_uyumu} styles={styles} />
            <ScoreRow label="Sunum Kalitesi" value={scorecard.sunum_kalitesi} styles={styles} />
          </Card>

          {result.ozet_degerlendirme && (
            <Card>
              <SectionTitle icon="document-text-outline">Özet Değerlendirme</SectionTitle>
              <Text style={styles.bodyText}>{result.ozet_degerlendirme}</Text>
            </Card>
          )}

          {(result.guclu_yonler?.length > 0 || result.gelistirme_alanlari?.length > 0) && (
            <>
              {result.guclu_yonler?.length > 0 && (
                <Card>
                  <SectionTitle icon="checkmark-circle-outline">Güçlü Yönler</SectionTitle>
                  {result.guclu_yonler.map((item, idx) => (
                    <View key={idx} style={styles.insightRow}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} style={styles.insightIcon} />
                      <Text style={styles.insightText}>{item}</Text>
                    </View>
                  ))}
                </Card>
              )}
              {result.gelistirme_alanlari?.length > 0 && (
                <Card>
                  <SectionTitle icon="alert-circle-outline">Geliştirme Alanları</SectionTitle>
                  {result.gelistirme_alanlari.map((item, idx) => (
                    <View key={idx} style={styles.insightRow}>
                      <Ionicons name="alert-circle" size={20} color={colors.warning} style={styles.insightIcon} />
                      <Text style={styles.insightText}>{item}</Text>
                    </View>
                  ))}
                </Card>
              )}
            </>
          )}

          {result.onerilen_basliklar?.length > 0 && (
            <Card>
              <SectionTitle icon="create-outline">Önerilen Başlıklar</SectionTitle>
              {result.onerilen_basliklar.map((item, idx) => (
                <View key={idx} style={styles.insightRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.insightText}>{item}</Text>
                </View>
              ))}
            </Card>
          )}

          {result.onerilen_hakkimda && (
            <Card>
              <SectionTitle icon="person-outline">Önerilen "Hakkımda" Metni</SectionTitle>
              <Text style={styles.bodyText}>{result.onerilen_hakkimda}</Text>
            </Card>
          )}

          {result.anahtar_kelime_onerileri?.length > 0 && (
            <Card>
              <SectionTitle icon="pricetags-outline">Anahtar Kelime Önerileri</SectionTitle>
              <View style={styles.chipRow}>
                {result.anahtar_kelime_onerileri.map((item, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{item}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          <PrimaryButton
            label="Yeni Analiz Yap"
            icon="refresh"
            onPress={() => {
              setResult(null);
              navigation.setParams({ result: undefined });
            }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="LinkedIn Optimizasyonu" onBack={() => navigation.goBack()} />
          <Text style={styles.subtitle}>
            Profilindeki alanları doldur, yapay zeka aranabilirliğini ve sunumunu değerlendirsin.
          </Text>

          <Text style={styles.label}>Başlık (Headline)</Text>
          <TextField placeholder="Örn: Junior Frontend Developer" value={headline} onChangeText={setHeadline} />

          <Text style={styles.label}>Hakkımda</Text>
          <TextField
            placeholder="Mevcut 'Hakkımda' metnini yapıştır (boşsa boş bırakabilirsin)"
            value={about}
            onChangeText={setAbout}
            multiline
          />

          <Text style={styles.label}>Deneyim (her satıra bir kayıt)</Text>
          <TextField
            placeholder={'Örn:\nStaj - ABC Yazılım: Backend geliştirme yaptım'}
            value={experience}
            onChangeText={setExperience}
            multiline
          />

          <Text style={styles.label}>Beceriler (virgülle ayır)</Text>
          <TextField placeholder="Python, React, SQL" value={skills} onChangeText={setSkills} />

          <Text style={styles.label}>Hedef Rol</Text>
          <TextField placeholder="Örn: Backend Developer" value={hedefRol} onChangeText={setHedefRol} />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label="Profili Analiz Et"
            icon="sparkles"
            onPress={handleAnalyze}
            disabled={!canSubmit}
            loading={isSubmitting}
            style={{ marginTop: 8 }}
          />
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
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    label: {
      ...typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 4,
    },
    errorBox: {
      backgroundColor: colors.error + '15',
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
    },
    scoreHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    scoreTitle: { ...typography.h3, color: colors.text },
    scoreValueContainer: { flexDirection: 'row', alignItems: 'baseline' },
    scoreValue: { ...typography.h1, color: colors.primary },
    scoreMax: { ...typography.body, color: colors.textSecondary, marginLeft: 4 },
    bodyText: { ...typography.body, color: colors.textSecondary, lineHeight: 21 },
    categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    categoryLabel: { ...typography.caption, color: colors.text, width: 130 },
    categoryValue: { ...typography.caption, color: colors.textSecondary, width: 32, textAlign: 'right' },
    insightRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    insightIcon: { marginTop: 1 },
    bullet: { ...typography.body, color: colors.primary, fontWeight: 'bold' },
    insightText: { ...typography.body, color: colors.textSecondary, marginLeft: 10, flex: 1, lineHeight: 21 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
      backgroundColor: colors.primaryLight,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
    },
    tagText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  });

export default LinkedInScreen;
