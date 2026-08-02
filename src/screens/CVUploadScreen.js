import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { useUser } from '../context/UserContext';
import PrimaryButton from '../components/PrimaryButton';

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};

const CVUploadScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useUser();
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSelectFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const file = result.assets[0];
    if (file.size && file.size > 10 * 1024 * 1024) {
      Alert.alert('Dosya çok büyük', 'Maksimum dosya boyutu 10MB.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFile({
      uri: file.uri,
      name: file.name,
      mimeType: file.mimeType,
      size: formatFileSize(file.size),
    });
  };

  const handleStartAnalysis = () => {
    navigation.navigate('AnalysisLoading', { file: selectedFile, hedefRol: profile.target_role });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>CV Yükle</Text>
        <Text style={styles.subtitle}>CV'nizi yükleyin, yapay zeka ile analiz edelim.</Text>

        <TouchableOpacity style={styles.uploadArea} onPress={handleSelectFile} activeOpacity={0.8}>
          <View style={styles.uploadIconCircle}>
            <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.uploadText}>Dosyanızı buraya sürükleyin</Text>
          <Text style={styles.uploadSubtext}>veya dosya seçin</Text>
          <Text style={styles.formats}>Desteklenen formatlar: PDF, DOCX (Max. 10MB)</Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.fileCard}>
            <View style={styles.fileIcon}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>{selectedFile.size}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedFile(null)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.spacer} />

        <PrimaryButton
          label="Analizi Başlat"
          icon="sparkles"
          onPress={handleStartAnalysis}
          disabled={!selectedFile}
        />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
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
    uploadArea: {
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      backgroundColor: colors.primaryLight + '50',
      marginBottom: 24,
    },
    uploadIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    uploadText: {
      ...typography.h3,
      color: colors.text,
      marginBottom: 4,
      textAlign: 'center',
    },
    uploadSubtext: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 16,
    },
    formats: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    fileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fileIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    fileInfo: {
      flex: 1,
      marginRight: 8,
    },
    fileName: {
      ...typography.body,
      fontWeight: 'bold',
      color: colors.text,
    },
    fileSize: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    spacer: {
      flex: 1,
    },
  });

export default CVUploadScreen;
