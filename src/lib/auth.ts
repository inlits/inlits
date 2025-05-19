import { create } from 'zustand';
import { supabase } from './supabase';
import type { User, Provider } from '@supabase/supabase-js';
import type { Profile, UserRole } from './types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: Provider) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  resendVerificationEmail: () => Promise<void>;
  isAuthenticated: () => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  refreshSession: () => Promise<void>;
}

const useAuth = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  refreshSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session?.user) {
        set({ user: session.user });
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        if (profile) {
          set({ profile });
        }
      } else {
        set({ user: null, profile: null });
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      set({ user: null, profile: null });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, username: string, role: UserRole) => {
    try {
      // Validate password
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      if (!/[A-Z]/.test(password)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        throw new Error('Password must contain at least one lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        throw new Error('Password must contain at least one number');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new Error('Password must contain at least one special character');
      }

      // Validate username format
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      // Check if username is already taken
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username);

      if (checkError) throw checkError;
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Username is already taken');
      }

      // Create the user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role,
          },
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (signUpError) {
        console.error('Sign up error details:', signUpError);
        throw signUpError;
      }
      
      if (!user) throw new Error('No user returned from sign up');

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('Profile not found, creating manually...');
        
        // If profile doesn't exist, create it manually
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username,
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          if (!insertError.message.includes('duplicate key')) {
            throw insertError;
          }
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data: { user, session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) throw signInError;
      if (!user) throw new Error('No user returned from sign in');

      set({ user, loading: true });

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        
        // If profile doesn't exist, try to create it
        if (profileError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: email.split('@')[0],
              role: 'consumer',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('Error creating profile on sign in:', insertError);
            throw new Error('Failed to create user profile. Please try again.');
          }
          
          // Fetch the newly created profile
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (newProfile) {
            set({ profile: newProfile, loading: false });
            localStorage.setItem('userProfile', JSON.stringify(newProfile));
            return;
          }
        }
        
        throw new Error('Failed to load user profile. Please try again.');
      }

      if (!profile) throw new Error('No profile found');

      localStorage.setItem('sb-session', JSON.stringify(session));
      localStorage.setItem('userProfile', JSON.stringify(profile));

      set({ profile, loading: false });
    } catch (error) {
      set({ user: null, profile: null, loading: false });
      localStorage.removeItem('sb-session');
      localStorage.removeItem('userProfile');
      throw error;
    }
  },

  signInWithProvider: async (provider: Provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with provider:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem('sb-session');
      localStorage.removeItem('userProfile');
      
      set({ user: null, profile: null, loading: false });
      
      // Force a page reload to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      localStorage.removeItem('sb-session');
      localStorage.removeItem('userProfile');
      set({ user: null, profile: null, loading: false });
      window.location.href = '/';
    }
  },

  setUser: async (user) => {
    if (!user) {
      set({ user: null, profile: null, loading: false });
      localStorage.removeItem('userProfile');
      return;
    }

    set({ user, loading: true });

    try {
      const cachedProfile = localStorage.getItem('userProfile');
      if (cachedProfile) {
        const profile = JSON.parse(cachedProfile);
        if (profile.id === user.id) {
          set({ profile, loading: false });
          return;
        }
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: user.email?.split('@')[0] || `user_${Date.now()}`,
              role: 'consumer',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('Error creating profile on setUser:', insertError);
          } else {
            // Fetch the newly created profile
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
              
            if (newProfile) {
              localStorage.setItem('userProfile', JSON.stringify(newProfile));
              set({ profile: newProfile, loading: false });
              return;
            }
          }
        }
        
        set({ loading: false });
        return;
      }
      
      if (profile) {
        localStorage.setItem('userProfile', JSON.stringify(profile));
        set({ profile, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ loading: false });
    }
  },

  setProfile: (profile) => {
    if (profile) {
      localStorage.setItem('userProfile', JSON.stringify(profile));
    }
    set({ profile, loading: false });
  },

  resendVerificationEmail: async () => {
    const { user } = get();
    if (!user?.email) throw new Error('No email address found');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });
    if (error) throw error;
  },

  isAuthenticated: () => {
    const { user, profile } = get();
    return !!user && !!profile;
  },

  hasRole: (roles: UserRole[]) => {
    const { profile } = get();
    return !!profile && roles.includes(profile.role);
  },
}));

export { useAuth };

// Initialize auth state
const initAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting initial session:', error);
      useAuth.getState().setUser(null);
      return;
    }

    if (session?.user) {
      await useAuth.getState().setUser(session.user);
    } else {
      useAuth.getState().setUser(null);
    }
  } catch (error) {
    console.error('Error during auth initialization:', error);
    useAuth.getState().setUser(null);
  } finally {
    useAuth.setState({ loading: false });
  }
};

// Initialize auth state immediately
initAuth();

// Set up auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session?.user) {
      await useAuth.getState().setUser(session.user);
    }
  } else if (event === 'SIGNED_OUT') {
    useAuth.getState().setUser(null);
  }
});