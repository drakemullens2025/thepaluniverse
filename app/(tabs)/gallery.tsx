import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CreationsGallery from '@/components/CreationsGallery';
import AuthHeader from '@/components/AuthHeader';

export default function GalleryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <AuthHeader onAuthPress={() => {}} />
      </LinearGradient>
      
      <CreationsGallery />
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
    minHeight: 80,
  },
});