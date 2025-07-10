import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  Alert,
  PanResponder,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  Type, 
  Palette, 
  Download, 
  Share2, 
  RotateCcw, 
  Move,
  Trash2,
  Plus,
  Sparkles
} from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useAuth } from '@/contexts/AuthContext';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  rotation: number;
}

interface PhotoMarkupModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string;
  aiResponse: string;
  responseType: 'roast' | 'cringe';
  metadata?: {
    intensity?: number;
    burnLevel?: number;
    hotLevel?: number;
    cringeLevel?: number;
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth - 40;
const CANVAS_HEIGHT = CANVAS_WIDTH * 1.2; // 5:6 aspect ratio for social media

const COLORS = [
  '#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

const FONT_SIZES = [16, 20, 24, 28, 32, 36];

const EMOJI_SETS = {
  roast: ['🔥', '💀', '😈', '💯', '🚨', '⚡', '💥', '🌶️', '🎯', '💣'],
  cringe: ['😬', '🤦', '💀', '😅', '🙈', '🤡', '📉', '🚫', '⚠️', '💔']
};

export default function PhotoMarkupModal({
  visible,
  onClose,
  imageUri,
  aiResponse,
  responseType,
  metadata = {}
}: PhotoMarkupModalProps) {
  const { user } = useAuth();
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [newText, setNewText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedFontSize, setSelectedFontSize] = useState(24);
  const [selectedFontWeight, setSelectedFontWeight] = useState<'normal' | 'bold'>('bold');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  
  const viewShotRef = useRef<ViewShot>(null);
  const panResponders = useRef<{ [key: string]: any }>({});

  // Initialize with AI response as first overlay
  useEffect(() => {
    if (visible && aiResponse && textOverlays.length === 0) {
      const initialOverlay: TextOverlay = {
        id: 'ai-response',
        text: aiResponse.length > 100 ? aiResponse.substring(0, 100) + '...' : aiResponse,
        x: CANVAS_WIDTH * 0.1,
        y: CANVAS_HEIGHT * 0.7,
        color: responseType === 'roast' ? '#FF6B6B' : '#4ECDC4',
        fontSize: 20,
        fontWeight: 'bold',
        rotation: 0,
      };
      setTextOverlays([initialOverlay]);
    }
  }, [visible, aiResponse]);

  // Create pan responder for each text overlay
  const createPanResponder = (overlayId: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setSelectedOverlay(overlayId);
      },
      onPanResponderMove: (evt, gestureState) => {
        setTextOverlays(prev => prev.map(overlay => 
          overlay.id === overlayId 
            ? {
                ...overlay,
                x: Math.max(0, Math.min(CANVAS_WIDTH - 100, overlay.x + gestureState.dx)),
                y: Math.max(0, Math.min(CANVAS_HEIGHT - 50, overlay.y + gestureState.dy))
              }
            : overlay
        ));
      },
      onPanResponderRelease: () => {
        // Reset gesture state
      },
    });
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: newText,
      x: CANVAS_WIDTH * 0.1,
      y: CANVAS_HEIGHT * 0.3,
      color: selectedColor,
      fontSize: selectedFontSize,
      fontWeight: selectedFontWeight,
      rotation: 0,
    };
    
    setTextOverlays(prev => [...prev, newOverlay]);
    setNewText('');
    setShowTextInput(false);
  };

  const addEmojiOverlay = (emoji: string) => {
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: emoji,
      x: Math.random() * (CANVAS_WIDTH - 50),
      y: Math.random() * (CANVAS_HEIGHT - 50),
      color: '#FFFFFF',
      fontSize: 32,
      fontWeight: 'normal',
      rotation: 0,
    };
    
    setTextOverlays(prev => [...prev, newOverlay]);
  };

  const updateSelectedOverlay = (updates: Partial<TextOverlay>) => {
    if (!selectedOverlay) return;
    
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === selectedOverlay 
        ? { ...overlay, ...updates }
        : overlay
    ));
  };

  const deleteSelectedOverlay = () => {
    if (!selectedOverlay) return;
    
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== selectedOverlay));
    setSelectedOverlay(null);
  };

  const rotateSelectedOverlay = () => {
    if (!selectedOverlay) return;
    
    updateSelectedOverlay({ 
      rotation: (textOverlays.find(o => o.id === selectedOverlay)?.rotation || 0) + 15 
    });
  };

  const captureAndShare = async () => {
    if (!viewShotRef.current) return;
    
    setIsProcessing(true);
    try {
      // Capture the view as image
      const uri = await viewShotRef.current.capture({
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      // Create a shareable version with branding
      const finalUri = await addBranding(uri);
      
      // Share the image
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(finalUri, {
          mimeType: 'image/png',
          dialogTitle: `Share your ${responseType === 'roast' ? 'roast' : 'cringe analysis'}!`,
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share image');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToGallery = async () => {
    if (!viewShotRef.current) return;
    
    setIsProcessing(true);
    try {
      const uri = await viewShotRef.current.capture({
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      const finalUri = await addBranding(uri);
      
      // Save to device
      const asset = await MediaLibrary.createAssetAsync(finalUri);
      Alert.alert('Saved!', 'Image saved to your gallery');
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Failed to save image');
    } finally {
      setIsProcessing(false);
    }
  };

  const addBranding = async (imageUri: string): Promise<string> => {
    try {
      // Add subtle branding watermark
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1080 } }, // Standard social media size
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.PNG,
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Error adding branding:', error);
      return imageUri;
    }
  };

  const renderMetadataOverlay = () => {
    if (responseType === 'roast' && metadata.intensity && metadata.burnLevel) {
      return (
        <View style={styles.metadataOverlay}>
          <Text style={styles.metadataText}>🔥 Level {metadata.intensity}</Text>
          <Text style={styles.metadataText}>Burn: {metadata.burnLevel}%</Text>
        </View>
      );
    } else if (responseType === 'cringe' && metadata.hotLevel !== undefined && metadata.cringeLevel !== undefined) {
      return (
        <View style={styles.metadataOverlay}>
          <Text style={styles.metadataText}>🔥 Hot: {metadata.hotLevel}%</Text>
          <Text style={styles.metadataText}>😬 Cringe: {metadata.cringeLevel}%</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={responseType === 'roast' ? ['#fa709a', '#fee140'] : ['#f093fb', '#f5576c']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {responseType === 'roast' ? '🔥 Roast Editor' : '⚡ Cringe Editor'}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={captureAndShare}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Share2 size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Canvas */}
        <View style={styles.canvasContainer}>
          <ViewShot ref={viewShotRef} style={styles.canvas}>
            {/* Background Image */}
            <Image source={{ uri: imageUri }} style={styles.backgroundImage} />
            
            {/* Metadata Overlay */}
            {renderMetadataOverlay()}
            
            {/* Text Overlays */}
            {textOverlays.map((overlay) => {
              if (!panResponders.current[overlay.id]) {
                panResponders.current[overlay.id] = createPanResponder(overlay.id);
              }
              
              return (
                <Animated.View
                  key={overlay.id}
                  style={[
                    styles.textOverlay,
                    {
                      left: overlay.x,
                      top: overlay.y,
                      transform: [{ rotate: `${overlay.rotation}deg` }],
                      borderColor: selectedOverlay === overlay.id ? '#007AFF' : 'transparent',
                      borderWidth: selectedOverlay === overlay.id ? 2 : 0,
                    }
                  ]}
                  {...panResponders.current[overlay.id].panHandlers}
                >
                  <Text
                    style={[
                      styles.overlayText,
                      {
                        color: overlay.color,
                        fontSize: overlay.fontSize,
                        fontWeight: overlay.fontWeight,
                        textShadowColor: overlay.color === '#FFFFFF' ? '#000000' : '#FFFFFF',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2,
                      }
                    ]}
                  >
                    {overlay.text}
                  </Text>
                </Animated.View>
              );
            })}
            
            {/* Branding */}
            <View style={styles.brandingOverlay}>
              <Text style={styles.brandingText}>Pal Universe</Text>
            </View>
          </ViewShot>
        </View>

        {/* Tools */}
        <View style={styles.toolsContainer}>
          {/* Text Input */}
          {showTextInput && (
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter text..."
                value={newText}
                onChangeText={setNewText}
                multiline
                maxLength={100}
              />
              <TouchableOpacity style={styles.addTextButton} onPress={addTextOverlay}>
                <Plus size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* Color Picker */}
          {showColorPicker && (
            <View style={styles.colorPicker}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption
                  ]}
                  onPress={() => {
                    setSelectedColor(color);
                    if (selectedOverlay) {
                      updateSelectedOverlay({ color });
                    }
                  }}
                />
              ))}
            </View>
          )}

          {/* Font Size Picker */}
          {showFontSizePicker && (
            <View style={styles.fontSizePicker}>
              {FONT_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontSizeOption,
                    selectedFontSize === size && styles.selectedFontSizeOption
                  ]}
                  onPress={() => {
                    setSelectedFontSize(size);
                    if (selectedOverlay) {
                      updateSelectedOverlay({ fontSize: size });
                    }
                  }}
                >
                  <Text style={[styles.fontSizeText, { fontSize: size * 0.6 }]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Emoji Picker */}
          <View style={styles.emojiPicker}>
            {EMOJI_SETS[responseType].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiOption}
                onPress={() => addEmojiOverlay(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main Tools */}
          <View style={styles.mainTools}>
            <TouchableOpacity
              style={[styles.tool, showTextInput && styles.activeTool]}
              onPress={() => {
                setShowTextInput(!showTextInput);
                setShowColorPicker(false);
                setShowFontSizePicker(false);
              }}
            >
              <Type size={24} color={showTextInput ? '#007AFF' : '#666'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tool, showColorPicker && styles.activeTool]}
              onPress={() => {
                setShowColorPicker(!showColorPicker);
                setShowTextInput(false);
                setShowFontSizePicker(false);
              }}
            >
              <Palette size={24} color={showColorPicker ? '#007AFF' : '#666'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tool, showFontSizePicker && styles.activeTool]}
              onPress={() => {
                setShowFontSizePicker(!showFontSizePicker);
                setShowTextInput(false);
                setShowColorPicker(false);
              }}
            >
              <Text style={styles.fontSizeIcon}>Aa</Text>
            </TouchableOpacity>

            {selectedOverlay && (
              <>
                <TouchableOpacity style={styles.tool} onPress={rotateSelectedOverlay}>
                  <RotateCcw size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.tool} onPress={deleteSelectedOverlay}>
                  <Trash2 size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  metadataOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 8,
  },
  metadataText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  textOverlay: {
    position: 'absolute',
    padding: 8,
    borderRadius: 8,
    minWidth: 50,
    minHeight: 30,
  },
  overlayText: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  brandingOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  brandingText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Inter-Medium',
  },
  toolsContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1a1a1a',
    maxHeight: 80,
  },
  addTextButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingVertical: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectedColorOption: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  fontSizePicker: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    paddingVertical: 8,
  },
  fontSizeOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFontSizeOption: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  fontSizeText: {
    fontFamily: 'Inter-SemiBold',
    color: '#1a1a1a',
  },
  emojiPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  emojiOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  mainTools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tool: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeTool: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  fontSizeIcon: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#666',
  },
});