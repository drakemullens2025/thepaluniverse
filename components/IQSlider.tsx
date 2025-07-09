import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface IQSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const SLIDER_WIDTH = screenWidth - 80;
const THUMB_SIZE = 44;

export default function IQSlider({ 
  value, 
  onValueChange, 
  min = 100, 
  max = 160 
}: IQSliderProps) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const geniusGlow = useSharedValue(0);
  const brainPulse = useSharedValue(1);

  // Initialize position based on value
  useEffect(() => {
    const position = ((value - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
    translateX.value = withSpring(position);
  }, [value, min, max]);

  // Genius zone animations (150+ IQ)
  useEffect(() => {
    if (value >= 150) {
      geniusGlow.value = withRepeat(
        withTiming(1, { duration: 1200 }),
        -1,
        true
      );
      brainPulse.value = withRepeat(
        withTiming(1.15, { duration: 1000 }),
        -1,
        true
      );
    } else {
      geniusGlow.value = withTiming(0);
      brainPulse.value = withTiming(1);
    }
  }, [value]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.2);
    })
    .onUpdate((event) => {
      const newX = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, event.translationX + translateX.value));
      translateX.value = newX;
      
      // Calculate new value
      const newValue = Math.round(min + (newX / (SLIDER_WIDTH - THUMB_SIZE)) * (max - min));
      if (newValue !== value) {
        onValueChange(newValue);
      }
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      const finalPosition = ((value - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
      translateX.value = withSpring(finalPosition);
    });

  const thumbStyle = useAnimatedStyle(() => {
    const progress = translateX.value / (SLIDER_WIDTH - THUMB_SIZE);
    
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value * brainPulse.value }
      ],
      backgroundColor: interpolateColor(
        progress,
        [0, 0.33, 0.66, 0.83, 1],
        ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#FFD700']
      ),
      shadowColor: interpolateColor(
        progress,
        [0, 0.5, 0.83, 1],
        ['#4CAF50', '#2196F3', '#FF9800', '#FFD700']
      ),
      shadowOpacity: interpolate(progress, [0, 0.83, 1], [0.3, 0.6, 0.9]),
      shadowRadius: interpolate(progress, [0, 0.83, 1], [4, 8, 16]),
    };
  });

  const trackStyle = useAnimatedStyle(() => {
    const progress = translateX.value / (SLIDER_WIDTH - THUMB_SIZE);
    
    return {
      backgroundColor: interpolateColor(
        progress,
        [0, 0.33, 0.66, 0.83, 1],
        ['#E8F5E8', '#E3F2FD', '#F3E5F5', '#FFF3E0', '#FFFDE7']
      ),
    };
  });

  const geniusZoneStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(geniusGlow.value, [0, 1], [0.2, 0.8]),
      transform: [
        { scale: interpolate(geniusGlow.value, [0, 1], [0.98, 1.02]) }
      ],
    };
  });

  const getIQLabel = (level: number) => {
    if (level <= 110) return { text: 'High School Level', emoji: '🎓', color: '#4CAF50', description: 'Clear, straightforward explanations' };
    if (level <= 120) return { text: 'College Freshman', emoji: '📚', color: '#2196F3', description: 'More detailed academic language' };
    if (level <= 130) return { text: 'College Advanced', emoji: '🧠', color: '#9C27B0', description: 'Sophisticated analysis and reasoning' };
    if (level <= 140) return { text: 'Graduate Level', emoji: '🎯', color: '#FF9800', description: 'Complex theoretical frameworks' };
    if (level <= 150) return { text: 'Expert Level', emoji: '⚡', color: '#F44336', description: 'Professional academic discourse' };
    return { text: 'Genius Level', emoji: '🌟', color: '#FFD700', description: 'Cutting-edge intellectual complexity' };
  };

  const currentLabel = getIQLabel(value);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={[styles.iqLabel, { color: currentLabel.color }]}>
          {currentLabel.emoji} {currentLabel.text}
        </Text>
        <Text style={styles.iqValue}>IQ {value}</Text>
        <Text style={styles.description}>{currentLabel.description}</Text>
      </View>

      <View style={styles.sliderContainer}>
        {/* Genius Zone Indicator */}
        {value >= 150 && (
          <Animated.View style={[styles.geniusZone, geniusZoneStyle]}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.3)']}
              style={styles.geniusGradient}
            >
              <Text style={styles.geniusText}>✨ GENIUS ZONE ✨</Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Slider Track */}
        <Animated.View style={[styles.track, trackStyle]}>
          <LinearGradient
            colors={['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#FFD700']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientTrack}
          />
        </Animated.View>

        {/* Slider Thumb */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.thumb, thumbStyle]}>
            <Text style={styles.thumbEmoji}>{currentLabel.emoji}</Text>
          </Animated.View>
        </GestureDetector>

        {/* IQ Level Markers */}
        <View style={styles.markersContainer}>
          {[100, 115, 130, 145, 160].map((level) => (
            <View
              key={level}
              style={[
                styles.marker,
                {
                  left: ((level - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE) + THUMB_SIZE / 2 - 1,
                  backgroundColor: value >= level ? currentLabel.color : '#ddd',
                }
              ]}
            />
          ))}
        </View>
      </View>

      {/* IQ Range Descriptions */}
      <View style={styles.descriptionsContainer}>
        <Text style={styles.minLabel}>🎓 High School</Text>
        <Text style={styles.maxLabel}>🌟 Genius</Text>
      </View>

      {/* Academic Level Indicators */}
      <View style={styles.academicLevels}>
        <View style={styles.levelIndicator}>
          <View style={[styles.levelDot, { backgroundColor: value >= 100 ? '#4CAF50' : '#ddd' }]} />
          <Text style={styles.levelText}>HS</Text>
        </View>
        <View style={styles.levelIndicator}>
          <View style={[styles.levelDot, { backgroundColor: value >= 115 ? '#2196F3' : '#ddd' }]} />
          <Text style={styles.levelText}>College</Text>
        </View>
        <View style={styles.levelIndicator}>
          <View style={[styles.levelDot, { backgroundColor: value >= 130 ? '#9C27B0' : '#ddd' }]} />
          <Text style={styles.levelText}>Advanced</Text>
        </View>
        <View style={styles.levelIndicator}>
          <View style={[styles.levelDot, { backgroundColor: value >= 145 ? '#FF9800' : '#ddd' }]} />
          <Text style={styles.levelText}>Graduate</Text>
        </View>
        <View style={styles.levelIndicator}>
          <View style={[styles.levelDot, { backgroundColor: value >= 160 ? '#FFD700' : '#ddd' }]} />
          <Text style={styles.levelText}>Genius</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  labelContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iqLabel: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  iqValue: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sliderContainer: {
    height: 60,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  geniusZone: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 20,
    zIndex: 0,
  },
  geniusGradient: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  geniusText: {
    color: '#B8860B',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    position: 'relative',
    zIndex: 1,
  },
  gradientTrack: {
    height: '100%',
    borderRadius: 6,
    opacity: 0.4,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 3,
    borderWidth: 3,
    borderColor: 'white',
  },
  thumbEmoji: {
    fontSize: 22,
  },
  markersContainer: {
    position: 'absolute',
    width: '100%',
    height: 12,
    zIndex: 2,
  },
  marker: {
    position: 'absolute',
    width: 2,
    height: 12,
    backgroundColor: '#ddd',
  },
  descriptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: THUMB_SIZE / 2,
  },
  minLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#4CAF50',
  },
  maxLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFD700',
  },
  academicLevels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  levelIndicator: {
    alignItems: 'center',
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  levelText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666',
  },
});