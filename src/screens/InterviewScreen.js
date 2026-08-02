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
import { startInterview, submitInterviewAnswer, finishInterview, ApiError } from '../services/api';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import Chip from '../components/Chip';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import AnimatedScore from '../components/AnimatedScore';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import { scoreColor } from '../utils/scoreColor';

const DIFFICULTY_OPTIONS = ['Kolay', 'Orta', 'Zor'];

const ScoreRow = ({ label, value, styles }) => (
  <View style={styles.categoryRow}>
    <Text style={styles.categoryLabel}>{label}</Text>
    <AnimatedProgressBar value={value} color={scoreColor(value)} style={{ flex: 1 }} />
    <Text style={styles.categoryValue}>{value}</Text>
  </View>
);

const InterviewScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token } = useAuth();
  const { profile } = useUser();

  const [phase, setPhase] = useState(route.params?.report ? 'report' : 'setup'); // 'setup' | 'question' | 'report'
  const [position, setPosition] = useState(profile.target_role || '');
  const [difficulty, setDifficulty] = useState('Orta');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [report, setReport] = useState(route.params?.report ?? null);

  // Geçmiş sekmesinden bir mülakat raporuna dokununca History bu tab'a yeni bir
  // "report" param'ı ile geliyor; ekran zaten açık olsa bile o raporu göster.
  useEffect(() => {
    if (route.params?.report) {
      setReport(route.params.report);
      setPhase('report');
    }
  }, [route.params?.report]);

  const resetAll = () => {
    navigation.setParams({ report: undefined });
    setPhase('setup');
    setInterviewId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswerText('');
    setFeedback(null);
    setReport(null);
    setError(null);
  };

  const handleStart = async () => {
    if (!position.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      const data = await startInterview({ position: position.trim(), difficulty }, token);
      setInterviewId(data.interview_id);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setPhase('question');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Mülakat başlatılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      const data = await submitInterviewAnswer(
        interviewId,
        { questionIndex: currentIndex, answerText: answerText.trim() },
        token
      );
      setFeedback(data.degerlendirme);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cevap değerlendirilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setAnswerText('');
    setFeedback(null);
    setCurrentIndex((i) => i + 1);
  };

  const handleFinish = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await finishInterview(interviewId, token);
      setReport(data);
      setPhase('report');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Rapor oluşturulamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  if (phase === 'setup') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>Mülakat Simülasyonu</Text>
              <Text style={styles.subtitle}>Yapay zeka ile mülakat pratiği yapın.</Text>
            </View>

            <Text style={styles.label}>Pozisyon</Text>
            <TextField placeholder="Örn: Software Engineer" value={position} onChangeText={setPosition} />

            <Text style={styles.label}>Zorluk Seviyesi</Text>
            <View style={styles.chipGroup}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <Chip key={option} label={option} selected={difficulty === option} onPress={() => setDifficulty(option)} />
              ))}
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton
              label="Mülakata Başla"
              icon="mic"
              onPress={handleStart}
              disabled={!position.trim()}
              loading={isLoading}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (phase === 'question') {
    const isLast = currentIndex === questions.length - 1;
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.questionContainer}>
              <Text style={styles.questionCounter}>Soru {currentIndex + 1} / {questions.length}</Text>
              <Text style={styles.questionText}>{questions[currentIndex]}</Text>
            </View>

            <TextField
              placeholder="Cevabını buraya yaz..."
              value={answerText}
              onChangeText={setAnswerText}
              multiline
              editable={!feedback}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!feedback ? (
              <PrimaryButton
                label="Cevabı Gönder"
                icon="send"
                onPress={handleSubmitAnswer}
                disabled={!answerText.trim()}
                loading={isLoading}
              />
            ) : (
              <>
                <Card>
                  <View style={styles.feedbackScoreRow}>
                    <SectionTitle icon="analytics-outline" style={{ marginBottom: 0 }}>Değerlendirme</SectionTitle>
                    <Text style={[styles.feedbackScore, { color: scoreColor(feedback.puan) }]}>{feedback.puan}/100</Text>
                  </View>
                  <Text style={styles.bodyText}>{feedback.geri_bildirim}</Text>
                  <Text style={styles.feedbackLabel}>Güçlü nokta</Text>
                  <Text style={styles.bodyText}>{feedback.guclu_nokta}</Text>
                  <Text style={styles.feedbackLabel}>Geliştirme önerisi</Text>
                  <Text style={styles.bodyText}>{feedback.gelistirme_onerisi}</Text>
                </Card>

                <PrimaryButton
                  label={isLast ? 'Mülakatı Bitir' : 'Sonraki Soru'}
                  icon={isLast ? 'checkmark-done' : 'arrow-forward'}
                  onPress={isLast ? handleFinish : handleNext}
                  loading={isLoading}
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // phase === 'report'
  const scorecard = report?.puan_karnesi || {};
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Mülakat Raporu</Text>

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
          <ScoreRow label="İletişim Becerisi" value={scorecard.iletisim_becerisi} styles={styles} />
          <ScoreRow label="Teknik Yeterlilik" value={scorecard.teknik_yeterlilik} styles={styles} />
          <ScoreRow label="Özgüven & Akıcılık" value={scorecard.ozguven_ve_akicilik} styles={styles} />
        </Card>

        {report?.genel_degerlendirme && (
          <Card>
            <SectionTitle icon="document-text-outline">Genel Değerlendirme</SectionTitle>
            <Text style={styles.bodyText}>{report.genel_degerlendirme}</Text>
          </Card>
        )}

        {report?.guclu_yonler?.length > 0 && (
          <Card>
            <SectionTitle icon="checkmark-circle-outline">Güçlü Yönler</SectionTitle>
            {report.guclu_yonler.map((item, idx) => (
              <View key={idx} style={styles.insightRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} style={styles.insightIcon} />
                <Text style={styles.insightText}>{item}</Text>
              </View>
            ))}
          </Card>
        )}

        {report?.gelistirilmesi_gerekenler?.length > 0 && (
          <Card>
            <SectionTitle icon="alert-circle-outline">Geliştirilmesi Gerekenler</SectionTitle>
            {report.gelistirilmesi_gerekenler.map((item, idx) => (
              <View key={idx} style={styles.insightRow}>
                <Ionicons name="alert-circle" size={20} color={colors.warning} style={styles.insightIcon} />
                <Text style={styles.insightText}>{item}</Text>
              </View>
            ))}
          </Card>
        )}

        {report?.soru_bazli_ozet?.length > 0 && (
          <Card>
            <SectionTitle icon="list-outline">Soru Bazlı Özet</SectionTitle>
            {report.soru_bazli_ozet.map((item, idx) => (
              <View key={idx} style={styles.summaryItem}>
                <Text style={styles.summaryQuestion}>{item.soru}</Text>
                <Text style={styles.summaryNote}>{item.kisa_not} — {item.puan}/100</Text>
              </View>
            ))}
          </Card>
        )}

        {report?.genel_tavsiye && (
          <Card>
            <SectionTitle icon="bulb-outline">Genel Tavsiye</SectionTitle>
            <Text style={styles.bodyText}>{report.genel_tavsiye}</Text>
          </Card>
        )}

        <PrimaryButton label="Yeni Mülakat Başlat" icon="refresh" onPress={resetAll} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    container: { padding: 24, flexGrow: 1 },
    header: { marginBottom: 32, marginTop: 20 },
    title: { ...typography.h2, color: colors.text, marginBottom: 8 },
    subtitle: { ...typography.body, color: colors.textSecondary },
    label: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 4 },
    chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
    errorBox: {
      backgroundColor: colors.error + '15',
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    errorText: { ...typography.caption, color: colors.error },
    questionContainer: { marginBottom: 24 },
    questionCounter: { ...typography.body, color: colors.primary, fontWeight: 'bold', marginBottom: 16 },
    questionText: { ...typography.h2, color: colors.text },
    bodyText: { ...typography.body, color: colors.textSecondary, marginBottom: 8, lineHeight: 21 },
    feedbackScoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    feedbackScore: { ...typography.h3 },
    feedbackLabel: { ...typography.caption, fontWeight: 'bold', color: colors.text, marginTop: 8, marginBottom: 4 },
    scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    scoreTitle: { ...typography.h3, color: colors.text },
    scoreValueContainer: { flexDirection: 'row', alignItems: 'baseline' },
    scoreValue: { ...typography.h1, color: colors.primary },
    scoreMax: { ...typography.body, color: colors.textSecondary, marginLeft: 4 },
    categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    categoryLabel: { ...typography.caption, color: colors.text, width: 150 },
    categoryValue: { ...typography.caption, color: colors.textSecondary, width: 32, textAlign: 'right' },
    insightRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    insightIcon: { marginTop: 1 },
    insightText: { ...typography.body, color: colors.textSecondary, marginLeft: 10, flex: 1, lineHeight: 21 },
    summaryItem: { marginBottom: 12 },
    summaryQuestion: { ...typography.caption, fontWeight: '600', color: colors.text, marginBottom: 2 },
    summaryNote: { ...typography.caption, color: colors.textSecondary },
  });

export default InterviewScreen;
