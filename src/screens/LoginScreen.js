import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import ScreenHeader from '../components/ScreenHeader';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { ApiError } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { login, sessionExpired, clearSessionExpired } = useAuth();
  const { hasOnboarded } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = email.trim() && password.length > 0 && !isSubmitting;

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      clearSessionExpired();
      navigation.replace(hasOnboarded ? 'MainTabs' : 'Onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Giriş sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title="Giriş Yap"
            onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Landing'))}
          />

          <Text style={styles.title}>Tekrar Hoş Geldin</Text>
          <Text style={styles.subtitle}>Devam etmek için hesabına giriş yap.</Text>

          {sessionExpired ? (
            <View style={styles.sessionBox}>
              <Text style={styles.sessionText}>Oturumunun süresi doldu, güvenliğin için tekrar giriş yapman gerekiyor.</Text>
            </View>
          ) : null}

          <TextField
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField placeholder="Şifre" value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotLink}>
            <Text style={styles.forgotLinkText}>Şifremi Unuttum</Text>
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton label="Giriş Yap" onPress={handleLogin} disabled={!canSubmit} loading={isSubmitting} style={{ marginTop: 8 }} />

          <PrimaryButton
            label="Hesabın yok mu? Kayıt Ol"
            variant="outline"
            onPress={() => navigation.replace('Register')}
            style={{ marginTop: 12 }}
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
    title: { ...typography.h1, color: colors.text, marginBottom: 8, marginTop: 12 },
    subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: 32 },
    forgotLink: {
      alignSelf: 'flex-end',
      marginBottom: 20,
    },
    forgotLinkText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
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
    sessionBox: {
      backgroundColor: colors.warning + '15',
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    sessionText: {
      ...typography.caption,
      color: colors.warning,
    },
  });

export default LoginScreen;
