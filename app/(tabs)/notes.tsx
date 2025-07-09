import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Camera, CreditCard as Edit3, Sparkles } from 'lucide-react-native';

export default function NotePalScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.header}
      >
        <Text style={styles.headerIcon}>📝</Text>
        <Text style={styles.title}>Note Pal</Text>
        <Text style={styles.subtitle}>Transform your handwritten notes</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=800' }}
          style={styles.heroImage}
        />
        
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            Note Pal will digitize, polish, and enhance your handwritten notes with 
            AI-powered summarization and context addition.
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Planned Features</Text>
          
          <View style={styles.featureItem}>
            <Camera size={24} color="#4facfe" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Image Recognition</Text>
              <Text style={styles.featureDescription}>
                Capture handwritten notes with your camera for instant digitization
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Edit3 size={24} color="#4facfe" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Note Polishing</Text>
              <Text style={styles.featureDescription}>
                Clean up and format your notes for better readability
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Sparkles size={24} color="#4facfe" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Summarization</Text>
              <Text style={styles.featureDescription}>
                Generate concise summaries and add relevant context
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
    padding: 32,
    paddingTop: 60,
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
    color: '#4facfe',
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