import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';

interface AuthHeaderProps {
  onAuthPress: () => void;
}

export default function AuthHeader({ onAuthPress }: AuthHeaderProps) {
  const { user, profile, signOut } = useAuth();
  
  // Button press animation
  const buttonScale = useSharedValue(1);

  const handlePress = () => {
    if (user) {
      signOut();
    } else {
      buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
        buttonScale.value = withSpring(1, { duration: 100 });
      });
      onAuthPress();
    }
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  if (user) {
    // Logged-in state: Profile circle
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

  // Logged-out state: Logo + CTA
  return (
    <View style={styles.container}>
      {/* Stick figure logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={styles.stickFigureImage}
          resizeMode="contain"
        />
      </View>
      
      {/* Hook text and CTA button in column */}
      <View style={styles.textContainer}>
        <Text style={styles.hookText}>Brave enough?</Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickFigureImage: {
    width: 36,
    height: 36,
    // Remove tintColor to show the original black stick figure
  },
  textContainer: {
    alignItems: 'flex-start',
    gap: 6,
  },
  hookText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  ctaGradient: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  ctaText: {
    color: 'white',
    fontSize: 11,
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