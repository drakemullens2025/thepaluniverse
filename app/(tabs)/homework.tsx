import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Send, Upload, BookOpen } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import IQSlider from '../../components/IQSlider';
import { generateHomeworkHelp, HomeworkAnalysis } from '@/lib/gemini';

export default function HomeworkPalScreen() {
  const [input, setInput] = useState('');
  const [iqLevel, setIqLevel] = useState(120); // Default to mid-range
  const [analysis, setAnalysis] = useState<HomeworkAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim() && !selectedImage) {
      Alert.alert('Input Required', 'Please enter a homework question or upload an image to get help.');
      return;
    }

    setLoading(true);
    setAnalysis(null);
    try {
      const result = await generateHomeworkHelp(input, iqLevel, selectedImage || undefined);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      Alert.alert('Analysis Failed', 'Could not analyze your homework. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to capture homework images');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setInput('Image uploaded for homework help');
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (input === 'Image uploaded for homework help') {
      setInput('');
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.captureButton}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#43e97b', '#38f9d7']}
        style={styles.header}
      >
        <Text style={styles.headerIcon}>📚</Text>
        <Text style={styles.title}>Homework Pal</Text>
        <Text style={styles.subtitle}>Your intelligent homework companion</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>What homework needs help?</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your homework question or problem..."
              placeholderTextColor="#999"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
            />
            <View style={styles.inputActions}>
              {selectedImage && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.clearImageButton} onPress={clearImage}>
                    <Text style={styles.clearImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={handleImagePicker}
                >
                  <Upload size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={handleCameraPress}
                >
                  <Camera size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
                  onPress={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Send size={16} color="white" />
                      <Text style={styles.analyzeButtonText}>Get Help</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sliderSection}>
          <Text style={styles.sectionTitle}>Writing Style Adaptation</Text>
          <View style={styles.proprietaryBadge}>
            <Text style={styles.proprietaryText}>🔬 Proprietary Feature</Text>
            <Text style={styles.proprietarySubtext}>
              Tailors responses to match your natural academic writing style
            </Text>
          </View>
          <IQSlider
            value={iqLevel}
            onValueChange={setIqLevel}
            min={100}
            max={160}
          />
        </View>

        {analysis && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Homework Help</Text>
            
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <BookOpen size={20} color="#43e97b" />
                <Text style={styles.analysisTitle}>Solution & Explanation</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>IQ {analysis.adaptedLevel}</Text>
                </View>
              </View>
              <Text style={styles.analysisText}>{analysis.solution}</Text>
            </View>

            {analysis.stepByStep && analysis.stepByStep.length > 0 && (
              <View style={styles.stepsCard}>
                <Text style={styles.stepsTitle}>📝 Step-by-Step Breakdown</Text>
                {analysis.stepByStep.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {analysis.keyPoints && analysis.keyPoints.length > 0 && (
              <View style={styles.keyPointsCard}>
                <Text style={styles.keyPointsTitle}>💡 Key Learning Points</Text>
                {analysis.keyPoints.map((point, index) => (
                  <View key={index} style={styles.keyPointItem}>
                    <Text style={styles.keyPointBullet}>•</Text>
                    <Text style={styles.keyPointText}>{point}</Text>
                  </View>
                ))}
              </View>
            )}

            {analysis.writingStyle && (
              <View style={styles.styleCard}>
                <Text style={styles.styleTitle}>✍️ Writing Style Analysis</Text>
                <Text style={styles.styleText}>{analysis.writingStyle}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.exampleSection}>
          <Text style={styles.sectionTitle}>Try These Examples</Text>
          {[
            "Explain the causes of World War I and their interconnections",
            "Solve this calculus problem: Find the derivative of f(x) = x³ + 2x² - 5x + 1",
            "Analyze the themes in Shakespeare's Hamlet and their relevance today"
          ].map((example, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleCard}
              onPress={() => setInput(example)}
            >
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
  paddingHorizontal: 32,
  paddingTop: 20,
  paddingBottom: 24,
  borderBottomLeftRadius: 30,
  borderBottomRightRadius: 30,
  // The 'alignItems: center' line is removed
},
headerIcon: { // You can delete this style block entirely since it's no longer used
  fontSize: 40,
  marginBottom: 8,
},
title: {
  fontSize: 32, // Increased to match
  fontFamily: 'Inter-Bold',
  color: 'white',
  marginBottom: 4,
  textAlign: 'center', // Added to match
},
subtitle: {
  fontSize: 16,
  fontFamily: 'Inter-Regular',
  color: 'rgba(255, 255, 255, 0.9)',
  textAlign: 'center', // Added to match
},
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  textInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1a1a1a',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  inputActions: {
    flexDirection: 'column',
    gap: 12,
  },
  imagePreview: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  clearImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#e8f4fd',
    marginRight: 8,
  },
  cameraButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43e97b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  sliderSection: {
    marginBottom: 32,
  },
  proprietaryBadge: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#43e97b',
  },
  proprietaryText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2d5a3d',
    marginBottom: 4,
  },
  proprietarySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4a6b4a',
    lineHeight: 20,
  },
  resultsSection: {
    marginBottom: 32,
  },
  analysisCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#43e97b',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  analysisTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1a1a1a',
    flex: 1,
  },
  levelBadge: {
    backgroundColor: '#43e97b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  analysisText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#333',
    lineHeight: 24,
  },
  stepsCard: {
    backgroundColor: '#f8f9ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  stepsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    backgroundColor: '#007AFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  stepText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  keyPointsCard: {
    backgroundColor: '#fff9e6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  keyPointsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  keyPointItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  keyPointBullet: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffc107',
    marginRight: 8,
    marginTop: 2,
  },
  keyPointText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  styleCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  styleTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  styleText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#333',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  exampleSection: {
    marginBottom: 32,
  },
  exampleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exampleText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
});