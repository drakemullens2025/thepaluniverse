import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, Trash2, Download, Eye } from 'lucide-react-native';
import { sharingService, SharedCreation } from '@/lib/sharing';
import { useAuth } from '@/contexts/AuthContext';
import PhotoMarkupModal from './PhotoMarkupModal';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = (screenWidth - 60) / 2; // 2 columns with padding

export default function CreationsGallery() {
  const { user } = useAuth();
  const [creations, setCreations] = useState<SharedCreation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreation, setSelectedCreation] = useState<SharedCreation | null>(null);
  const [showMarkupModal, setShowMarkupModal] = useState(false);

  useEffect(() => {
    loadCreations();
  }, [user]);

  const loadCreations = async () => {
    setLoading(true);
    try {
      if (user) {
        // Load from database
        const dbCreations = await sharingService.getUserCreations(user.id);
        setCreations(dbCreations);
      } else {
        // Load from local storage
        const localCreations = await sharingService.getLocalCreations();
        setCreations(localCreations);
      }
    } catch (error) {
      console.error('Error loading creations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (creation: SharedCreation) => {
    Alert.alert(
      'Delete Creation',
      'Are you sure you want to delete this creation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await sharingService.deleteCreation(
                creation.id,
                creation.type,
                !user // isLocal if no user
              );
              
              if (success) {
                setCreations(prev => prev.filter(c => c.id !== creation.id));
              } else {
                Alert.alert('Error', 'Failed to delete creation');
              }
            } catch (error) {
              if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
                Alert.alert(
                  'Storage Error',
                  'Unable to update storage. Please try logging in for cloud storage or restart the app.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', 'Failed to delete creation');
              }
            }
          },
        },
      ]
    );
  };

  const handleEdit = (creation: SharedCreation) => {
    setSelectedCreation(creation);
    setShowMarkupModal(true);
  };

  const renderCreationItem = (creation: SharedCreation) => {
    const isRoast = creation.type === 'roast';
    
    return (
      <View key={creation.id} style={styles.creationItem}>
        <TouchableOpacity onPress={() => handleEdit(creation)}>
          <Image source={{ uri: creation.imageUri }} style={styles.creationImage} />
          
          {/* Overlay with metadata */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.creationOverlay}
          >
            <View style={styles.creationMetadata}>
              <Text style={styles.creationType}>
                {isRoast ? '🔥 Roast' : '⚡ Cringe'}
              </Text>
              {isRoast && creation.metadata.intensity && (
                <Text style={styles.metadataText}>
                  Level {creation.metadata.intensity}
                </Text>
              )}
              {!isRoast && creation.metadata.hotLevel !== undefined && (
                <Text style={styles.metadataText}>
                  🔥{creation.metadata.hotLevel}% 😬{creation.metadata.cringeLevel}%
                </Text>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Action buttons */}
        <View style={styles.creationActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(creation)}
          >
            <Eye size={16} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(creation)}
          >
            <Trash2 size={16} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your creations...</Text>
      </View>
    );
  }

  if (creations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎨</Text>
        <Text style={styles.emptyTitle}>No Creations Yet</Text>
        <Text style={styles.emptyText}>
          Create your first roast or cringe analysis and it will appear here!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadCreations} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Creations</Text>
        <Text style={styles.subtitle}>
          {creations.length} creation{creations.length !== 1 ? 's' : ''}
        </Text>
        
        <View style={styles.grid}>
          {creations.map(renderCreationItem)}
        </View>
      </ScrollView>
      
      {/* Markup Modal */}
      {selectedCreation && (
        <PhotoMarkupModal
          visible={showMarkupModal}
          onClose={() => {
            setShowMarkupModal(false);
            setSelectedCreation(null);
          }}
          imageUri={selectedCreation.imageUri}
          aiResponse={selectedCreation.aiResponse}
          responseType={selectedCreation.type}
          metadata={selectedCreation.metadata}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
    marginBottom: 4,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 40,
  },
  creationItem: {
    width: ITEM_WIDTH,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  creationImage: {
    width: '100%',
    height: ITEM_WIDTH * 1.2,
    backgroundColor: '#f0f0f0',
  },
  creationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  creationMetadata: {
    alignItems: 'flex-start',
  },
  creationType: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 2,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  creationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreationsGallery