import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const CVUploadScreen = ({ navigation }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSelectFile = () => {
    // In a real app, use expo-document-picker
    setSelectedFile({ name: 'sena_cv.pdf', size: '512 KB' });
  };

  const handleStartAnalysis = () => {
    navigation.navigate('AnalysisLoading');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>CV Yükle</Text>
        <Text style={styles.subtitle}>CV'nizi yükleyin, yapay zeka ile analiz edelim.</Text>

        <TouchableOpacity style={styles.uploadArea} onPress={handleSelectFile}>
          <Ionicons name="cloud-upload-outline" size={48} color={colors.primary} />
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
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>{selectedFile.size}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedFile(null)}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.analyzeButton, !selectedFile && styles.analyzeButtonDisabled]}
          disabled={!selectedFile}
          onPress={handleStartAnalysis}
        >
          <Text style={styles.analyzeButtonText}>Analizi Başlat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '50', // with some transparency
    marginBottom: 24,
  },
  uploadText: {
    ...typography.h3,
    color: colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  uploadSubtext: {
    ...typography.body,
    color: colors.primary,
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
    marginBottom: 24,
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
  analyzeButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  analyzeButtonDisabled: {
    backgroundColor: colors.primaryLight,
  },
  analyzeButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default CVUploadScreen;
