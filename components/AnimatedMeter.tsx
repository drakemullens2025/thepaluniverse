import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedMeterProps {
  label: string;
  value: number;
  maxValue: number;
  color: string[];
  icon: string;
}

export default function AnimatedMeter({ label, value, maxValue, color, icon }: AnimatedMeterProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(value / maxValue, {
      damping: 15,
      stiffness: 100,
    });
  }, [value, maxValue]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  const textColorStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        progress.value,
        [0, 0.5, 1],
        ['#666', color[0], color[1]]
      ),
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Animated.Text style={[styles.label, textColorStyle]}>{label}</Animated.Text>
        <Animated.Text style={[styles.value, textColorStyle]}>{value}</Animated.Text>
      </View>
      <View style={styles.meterContainer}>
        <View style={styles.meterBackground}>
          <Animated.View style={[styles.meterFill, animatedStyle]}>
            <LinearGradient
              colors={color}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  meterContainer: {
    height: 12,
  },
  meterBackground: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 6,
  },
  gradient: {
    flex: 1,
  },
});