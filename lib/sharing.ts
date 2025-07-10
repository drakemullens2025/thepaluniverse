import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Platform } from 'react-native';

export interface SharedCreation {
  id: string;
  userId: string;
  type: 'roast' | 'cringe';
  imageUri: string;
  aiResponse: string;
  metadata: any;
  createdAt: string;
  shareCount: number;
  likeCount: number;
}

export const sharingService = {
  // Save creation locally
  async saveCreationLocally(creation: Omit<SharedCreation, 'id' | 'shareCount' | 'likeCount'>): Promise<string> {
    try {
      const id = Date.now().toString();
      const fullCreation: SharedCreation = {
        ...creation,
        id,
        shareCount: 0,
        likeCount: 0,
      };
      
      const existingCreations = await this.getLocalCreations();
      const updatedCreations = [fullCreation, ...existingCreations];
      
      try {
        await AsyncStorage.setItem('saved_creations', JSON.stringify(updatedCreations));
      } catch (storageError: any) {
        if (storageError.name === 'QuotaExceededError' || storageError.message?.includes('quota')) {
          throw new Error('QUOTA_EXCEEDED');
        }
        throw storageError;
      }
      return id;
    } catch (error) {
      if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
        throw error;
      }
      console.error('Error saving creation locally:', error);
      throw error;
    }
  },

  // Get local creations
  async getLocalCreations(): Promise<SharedCreation[]> {
    try {
      const stored = await AsyncStorage.getItem('saved_creations');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting local creations:', error);
      return [];
    }
  },

  // Save creation to database (if user is logged in)
  async saveCreationToDatabase(creation: Omit<SharedCreation, 'id' | 'shareCount' | 'likeCount'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from(creation.type === 'roast' ? 'roasts' : 'cringe_ratings')
        .insert({
          user_id: creation.userId,
          item_url: creation.imageUri,
          item_text: creation.aiResponse,
          ...(creation.type === 'roast' 
            ? { 
                intensity: creation.metadata.intensity || 1,
                roast_text: creation.aiResponse 
              }
            : { 
                hot_score: creation.metadata.hotLevel || 0,
                cringe_score: creation.metadata.cringeLevel || 0,
                tips: creation.metadata.tips || []
              }
          )
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving to database:', error);
      return null;
    }
  },

  // Get user's creations from database
  async getUserCreations(userId: string): Promise<SharedCreation[]> {
    try {
      const [roastsResult, cringeResult] = await Promise.all([
        supabase
          .from('roasts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('cringe_ratings')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      ]);

      const roasts: SharedCreation[] = (roastsResult.data || []).map(roast => ({
        id: roast.id,
        userId: roast.user_id,
        type: 'roast' as const,
        imageUri: roast.item_url || '',
        aiResponse: roast.roast_text,
        metadata: { intensity: roast.intensity },
        createdAt: roast.created_at,
        shareCount: 0, // TODO: Add share tracking
        likeCount: 0,  // TODO: Add like tracking
      }));

      const cringeAnalyses: SharedCreation[] = (cringeResult.data || []).map(cringe => ({
        id: cringe.id,
        userId: cringe.user_id,
        type: 'cringe' as const,
        imageUri: cringe.item_url || '',
        aiResponse: cringe.tips ? cringe.tips.join(' ') : '',
        metadata: { 
          hotLevel: cringe.hot_score,
          cringeLevel: cringe.cringe_score,
          tips: cringe.tips 
        },
        createdAt: cringe.created_at,
        shareCount: 0,
        likeCount: 0,
      }));

      return [...roasts, ...cringeAnalyses].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting user creations:', error);
      return [];
    }
  },

  // Delete creation
  async deleteCreation(id: string, type: 'roast' | 'cringe', isLocal: boolean = false): Promise<boolean> {
    try {
      if (isLocal) {
        const creations = await this.getLocalCreations();
        const filtered = creations.filter(c => c.id !== id);
        try {
          await AsyncStorage.setItem('saved_creations', JSON.stringify(filtered));
        } catch (storageError: any) {
          if (storageError.name === 'QuotaExceededError' || storageError.message?.includes('quota')) {
            throw new Error('QUOTA_EXCEEDED');
          }
          throw storageError;
        }
        return true;
      } else {
        const { error } = await supabase
          .from(type === 'roast' ? 'roasts' : 'cringe_ratings')
          .delete()
          .eq('id', id);
        
        return !error;
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
        throw error;
      }
      console.error('Error deleting creation:', error);
      return false;
    }
  },

  // Generate share text
  generateShareText(creation: SharedCreation): string {
    const baseText = `Check out my ${creation.type === 'roast' ? 'roast' : 'cringe analysis'} from Pal Universe! 🔥`;
    
    if (creation.type === 'roast' && creation.metadata.intensity) {
      return `${baseText}\n\n🔥 Roast Level: ${creation.metadata.intensity}/5\n💀 Burn Level: ${creation.metadata.burnLevel || 0}%\n\nGet roasted at Pal Universe!`;
    } else if (creation.type === 'cringe') {
      return `${baseText}\n\n🔥 Hot Level: ${creation.metadata.hotLevel || 0}%\n😬 Cringe Level: ${creation.metadata.cringeLevel || 0}%\n\nGet your cringe analyzed at Pal Universe!`;
    }
    
    return baseText;
  },
};