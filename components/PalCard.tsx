import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PalCardProps {
  title: string;
  description: string;
  icon: string;
  gradient: string[];
  onPress: () => void;
  isComingSoon?: boolean;
}

export default function PalCard({ title, description, icon, gradient, onPress, isComingSoon }: PalCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} disabled={isComingSoon}>
      <LinearGradient colors={gradient} style={styles.gradient}>
        <View style={styles.content}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          {isComingSoon && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginVertical: 6, // Reduced margin for tighter spacing
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    borderRadius: 20,
    padding: 16, // Reduced padding for mobile
    minHeight: 100, // Reduced height for mobile
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28, // Slightly smaller icon
    marginBottom: 6,
  },
  title: {
    fontSize: 18, // Smaller title for mobile
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  description: {
    fontSize: 13, // Smaller description
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  comingSoonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});