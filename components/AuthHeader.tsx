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
      <View style={styles.hookContainer}>
        {/* Stick figure logo using the provided image */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.stickFigureImage}
            resizeMode="contain"
          />
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
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Space between logo and CTA
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stickFigureImage: {
    width: 32,
    height: 32,
    tintColor: 'white', // Apply white tint for visibility against gradient
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
    marginLeft: 'auto', // Align right within hookContainer
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