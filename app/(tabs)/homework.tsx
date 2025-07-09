import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap, Clock, Brain, Target } from 'lucide-react-native';

export default function StudyPalScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerIcon}>🎓</Text>
        <Text style={styles.title}>Study Pal</Text>
        <Text style={styles.subtitle}>Your interactive study companion</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800' }}
          style={styles.heroImage}
        />
        
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            Study Pal will help you master any subject with personalized study sessions, 
            interactive quizzes, and motivational check-ins.
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Planned Features</Text>
          
          <View style={styles.featureItem}>
            <Clock size={24} color="#667eea" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Check-ins</Text>
              <Text style={styles.featureDescription}>
                Customizable study intervals with motivational reminders
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Brain size={24} color="#667eea" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>AI-Generated Quizzes</Text>
              <Text style={styles.featureDescription}>
                Personalized quizzes based on your study material
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Target size={24} color="#667eea" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Progress Tracking</Text>
              <Text style={styles.featureDescription}>
                Monitor your learning progress and achievements
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 20, 
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  comingSoonCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#667eea',
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featuresTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureText: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    lineHeight: 20,
  },
});



this is the header size i want: import React from 'react';
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

