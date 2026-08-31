import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, AppRole } from '../types/database';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  role: AppRole;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password?: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  switchRole: (newRole: AppRole) => void;
  allUsers: Profile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // SEC-04 fix: Never trust localStorage for initial role/user state.
  // Start null and let initAuth() set user from the server-validated session.
  // This ensures isLoading guards all protected routes until Supabase confirms.
  const [user, setUser] = useState<Profile | null>(null);


  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isDemoMode = false;

  // Real Supabase session listener
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchSupabaseProfile(session.user.id);
        } else {
          if (isMounted) setUser(null);
        }
      } catch (e) {
        console.error('Session init error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchSupabaseProfile(session.user.id);
      } else {
        setUser(null);
        localStorage.removeItem('ctp_current_user');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setAllUsers(data as Profile[]);
      }
    } catch (e) {
      console.error('Error fetching all users:', e);
    }
  };

  const fetchSupabaseProfile = async (userId: string, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        const profile = data as Profile;
        setUser(profile);
        localStorage.setItem('ctp_current_user', JSON.stringify(profile));
        
        // If the user is an admin, populate the allUsers state
        if (profile.role === 'admin') {
          fetchAllUsers();
        }
      } else if (retries > 0) {
        // DB Trigger might still be processing. Wait 500ms and retry.
        setTimeout(() => fetchSupabaseProfile(userId, retries - 1), 500);
      } else {
        console.error('Profile not found after retries. Trigger may have failed.');
        setUser(null);
      }
    } catch (e) {
      console.error('Error fetching Supabase profile:', e);
    }
  };

  const signIn = async (email: string, password: string = 'password123') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        await fetchSupabaseProfile(data.user.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string = 'password123', displayName: string = '') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName }
        }
      });
      if (error) throw error;
      if (data.user) {
        await fetchSupabaseProfile(data.user.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('ctp_current_user');
    setUser(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;

    // Perform Supabase update first — only update local state on success
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }

    const updated = { ...user, ...data, updated_at: new Date().toISOString() };
    setUser(updated);
    localStorage.setItem('ctp_current_user', JSON.stringify(updated));
  };

  const switchRole = (_newRole: AppRole) => {
    // Demo mode quick-switch disabled as requested
    console.warn('Switch role is disabled. Role is determined by database profile.');
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || 'user',
      isLoading,
      isDemoMode,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateProfile,
      switchRole,
      allUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
