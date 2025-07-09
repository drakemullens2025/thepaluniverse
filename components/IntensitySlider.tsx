import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
  withRepeat,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

interface IntensitySliderProps {
  value?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
}

const THUMB_SIZE = 44;
const TRACK_HEIGHT = 12;

const IntensitySlider: React.FC<IntensitySliderProps> = ({
  value = 1,
  onValueChange = () => {},
  min = 1,
  max = 5
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const dangerPulse = useSharedValue(1);
  const isDragging = useSharedValue(false);

  // Ensure value is within bounds
  const safeValue = Math.max(min, Math.min(max, value));
  
  // Get intensity label
  const getIntensityLabel = (level: number) => {
    const labels = {
      1: { text: 'Playful', emoji: '😊', color: '#4CAF50' },
      2: { text: 'Sassy', emoji: '😏', color: '#FFC107' },
      3: { text: 'Savage', emoji: '😈', color: '#FF9800' },
      4: { text: 'Brutal', emoji: '💀', color: '#F44336' },
      5: { text: 'Career Ending', emoji: '☠️', color: '#8B0000' },
    };
    return labels[level as keyof typeof labels] || labels[1];
  };

  const currentLabel = getIntensityLabel(safeValue);

  // Calculate position from value
  const positionForValue = (val: number): number => {
    'worklet';
    if (sliderWidth <= 0) return 0;
    const usableWidth = sliderWidth - THUMB_SIZE;
    return ((val - min) / (max - min)) * usableWidth;
  };

  // Update thumb position when value changes
  useEffect(() => {
    if (sliderWidth > 0) {
      const newPosition = positionForValue(safeValue);
      translateX.value = withSpring(newPosition, { damping: 15, stiffness: 150 });
    }
  }, [safeValue, sliderWidth]);

  // Danger zone pulse animation
  useEffect(() => {
    if (safeValue >= 4) {
      dangerPulse.value = withRepeat(
        withTiming(1.15, { duration: 800 }),
        -1,
        true
      );
    } else {
      dangerPulse.value = withTiming(1, { duration: 200 });
    }
  }, [safeValue]);

  // Handle value change with JS thread safety
  const onValueChangeJS = (newValue: number) => {
    if (newValue !== safeValue) {
      onValueChange(newValue);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: any) => {
    if (e.nativeEvent.key === 'ArrowLeft' || e.nativeEvent.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(min, safeValue - 1);
      runOnJS(onValueChangeJS)(newValue);
    } else if (e.nativeEvent.key === 'ArrowRight' || e.nativeEvent.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(max, safeValue + 1);
      runOnJS(onValueChangeJS)(newValue);
    }
  };

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .hitSlop(20)
    .onStart(() => {
      isDragging.value = true;
      scale.value = withSpring(1.2);
    })
    .onUpdate((event) => {
      const usableWidth = sliderWidth - THUMB_SIZE;
      const newPosition = Math.max(0, Math.min(usableWidth, event.translationX));
      translateX.value = newPosition;
      
      const newValue = Math.round(min + (newPosition / usableWidth) * (max - min));
      runOnJS(onValueChangeJS)(newValue);
    })
    .onEnd(() => {
      isDragging.value = false;
      scale.value = withSpring(1);
      translateX.value = withSpring(positionForValue(safeValue));
    });

  // Tap gesture for direct setting
  const tapGesture = Gesture.Tap()
    .onStart((event) => {
      const usableWidth = sliderWidth - THUMB_SIZE;
      const newPosition = Math.max(0, Math.min(usableWidth, event.x - THUMB_SIZE / 2));
      const newValue = Math.round(min + (newPosition / usableWidth) * (max - min));
      runOnJS(onValueChangeJS)(newValue);
    });

  const composedGesture = Gesture.Race(tapGesture, panGesture);

  // Animated styles
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const progress = sliderWidth > 0 ? translateX.value / (sliderWidth - THUMB_SIZE) : 0;
    
    return {
      transform: [
        { translateX: translateX.value },
        { scale: isDragging.value 
          ? scale.value 
          : withTiming(dangerPulse.value, { duration: 300 }) 
        },
      ],
      backgroundColor: interpolateColor(
        progress,
        [0, 0.25, 0.5, 0.75, 1],
        ['#4CAF50', '#FFC107', '#FF9800', '#F44336', '#8B0000']
      ),
    };
  });

  // Marker position calculation
  const getMarkerPosition = (level: number) => {
    if (sliderWidth <= 0) return 0;
    const usableWidth = sliderWidth - THUMB_SIZE;
    return ((level - min) / (max - min)) * usableWidth + THUMB_SIZE / 2 - 1;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text 
          style={[
            styles.levelText, 
            { color: currentLabel.color }
          ]} 
          accessible={true}
          accessibilityRole="header"
        >
          {currentLabel.emoji} Level {safeValue}: {currentLabel.text}
        </Text>
        
        {/* Danger Zone */}
        {safeValue >= 4 && (
          <View style={styles.dangerZone}>
            <Text style={styles.dangerText}>⚠️ DANGER ZONE ⚠️</Text>
          </View>
        )}
      </View>

      {/* Slider */}
      <GestureDetector gesture={composedGesture}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.sliderContainer}
          onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
          accessibilityRole="slider"
          accessibilityValue={{ min, max, now: safeValue }}
          accessibilityLabel={`Intensity level ${safeValue}`}
          onPress={() => {}} // Required for accessibility
          onAccessibilityAction={handleKeyDown}
        >
          {/* Track */}
          <LinearGradient
            colors={['#4CAF50', '#FFC107', '#FF9800', '#F44336', '#8B0000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.track}
          />

          {/* Markers */}
          <View style={styles.markersContainer}>
            {[1, 2, 3, 4, 5].map((level) => {
              const label = getIntensityLabel(level);
              return (
                <View
                  key={level}
                  style={[
                    styles.marker,
                    { 
                      left: getMarkerPosition(level),
                      backgroundColor: safeValue >= level ? label.color : 'rgba(0,0,0,0.2)',
                      transform: [{ translateY: -TRACK_HEIGHT/2 }]
                    }
                  ]}
                />
              );
            })}
          </View>
          
          {/* Thumb */}
          <Animated.View style={[styles.thumb, thumbAnimatedStyle]}>
            <Text style={styles.thumbEmoji}>{currentLabel.emoji}</Text>
          </Animated.View>
        </TouchableOpacity>
      </GestureDetector>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: 12,
  },
  levelText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  dangerZone: {
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff3cd',
    alignSelf: 'center',
  },
  dangerText: {
    color: '#856404',
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },
  sliderContainer: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      }
    }),
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    opacity: 0.6,
  },
  markersContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: TRACK_HEIGHT,
    marginTop: -TRACK_HEIGHT / 2,
  },
  marker: {
    position: 'absolute',
    width: 2,
    height: '100%',
    borderRadius: 1,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    top: '50%',
    transform: [{ translateY: -THUMB_SIZE/2 }],
  },
  thumbEmoji: {
    fontSize: 22,
    color: 'white',
  },
});

export default IntensitySlider;