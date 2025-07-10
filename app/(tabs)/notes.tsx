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
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Upload, FileText, Sparkles, Copy, Plus, X, Eye, Brain, CircleCheck as CheckCircle } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { processNote, NoteAnalysis } from '@/lib/gemini';

interface NoteCard {
  id: string;
  type: 'original' | 'textify' | 'summarize' | 'depth';
  title: string;
  content: string;
  icon: string;
  color: string;
  data?: NoteAnalysis;
}

interface ActionOption {
  id: 'textify' | 'summarize' | 'depth';
  title: string;
  description: string;
  icon: any;
  color: string;
  enabled: boolean;
}

export default function NotePalScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cards, setCards] = useState<NoteCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [mainNote, setMainNote] = useState('');
  const [textInput, setTextInput] = useState('');
  const [cameraRef, setCameraRef] = useState<any>(null);

  // Action selection state
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set(['textify']));

  const actionOptions: ActionOption[] = [
    {
      id: 'textify',
      title: 'Textify',
      description: 'Convert handwritten notes to digital text',
      icon: FileText,
      color: '#f3e5f5',
      enabled: selectedImage !== null || textInput.trim().length > 0,
    },
    {
      id: 'summarize',
      title: 'Summarize',
      description: 'Create concise summary with key points',
      icon: Sparkles,
      color: '#fff3e0',
      enabled: true,
    },
    {
      id: 'depth',
      title: 'Add Depth',
      description: 'Provide deeper insights and analysis',
      icon: Brain,
      color: '#e8f5e8',
      enabled: true,
    },
  ];

  const handleCameraPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to capture notes');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.7,
          base64: false,
        });
        setSelectedImage(photo.uri);
        setTextInput('');
        // Add original image card
        const originalCard: NoteCard = {
          id: 'original',
          type: 'original',
          title: '📷 Original Note',
          content: 'Image captured and ready for processing',
          icon: '📷',
          color: '#e3f2fd',
          data: undefined
        };
        setCards([originalCard]);
        setShowCamera(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
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
      setTextInput('');
      // Add original image card
      const originalCard: NoteCard = {
        id: 'original',
        type: 'original',
        title: '📷 Original Note',
        content: 'Image uploaded and ready for processing',
        icon: '📷',
        color: '#e3f2fd',
        data: undefined
      };
      setCards([originalCard]);
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        Alert.alert('Coming Soon', 'Document processing will be available in a future update!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleTextInput = (text: string) => {
    setTextInput(text);
    if (text.trim().length > 0) {
      setSelectedImage(null);
      // Add text input card
      const textCard: NoteCard = {
        id: 'text-input',
        type: 'original',
        title: '✍️ Text Input',
        content: text,
        icon: '✍️',
        color: '#f0f8ff',
        data: undefined
      };
      setCards([textCard]);
    } else if (cards.length > 0 && cards[0].id === 'text-input') {
      setCards([]);
    }
  };

  const toggleAction = (actionId: string) => {
    const newSelected = new Set(selectedActions);
    if (newSelected.has(actionId)) {
      newSelected.delete(actionId);
    } else {
      newSelected.add(actionId);
    }
    setSelectedActions(newSelected);
  };

  const handleProcessActions = async () => {
    if (selectedActions.size === 0) {
      Alert.alert('No Actions Selected', 'Please select at least one processing action');
      return;
    }

    if (!selectedImage && !textInput.trim()) {
      Alert.alert('No Input', 'Please upload an image or enter text to process');
      return;
    }

    setLoading(true);
    try {
      const actionsArray = Array.from(selectedActions);
      const newCards: NoteCard[] = [];

      // Process each selected action
      for (const action of actionsArray) {
        const actionType = action as 'textify' | 'summarize' | 'depth';
        
        let result: NoteAnalysis;
        
        if (actionType === 'textify') {
          // For textify, use image or text input
          result = await processNote(
            textInput || '', 
            'textify', 
            selectedImage || undefined,
            undefined
          );
        } else {
          // For summarize/depth, use existing digital text or text input
          const existingText = getDigitalText() || textInput;
          result = await processNote(
            '', 
            actionType, 
            undefined,
            existingText
          );
        }

        // Create card based on action
        let newCard: NoteCard;
        
        if (actionType === 'textify') {
          newCard = {
            id: `textify-${Date.now()}`,
            type: 'textify',
            title: '✍️ Digital Text',
            content: result.digitalText || '',
            icon: '✍️',
            color: '#f3e5f5',
            data: result
          };
        } else if (actionType === 'summarize') {
          newCard = {
            id: `summarize-${Date.now()}`,
            type: 'summarize',
            title: '✨ Summary',
            content: result.summary || '',
            icon: '✨',
            color: '#fff3e0',
            data: result
          };
        } else {
          newCard = {
            id: `depth-${Date.now()}`,
            type: 'depth',
            title: '🧠 Deeper Dive',
            content: result.deeperInsights || '',
            icon: '🧠',
            color: '#e8f5e8',
            data: result
          };
        }

        newCards.push(newCard);
      }

      setCards(prev => [...prev, ...newCards]);
    } catch (error) {
      Alert.alert('Processing Failed', 'Could not process your note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get the digital text from cards for processing
  const getDigitalText = (): string => {
    const textifyCard = cards.find(card => card.type === 'textify');
    return textifyCard?.data?.digitalText || '';
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', 'Text copied to clipboard');
  };

  const addToNote = (text: string) => {
    setMainNote(prev => prev + (prev ? '\n\n' : '') + text);
    Alert.alert('Added!', 'Content added to your main note');
  };

  const removeCard = (cardId: string) => {
    setCards(prev => prev.filter(card => card.id !== cardId));
  };

  const renderActionSelector = () => (
    <View style={styles.actionSelector}>
      <Text style={styles.sectionTitle}>Select Processing Actions</Text>
      <View style={styles.actionGrid}>
        {actionOptions.map((option) => {
          const isSelected = selectedActions.has(option.id);
          const isEnabled = option.enabled;
          const IconComponent = option.icon;
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.actionOption,
                isSelected && styles.actionOptionSelected,
                !isEnabled && styles.actionOptionDisabled,
              ]}
              onPress={() => isEnabled && toggleAction(option.id)}
              disabled={!isEnabled}
            >
              <View style={styles.actionOptionHeader}>
                <IconComponent 
                  size={24} 
                  color={isSelected ? '#4facfe' : (isEnabled ? '#666' : '#ccc')} 
                />
                {isSelected && (
                  <CheckCircle size={16} color="#4facfe" style={styles.checkIcon} />
                )}
              </View>
              <Text style={[
                styles.actionOptionTitle,
                isSelected && styles.actionOptionTitleSelected,
                !isEnabled && styles.actionOptionTitleDisabled,
              ]}>
                {option.title}
              </Text>
              <Text style={[
                styles.actionOptionDescription,
                !isEnabled && styles.actionOptionDescriptionDisabled,
              ]}>
                {option.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <TouchableOpacity
        style={[styles.processButton, loading && styles.processButtonDisabled]}
        onPress={handleProcessActions}
        disabled={loading || selectedActions.size === 0}
      >
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.processGradient}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Sparkles size={20} color="white" />
              <Text style={styles.processButtonText}>
                Process Selected ({selectedActions.size})
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderCard = (card: NoteCard) => (
    <View key={card.id} style={[styles.card, { backgroundColor: card.color }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={() => copyToClipboard(card.content)}
          >
            <Copy size={16} color="#666" />
          </TouchableOpacity>
          {card.type !== 'original' && (
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => addToNote(card.content)}
            >
              <Plus size={16} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={() => removeCard(card.id)}
          >
            <X size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      
      {card.type === 'original' && selectedImage ? (
        <Image source={{ uri: selectedImage }} style={styles.cardImage} />
      ) : (
        <Text style={styles.cardContent}>{card.content}</Text>
      )}

      {/* Render additional data for specific card types */}
      {card.data?.keyPoints && card.data.keyPoints.length > 0 && (
        <View style={styles.keyPointsSection}>
          <Text style={styles.keyPointsTitle}>Key Points:</Text>
          {card.data.keyPoints.map((point, index) => (
            <Text key={index} style={styles.keyPoint}>• {point}</Text>
          ))}
        </View>
      )}

      {card.data?.actionItems && card.data.actionItems.length > 0 && (
        <View style={styles.actionItemsSection}>
          <Text style={styles.actionItemsTitle}>Action Items:</Text>
          {card.data.actionItems.map((item, index) => (
            <Text key={index} style={styles.actionItem}>→ {item}</Text>
          ))}
        </View>
      )}
    </View>
  );

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          facing="back"
          ref={setCameraRef}
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={takePicture}
              >
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
        colors={['#4facfe', '#00f2fe']}
        style={styles.header}
      >
        <Text style={styles.headerIcon}>📝</Text>
        <Text style={styles.title}>Note Pal</Text>
        <Text style={styles.subtitle}>Transform your handwritten notes</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Start with your note</Text>
          
          {/* Text Input Option */}
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your notes here, or upload an image below..."
              placeholderTextColor="#999"
              value={textInput}
              onChangeText={handleTextInput}
              multiline
              maxLength={2000}
            />
          </View>

          <Text style={styles.orText}>OR</Text>

          {/* Upload Options */}
          <View style={styles.uploadOptions}>
            <TouchableOpacity style={styles.uploadButton} onPress={handleCameraPress}>
              <Camera size={32} color="#4facfe" />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={handleImagePicker}>
              <Upload size={32} color="#4facfe" />
              <Text style={styles.uploadButtonText}>Upload Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={handleDocumentPicker}>
              <FileText size={32} color="#4facfe" />
              <Text style={styles.uploadButtonText}>Upload File</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Selector - Show when we have input */}
        {(selectedImage || textInput.trim().length > 0) && renderActionSelector()}

        {/* Cards Section */}
        {cards.length > 0 && (
          <View style={styles.cardsSection}>
            <Text style={styles.sectionTitle}>Your Note Processing</Text>
            {cards.map(renderCard)}
          </View>
        )}

        {/* Main Note Section */}
        {mainNote.length > 0 && (
          <View style={styles.mainNoteSection}>
            <Text style={styles.sectionTitle}>Your Compiled Note</Text>
            <View style={styles.mainNoteCard}>
              <TextInput
                style={styles.mainNoteInput}
                value={mainNote}
                onChangeText={setMainNote}
                multiline
                placeholder="Your compiled note will appear here..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.copyMainNoteButton}
                onPress={() => copyToClipboard(mainNote)}
              >
                <Copy size={16} color="white" />
                <Text style={styles.copyMainNoteText}>Copy All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reset Button */}
        {cards.length > 0 && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setCards([]);
              setSelectedImage(null);
              setTextInput('');
              setMainNote('');
              setSelectedActions(new Set(['textify']));
            }}
          >
            <Text style={styles.resetButtonText}>Start New Note</Text>
          </TouchableOpacity>
        )}
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
  textInputContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  },
  orText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#666',
    marginVertical: 16,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  uploadButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minWidth: 100,
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#4facfe',
    marginTop: 8,
    textAlign: 'center',
  },
  actionSelector: {
    marginBottom: 32,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionOption: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actionOptionSelected: {
    borderColor: '#4facfe',
    backgroundColor: '#f0f8ff',
  },
  actionOptionDisabled: {
    opacity: 0.5,
  },
  actionOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    marginLeft: 8,
  },
  actionOptionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionOptionTitleSelected: {
    color: '#4facfe',
  },
  actionOptionTitleDisabled: {
    color: '#ccc',
  },
  actionOptionDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    lineHeight: 16,
  },
  actionOptionDescriptionDisabled: {
    color: '#ccc',
  },
  processButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  processButtonDisabled: {
    opacity: 0.6,
  },
  processGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  processButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  cardsSection: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1a1a1a',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#333',
    lineHeight: 20,
  },
  keyPointsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  keyPointsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
    marginBottom: 8,
  },
  keyPoint: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 4,
  },
  actionItemsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionItemsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
    marginBottom: 8,
  },
  actionItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 4,
  },
  mainNoteSection: {
    marginBottom: 20,
  },
  mainNoteCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  mainNoteInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1a1a1a',
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  copyMainNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4facfe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-end',
    gap: 8,
  },
  copyMainNoteText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
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