import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, FlatList, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import PalCard from '@/components/PalCard';
import AuthHeader from '@/components/AuthHeader';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [pinnedItems, setPinnedItems] = useState([]);
  const opacity = useSharedValue(0);

  // Pals array remains the same
  const pals = [
    {
      title: 'Cringe Pal',
      description: 'Hot or cringe analyzer with humor and tips',
      icon: '⚡️',
      gradient: ['#f093fb', '#f5576c'],
      route: '/cringe',
      isComingSoon: false,
    },
    {
      title: 'Roasta Pal',
      description: 'Get roasted with customizable intensity levels',
      icon: '💬',
      gradient: ['#fa709a', '#fee140'],
      route: '/roast',
      isComingSoon: false,
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
      isComingSoon: false,
    },
    {
      title: 'Homework Pal',
      description: 'Get help with homework questions and problems',
      icon: '📚',
      gradient: ['#43e97b', '#38f9d7'],
      route: '/homework',
      isComingSoon: false,
    },
  ];

  // Testimonials array (hardcoded for now)
  const testimonials = [
    { quote: 'Cringe Pal saved my social life!', user: 'College Freshman' },
    { quote: 'Homework Pal is a lifesaver for late nights!', user: 'High School Senior' },
    { quote: 'The roasts are hilarious and spot-on!', user: 'Student' },
  ];

  // Sample daily challenge (hardcoded)
  const dailyChallenge = { title: 'Daily Roast: Try Cringe Pal on your latest selfie!' };

  useEffect(() => {
    if (user) {
      // Fetch pinned items from Supabase
      supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .then(({ data }) => setPinnedItems(data || []));
    }
    // Hero animation
    opacity.value = withSpring(1);
  }, [user]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const renderTestimonial = ({ item }) => (
    <View style={[styles.testimonialCard, { backgroundColor: isDark ? '#333' : '#fff' }]}>
      <Text style={[styles.testimonialQuote, { color: isDark ? '#fff' : '#333' }]}>"{item.quote}"</Text>
      <Text style={[styles.testimonialUser, { color: isDark ? '#ccc' : '#666' }]}>- {item.user}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <LinearGradient
        colors={isDark ? ['#333', '#444'] : ['#667eea', '#764ba2']}
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
      
      <Animated.ScrollView 
        style={[styles.content, animatedStyle]} 
        showsVerticalScrollIndicator={false}
      >
        {user ? (
          <>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>Your Dashboard</Text>
            
            {/* Pinned Favorites */}
            {pinnedItems.length > 0 && (
              <View>
                <Text style={[styles.subSectionTitle, { color: isDark ? '#ddd' : '#333' }]}>Pinned Favorites</Text>
                <FlatList
                  data={pinnedItems}
                  renderItem={({ item }) => <PalCard {...item} />}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalList}
                />
              </View>
            )}
            
            {/* Daily Challenge */}
            <View style={[styles.challengeCard, { backgroundColor: isDark ? '#333' : '#fff' }]}>
              <Text style={[styles.challengeTitle, { color: isDark ? '#fff' : '#333' }]}>{dailyChallenge.title}</Text>
            </View>
          </>
        ) : (
          <>
            {/* Hero Section for Non-Logged-In */}
            <Animated.View style={[styles.heroSection, animatedStyle]}>
              <Text style={styles.heroTitle}>Welcome to Pal Universe!</Text>
              <Text style={styles.heroSubtitle}>Your fun AI companions for studying and laughs</Text>
            </Animated.View>
            
            {/* Teaser Carousel */}
            <FlatList
              data={pals.slice(0, 3)} // Tease first 3
              renderItem={({ item }) => <PalCard {...item} />}
              keyExtractor={(item) => item.title}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalList}
            />
          </>
        )}
        
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>Choose Your Pal</Text>
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
        
        {/* Testimonials */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>What Students Say</Text>
        <FlatList
          data={testimonials}
          renderItem={renderTestimonial}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalList}
        />
      </Animated.ScrollView>
      
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
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 16, 
    paddingBottom: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 120,
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
    fontSize: 20,
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
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
  },
  challengeCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  challengeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  horizontalList: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  testimonialCard: {
    width: 250,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testimonialQuote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  testimonialUser: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'right',
  },
});