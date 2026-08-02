import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import ScreenHeader from '../components/ScreenHeader';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { forgotPassword, resetPassword, ApiError } from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleRequestCode = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setStep('reset');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kod gönderilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(email.trim(), token.trim(), newPassword);
      setStep('done');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Şifre güncellenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title="Şifremi Unuttum"
            onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Landing'))}
          />

          {step === 'request' && (
            <>
              <Text style={styles.title}>Şifreni mi unuttun?</Text>
              <Text style={styles.subtitle}>
                Hesabına kayıtlı e-posta adresini gir, sana 6 haneli bir sıfırlama kodu gönderelim.
              </Text>

              <TextField
                placeholder="E-posta"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <PrimaryButton
                label="Kod Gönder"
                onPress={handleRequestCode}
                disabled={!email.trim() || isSubmitting}
                loading={isSubmitting}
                style={{ marginTop: 8 }}
              />
            </>
          )}

          {step === 'reset' && (
            <>
              <Text style={styles.title}>Kodu Gir</Text>
              <Text style={styles.subtitle}>
                {email.trim()} adresine bir kod gönderdik (kayıtlıysa). Kodu ve yeni şifreni aşağıya gir.
              </Text>

              <TextField
                placeholder="6 haneli kod"
                value={token}
                onChangeText={setToken}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TextField
                placeholder="Yeni şifre (en az 6 karakter)"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <PrimaryButton
                label="Şifreyi Güncelle"
                onPress={handleResetPassword}
                disabled={!token.trim() || newPassword.length < 6 || isSubmitting}
                loading={isSubmitting}
                style={{ marginTop: 8 }}
              />

              <PrimaryButton
                label="Kodu Tekrar Gönder"
                variant="outline"
                onPress={handleRequestCode}
                disabled={isSubmitting}
                style={{ marginTop: 12 }}
              />
            </>
          )}

          {step === 'done' && (
            <>
              <Text style={styles.title}>Şifren Güncellendi ✓</Text>
              <Text style={styles.subtitle}>
                Yeni şifrenle giriş yapabilirsin.
              </Text>

              <PrimaryButton
                label="Giriş Ekranına Dön"
                onPress={() => navigation.replace('Login')}
                style={{ marginTop: 8 }}
              />
            </>
          )}
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
    title: { ...typography.h1, color: colors.text, marginBottom: 8, marginTop: 12 },
    subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: 32, lineHeight: 21 },
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
  });

export default ForgotPasswordScreen;
