import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import PalCard from '@/components/PalCard';

export default function HomeScreen() {
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
      isComingSoon: true,
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
        <Text style={styles.title}>Pal Universe</Text>
        <Text style={styles.subtitle}>Your AI pals for every task</Text>
      </LinearGradient>
      
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
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4, // Reduced margin
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
});