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
import { Camera, Send, Upload } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

// --- Import your custom components and logic ---
// FIX: Corrected the import path for the IntensitySlider component
import IntensitySlider from '../../components/IntensitySlider';
// import LoadingSpinner from '@/components/LoadingSpinner'; // If you have a custom one
// This is the corrected line
import { generateRoast, type RoastAnalysis } from '/home/project/lib/gemini.ts';

export default function RoastaPalScreen() {
  // --- State Management for the App ---
  const [input, setInput] = useState('');
  const [intensity, setIntensity] = useState(3); // This is linked to the slider
  const [roast, setRoast] = useState<RoastAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- Handlers for App Logic ---

  const handleRoast = async () => {
    if (!input.trim() && !selectedImage) {
      Alert.alert('Input Needed', 'Please enter some text or select an image to roast.');
      return;
    }

    setLoading(true);
    setRoast(null); // Clear previous roast
    try {
      // NOTE: Make sure your `generateRoast` function is set up to handle an image URI
      const result = await generateRoast(input, intensity, selectedImage || undefined);
      setRoast(result);
    } catch (error) {
      console.error(error);
      Alert.alert('Roast Failed', 'Could not generate a roast. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access the photo library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7, // Use 0.7 for faster uploads
      base64: true, // Gemini may need base64 data
    });

    if (!result.canceled && result.assets[0].uri) {
      setSelectedImage(result.assets[0].uri);
      setInput('Image selected for roasting'); // Optional: Update input text
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (input === 'Image selected for roasting') {
      setInput('');
    }
  };
  
  // --- Helper Functions for Styling ---

  const getBurnLevelColor = (burnLevel: number) => {
    if (burnLevel < 20) return '#4CAF50';
    if (burnLevel < 40) return '#FFC107';
    if (burnLevel < 60) return '#FF9800';
    if (burnLevel < 80) return '#F44336';
    return '#8B0000';
  };

  const getBurnLevelEmoji = (burnLevel: number) => {
    if (burnLevel < 20) return '😊';
    if (burnLevel < 40) return '😏';
    if (burnLevel < 60) return '😈';
    if (burnLevel < 80) return '💀';
    return '☠️';
  };

  // --- JSX for the Screen ---

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fa709a', '#fee140']} style={styles.header}>
        <Text style={styles.headerIcon}>🔥</Text>
        <Text style={styles.title}>Roasta Pal</Text>
        <Text style={styles.subtitle}>Get roasted with style</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* --- Input Section --- */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>What needs roasting?</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type something, or upload an image..."
              placeholderTextColor="#999"
              value={input}
              onChangeText={setInput}
              multiline
            />
            {selectedImage && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <TouchableOpacity style={styles.clearImageButton} onPress={clearImage}>
                  <Text style={styles.clearImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.actionButtons}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.iconButton} onPress={handleImagePicker}>
                  <Upload size={20} color="#666" />
                </TouchableOpacity>
                {/* Camera functionality can be added here if needed */}
              </View>
              <TouchableOpacity
                style={[styles.roastButton, loading && styles.roastButtonDisabled]}
                onPress={handleRoast}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Send size={16} color="white" />
                    <Text style={styles.roastButtonText}>Roast Me</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- Intensity Slider Section --- */}
        <View style={styles.sliderSection}>
          <Text style={styles.sectionTitle}>Roast Intensity</Text>
          <IntensitySlider
            value={intensity}
            onValueChange={setIntensity}
            min={1}
            max={5}
          />
        </View>

        {/* --- Results Section (Conditional) --- */}
        {roast && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Your Roast</Text>
            <View style={styles.roastCard}>
              <View style={styles.roastHeader}>
                <Text style={styles.roastIcon}>🔥</Text>
                <View style={styles.roastInfo}>
                  <Text style={styles.roastTitle}>Roast Level {roast.intensity}</Text>
                  <View style={styles.burnMeter}>
                    <Text style={styles.burnLabel}>
                      {getBurnLevelEmoji(roast.burnLevel)} Burn Level: {roast.burnLevel}%
                    </Text>
                    <View style={styles.burnBar}>
                      <View style={[styles.burnFill, { width: `${roast.burnLevel}%`, backgroundColor: getBurnLevelColor(roast.burnLevel) }]} />
                    </View>
                  </View>
                </View>
              </View>
              <Text style={styles.roastText}>{roast.roastText}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Stylesheet for the Screen ---
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
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  textInput: {
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePreview: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginVertical: 12,
  },
  previewImage: {
    width: 80,
    height: 80,
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
    elevation: 2,
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
    marginTop: 12,
  },
  iconButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  roastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fa709a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  roastButtonDisabled: {
    opacity: 0.6,
  },
  roastButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  sliderSection: {
    marginBottom: 32,
  },
  resultsSection: {
    marginBottom: 32,
  },
  roastCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#fa709a',
  },
  roastHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  roastIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  roastInfo: {
    flex: 1,
  },
  roastTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  burnMeter: {
    marginBottom: 8,
  },
  burnLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  burnBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  burnFill: {
    height: '100%',
    borderRadius: 3,
  },
  roastText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
    fontStyle: 'italic',
  },
});