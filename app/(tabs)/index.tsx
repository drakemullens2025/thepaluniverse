import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import PalCard from '@/components/PalCard';
import AuthHeader from '@/components/AuthHeader';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  // Pals have been reordered and icons/statuses updated as requested.
  const pals = [
    {
      title: 'Cringe Pal',
      description: 'Hot or cringe analyzer with humor and tips',
      icon: '⚡️', // Updated icon
      gradient: ['#f093fb', '#f5576c'],
      route: '/cringe',
      isComingSoon: false,
    },
    {
      title: 'Roasta Pal',
      description: 'Get roasted with customizable intensity levels',
      icon: '💬', // Updated icon
      gradient: ['#fa709a', '#fee140'],
      route: '/roast',
      isComingSoon: false, // Now active
    },
    {
      title: 'Study Pal',
      description: 'Interactive study companion with quizzes and motivation',
      icon: '🎓',
      gradient: ['#667eea', '#764ba2'],
      route: '/study',
      isComingSoon: true,
    },
    {
      title: 'Note Pal',
      description: 'Polish and summarize your handwritten notes',
      icon: '📝',
      gradient: ['#4facfe', '#00f2fe'],
      route: '/notes',
      isComingSoon: false, // Now active
    },
    {
      title: 'Homework Pal',
      description: 'Get help with homework questions and problems',
      icon: '📚',
      gradient: ['#43e97b', '#38f9d7'],
      route: '/homework',
      isComingSoon: false, // Now active
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <AuthHeader onAuthPress={() => setShowAuthModal(true)} />
        <Text style={styles.title}>Pal Universe</Text>
        <Text style={styles.subtitle}>Your AI pals for every task</Text>
      </LinearGradient>
      
      {/* Auth CTA Section - only show when not logged in */}
      {!user && (
        <View style={styles.authCTASection}>
          <Text style={styles.hookText}>Brave enough?</Text>
          <TouchableOpacity 
            style={styles.ctaButton} 
            onPress={() => setShowAuthModal(true)}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Start Here</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Choose Your Pal</Text>
        {pals.map((pal, index) => (
          <PalCard
            key={index}
            title={pal.title}
            description={pal.description}
            icon={pal.icon}
            gradient={pal.gradient}
            onPress={() => router.push(pal.route as any)}
            isComingSoon={pal.isComingSoon}
          />
        ))}
      </ScrollView>
      
      <AuthModal 
        visible={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Changed to white for a cleaner look
  },
  // Header styles updated for a more compact design
  header: {
    paddingHorizontal: 32,
    paddingTop: 20, 
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    alignItems: 'center',
  },
  authCTASection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  hookText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#667eea',
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  ctaText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  title: {
    fontSize: 28, // Slightly smaller for mobile
    fontFamily: 'Inter-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15, // Slightly smaller for mobile
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 20, // Add padding to prevent text from touching edges
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // Reduced horizontal padding for mobile
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 22, // Slightly smaller for mobile
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
});