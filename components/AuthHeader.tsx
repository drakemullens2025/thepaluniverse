import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';

interface AuthHeaderProps {
  onAuthPress: () => void;
}

export default function AuthHeader({ onAuthPress }: AuthHeaderProps) {
  const { user, profile, signOut } = useAuth();
  
  // Animation values
  const glowPulse = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (!user) {
      // Animate the "Brave enough?" hook
      glowPulse.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );
      
      sparkleRotation.value = withRepeat(
        withTiming(360, { duration: 3000 }),
        -1,
        false
      );
    }
  }, [user]);

  const handlePress = () => {
    if (user) {
      // Show logout confirmation or menu
      signOut();
    } else {
      // Animate button press
      buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
        buttonScale.value = withSpring(1, { duration: 100 });
      });
      onAuthPress();
    }
  };

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolateColor(
      glowPulse.value,
      [0, 1],
      [0.6, 1]
    ),
    transform: [
      { scale: interpolateColor(glowPulse.value, [0, 1], [1, 1.05]) }
    ],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  if (user) {
    // Logged-in state: Show profile circle
    const initials = profile?.displayName 
      ? profile.displayName.substring(0, 2).toUpperCase()
      : user.email?.substring(0, 2).toUpperCase() || 'U';

    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.profileContainer} onPress={handlePress}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </View>
          <View style={styles.logoutHint}>
            <LogOut size={12} color="#666" />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Logged-out state: Show "Brave enough?" hook
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.hookContainer, glowStyle]}>
        <View style={styles.questionContainer}>
          <Animated.Text style={[styles.sparkle, sparkleStyle]}>✨</Animated.Text>
          <Text style={styles.hookText}>Brave enough?</Text>
        </View>
        
        <Animated.View style={buttonStyle}>
          <TouchableOpacity style={styles.ctaButton} onPress={handlePress}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Start Here</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  hookContainer: {
    alignItems: 'flex-start',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sparkle: {
    fontSize: 16,
    marginRight: 6,
  },
  hookText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ctaButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  ctaGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ctaText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  profileInitials: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#667eea',
  },
  logoutHint: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});