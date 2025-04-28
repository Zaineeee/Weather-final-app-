import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Platform } from 'react-native';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] Starting auth check...');
    
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Initial session check:', !!session);
      setSession(session);
      setLoading(false);
      
      if (!session) {
        console.log('[Auth] No session, redirecting to sign-in...');
        // Add a small delay for Android to ensure navigation is ready
        if (Platform.OS === 'android') {
          setTimeout(() => {
            router.replace('/(auth)/sign-in');
          }, 100);
        } else {
          router.replace('/(auth)/sign-in');
        }
      }
    }).catch((error) => {
      console.log('[Auth] Session check error:', error);
      setSession(null);
      setLoading(false);
      // Add a small delay for Android to ensure navigation is ready
      if (Platform.OS === 'android') {
        setTimeout(() => {
          router.replace('/(auth)/sign-in');
        }, 100);
      } else {
        router.replace('/(auth)/sign-in');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State changed:', event, !!session);
      
      if (event === 'INITIAL_SESSION') {
        setSession(session);
        setLoading(false);
        if (!session) {
          console.log('[Auth] No initial session, redirecting...');
          // Add a small delay for Android to ensure navigation is ready
          if (Platform.OS === 'android') {
            setTimeout(() => {
              router.replace('/(auth)/sign-in');
            }, 100);
          } else {
            router.replace('/(auth)/sign-in');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] Signed out, redirecting...');
        setSession(null);
        setLoading(false);
        router.replace('/(auth)/sign-in');
      } else if (event === 'SIGNED_IN' && session) {
        console.log('[Auth] Signed in, redirecting to tabs...');
        setSession(session);
        setLoading(false);
        router.replace('/(tabs)');
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    session,
    loading,
    signOut,
  };
}