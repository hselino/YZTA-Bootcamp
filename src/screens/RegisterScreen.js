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
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import ScreenHeader from '../components/ScreenHeader';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { ApiError } from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { register, login } = useAuth();
  const { hasOnboarded } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = name.trim() && email.trim() && password.length >= 6 && !isSubmitting;

  const handleRegister = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
      // Backend kayıt olur olmaz hesabı onaylı açıyor (e-posta doğrulaması yok),
      // bu yüzden kullanıcıyı tekrar bilgi girdirmeden direkt içeri alıyoruz.
      await login(email.trim(), password);
      navigation.replace(hasOnboarded ? 'MainTabs' : 'Onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title="Hesap Oluştur"
            onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Landing'))}
          />

          <Text style={styles.title}>Aramıza Katıl</Text>
          <Text style={styles.subtitle}>CV'ni analiz etmeye başlamak için bir hesap oluştur.</Text>

          <TextField placeholder="Ad Soyad" value={name} onChangeText={setName} autoCapitalize="words" />
          <TextField
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField
            placeholder="Şifre (en az 6 karakter)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton label="Kayıt Ol" onPress={handleRegister} disabled={!canSubmit} loading={isSubmitting} style={{ marginTop: 8 }} />

          <PrimaryButton
            label="Zaten hesabın var mı? Giriş Yap"
            variant="outline"
            onPress={() => navigation.replace('Login')}
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

export default RegisterScreen;
