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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  Type, 
  Palette, 
  Share2, 
  RotateCcw, 
  Trash2,
  Plus,
  Sparkles,
  Undo2
} from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
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
  const [overlayHistory, setOverlayHistory] = useState<TextOverlay[][]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [newText, setNewText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedFontSize, setSelectedFontSize] = useState(24);
  const [selectedFontWeight, setSelectedFontWeight] = useState<'normal' | 'bold'>('bold');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  
  const viewShotRef = useRef<ViewShot>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setTextOverlays([]);
      setOverlayHistory([]);
      setSelectedOverlay(null);
      setShowTextInput(false);
      setNewText('');
      setShowColorPicker(false);
      setShowFontSizePicker(false);
      
      // Get image dimensions to calculate proper aspect ratio
      Image.getSize(imageUri, (width, height) => {
        setImageAspectRatio(width / height);
      });

      // Initialize with AI response as first overlay after a short delay
      setTimeout(() => {
        if (aiResponse) {
          const initialOverlay: TextOverlay = {
            id: 'ai-response',
            text: aiResponse.length > 80 ? aiResponse.substring(0, 80) + '...' : aiResponse,
            x: CANVAS_WIDTH * 0.05,
            y: CANVAS_HEIGHT * 0.75,
            color: responseType === 'roast' ? '#FF6B6B' : '#4ECDC4',
            fontSize: 18,
            fontWeight: 'bold',
            rotation: 0,
          };
          setTextOverlays([initialOverlay]);
          setOverlayHistory([[]]);
        }
      }, 100);
    }
  }, [visible, aiResponse, responseType]);

  // Calculate proper image dimensions
  const getImageDimensions = () => {
    const maxWidth = CANVAS_WIDTH;
    const maxHeight = CANVAS_HEIGHT * 0.8; // Leave space for controls
    
    let width = maxWidth;
    let height = width / imageAspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * imageAspectRatio;
    }
    
    return { width, height };
  };

  const imageDimensions = getImageDimensions();

  // Save current state to history
  const saveToHistory = () => {
    setOverlayHistory(prev => [...prev, [...textOverlays]]);
  };

  // Undo last action
  const undo = () => {
    if (overlayHistory.length > 0) {
      const previousState = overlayHistory[overlayHistory.length - 1];
      setTextOverlays(previousState);
      setOverlayHistory(prev => prev.slice(0, -1));
      setSelectedOverlay(null);
    }
  };

  // Create draggable text overlay component
  const DraggableText = ({ overlay }: { overlay: TextOverlay }) => {
    const translateX = useSharedValue(overlay.x);
    const translateY = useSharedValue(overlay.y);
    const startX = useSharedValue(0);
    const startY = useSharedValue(0);

    const gesture = Gesture.Pan()
      .onStart(() => {
        startX.value = translateX.value;
        startY.value = translateY.value;
        runOnJS(setSelectedOverlay)(overlay.id);
      })
      .onUpdate((event) => {
        const newX = Math.max(0, Math.min(imageDimensions.width - 100, startX.value + event.translationX));
        const newY = Math.max(0, Math.min(imageDimensions.height - 40, startY.value + event.translationY));
        translateX.value = newX;
        translateY.value = newY;
      })
      .onEnd(() => {
        runOnJS(updateOverlayPosition)(overlay.id, translateX.value, translateY.value);
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${overlay.rotation}deg` }
      ],
    }));

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.textOverlay,
            animatedStyle,
            {
              borderColor: selectedOverlay === overlay.id ? '#007AFF' : 'transparent',
              borderWidth: selectedOverlay === overlay.id ? 2 : 0,
            }
          ]}
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
      </GestureDetector>
    );
  };

  const updateOverlayPosition = (id: string, x: number, y: number) => {
    saveToHistory();
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === id ? { ...overlay, x, y } : overlay
    ));
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    
    saveToHistory();
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: newText,
      x: imageDimensions.width * 0.1,
      y: imageDimensions.height * 0.3,
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
    saveToHistory();
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: emoji,
      x: Math.random() * (imageDimensions.width - 50),
      y: Math.random() * (imageDimensions.height - 50),
      color: '#FFFFFF',
      fontSize: 32,
      fontWeight: 'normal',
      rotation: 0,
    };
    
    setTextOverlays(prev => [...prev, newOverlay]);
  };

  const updateSelectedOverlay = (updates: Partial<TextOverlay>) => {
    if (!selectedOverlay) return;
    
    saveToHistory();
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === selectedOverlay 
        ? { ...overlay, ...updates }
        : overlay
    ));
  };

  const deleteSelectedOverlay = () => {
    if (!selectedOverlay) return;
    
    saveToHistory();
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== selectedOverlay));
    setSelectedOverlay(null);
  };

  const rotateSelectedOverlay = () => {
    if (!selectedOverlay) return;
    
    const currentOverlay = textOverlays.find(o => o.id === selectedOverlay);
    if (currentOverlay) {
      updateSelectedOverlay({ rotation: (currentOverlay.rotation + 15) % 360 });
    }
  };

  const captureAndShare = async () => {
    if (!viewShotRef.current) return;
    
    setIsProcessing(true);
    try {
      const uri = await viewShotRef.current.capture({
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      const finalUri = await addBranding(uri);
      
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

  const addBranding = async (imageUri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1080 } }],
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
          <Text style={styles.brandingText}>Pal Universe</Text>
        </View>
      );
    } else if (responseType === 'cringe' && metadata.hotLevel !== undefined && metadata.cringeLevel !== undefined) {
      return (
        <View style={styles.metadataOverlay}>
          <Text style={styles.metadataText}>🔥 Hot: {metadata.hotLevel}%</Text>
          <Text style={styles.metadataText}>😬 Cringe: {metadata.cringeLevel}%</Text>
          <Text style={styles.brandingText}>Pal Universe</Text>
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
              onPress={undo}
              disabled={overlayHistory.length === 0}
            >
              <Undo2 size={20} color={overlayHistory.length === 0 ? 'rgba(255,255,255,0.5)' : 'white'} />
            </TouchableOpacity>
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
          <ViewShot ref={viewShotRef} style={[styles.canvas, { width: imageDimensions.width, height: imageDimensions.height }]}>
            {/* Background Image */}
            <Image 
              source={{ uri: imageUri }} 
              style={[styles.backgroundImage, { width: imageDimensions.width, height: imageDimensions.height }]}
              resizeMode="cover"
            />
            
            {/* Metadata Overlay */}
            {renderMetadataOverlay()}
            
            {/* Text Overlays */}
            {textOverlays.map((overlay) => (
              <DraggableText key={overlay.id} overlay={overlay} />
            ))}
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
                autoFocus
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
                  <Text style={[styles.fontSizeText, { fontSize: Math.min(size * 0.6, 18) }]}>
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
              <Type size={28} color={showTextInput ? '#007AFF' : '#666'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tool, showColorPicker && styles.activeTool]}
              onPress={() => {
                setShowColorPicker(!showColorPicker);
                setShowTextInput(false);
                setShowFontSizePicker(false);
              }}
            >
              <Palette size={28} color={showColorPicker ? '#007AFF' : '#666'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tool, showFontSizePicker && styles.activeTool]}
              onPress={() => {
                setShowFontSizePicker(!showFontSizePicker);
                setShowTextInput(false);
                setShowColorPicker(false);
              }}
            >
              <Text style={[styles.fontSizeIcon, { color: showFontSizePicker ? '#007AFF' : '#666' }]}>Aa</Text>
            </TouchableOpacity>

            {selectedOverlay && (
              <>
                <TouchableOpacity style={styles.tool} onPress={rotateSelectedOverlay}>
                  <RotateCcw size={28} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.tool} onPress={deleteSelectedOverlay}>
                  <Trash2 size={28} color="#FF6B6B" />
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
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  metadataOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
    zIndex: 10,
  },
  metadataText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  brandingText: {
    color: '#FFD700',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  textOverlay: {
    position: 'absolute',
    padding: 8,
    borderRadius: 8,
    minWidth: 50,
    minHeight: 30,
    zIndex: 5,
  },
  overlayText: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 50,
    alignItems: 'center',
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
    padding: 12,
    minWidth: 48,
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 28,
  },
  mainTools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tool: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    width: 56,
    height: 56,
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
    fontSize: 22,
    fontFamily: 'Inter-Bold',
  },
});