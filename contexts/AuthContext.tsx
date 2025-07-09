import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { authService, AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  profile: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    authService.getCurrentUser().then((user) => {
      setUser(user);
      if (user) {
        loadUserProfile(user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        await loadUserProfile(user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    const profile = await authService.getUserProfile(userId);
    setProfile(profile);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signIn(email, password);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await authService.signUp(email, password);
    return { error };
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return { error: 'No user logged in' };
    
    const { error } = await authService.updateProfile(user.id, updates);
    if (!error) {
      await loadUserProfile(user.id);
    }
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}