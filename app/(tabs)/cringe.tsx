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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Send, Sparkles } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AnimatedMeter from '@/components/AnimatedMeter';
import LoadingSpinner from '@/components/LoadingSpinner';
import { analyzeCringe, CringeAnalysis } from '@/lib/gemini';

export default function CringePalScreen() {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState<CringeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim() && !selectedImage) {
      Alert.alert('Error', 'Please enter some text or select an image to analyze');
      return;
    }

    setLoading(true);
    try {
      const result = await analyzeCringe(input, selectedImage || undefined);
      setAnalysis(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to capture images');
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
      setInput('Image selected for analysis');
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setInput('');
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
        colors={['#f093fb', '#f5576c']}
        style={styles.header}
      >
        <Text style={styles.headerIcon}>🔥</Text>
        <Text style={styles.title}>Cringe Pal</Text>
        <Text style={styles.subtitle}>Hot or Cringe? Let's find out!</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Brave enough to check your vibe?</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type something to analyze..."
              placeholderTextColor="#999"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
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
                  <Text style={styles.imageButtonText}>📁</Text>
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
                  <LoadingSpinner />
                ) : (
                  <>
                    <Send size={16} color="white" />
                    <Text style={styles.analyzeButtonText}>Analyze</Text>
                  </>
                )}
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {analysis && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Analysis Results</Text>
            
            <AnimatedMeter
              label="Hot Level"
              value={analysis.hotLevel}
              maxValue={100}
              color={['#ff6b6b', '#ff8e53']}
              icon="🔥"
            />
            
            <AnimatedMeter
              label="Cringe Level"
              value={analysis.cringeLevel}
              maxValue={100}
              color={['#a8e6cf', '#7fcdcd']}
              icon="😬"
            />

            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <Sparkles size={20} color="#007AFF" />
                <Text style={styles.analysisTitle}>AI Analysis</Text>
              </View>
              <Text style={styles.analysisText}>{analysis.analysis}</Text>
            </View>

            {analysis.tips && analysis.tips.length > 0 && (
              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>💡 Tips to Reduce Cringe</Text>
                {analysis.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Text style={styles.tipNumber}>{index + 1}.</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.exampleSection}>
          <Text style={styles.sectionTitle}>Try These Examples</Text>
          {[
            "Just posted a gym selfie with the caption 'beast mode activated' 💪",
            "Wearing sunglasses indoors at a coffee shop",
            "Using 'doggo' and 'pupper' unironically in every sentence"
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
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
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
  imageButtonText: {
    fontSize: 20,
  },
  cameraButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
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
  resultsSection: {
    marginBottom: 32,
  },
  analysisCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  },
  analysisText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    lineHeight: 24,
  },
  tipsCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#856404',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipNumber: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#856404',
    marginRight: 8,
    minWidth: 20,
  },
  tipText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#856404',
    flex: 1,
    lineHeight: 22,
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