import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (data.user && !error) {
      // Create profile entry
      await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          display_name: email.split('@')[0], // Use email prefix as initial display name
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }
    
    return { user: data.user, error };
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { user: data.user, error };
  },

  // Sign out
  async signOut(): Promise<{ error: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<AuthUser | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email || '',
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
    };
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<{ error: any }> {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.displayName,
        avatar_url: updates.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    return { error };
  },

  // Listen to auth changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  },
};