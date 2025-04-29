import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { LocationProvider } from '@/lib/context/LocationContext';

export default function RootLayout() {
  useFrameworkReady();
  const { session, loading } = useAuth();

  useEffect(() => {
    console.log('[Layout] Session state:', !!session, 'Loading:', loading);
    if (!loading && !session) {
      console.log('[Layout] No session detected, redirecting...');
      // Add a small delay for Android to ensure navigation is ready
      if (Platform.OS === 'android') {
        setTimeout(() => {
          router.replace('/(auth)/sign-in');
        }, 100);
      } else {
        router.replace('/(auth)/sign-in');
      }
    }
  }, [session, loading]);

  // Show loading state while checking authentication
  if (loading) {
    console.log('[Layout] Showing loading screen...');
    return (
      <View style={{ flex: 1, backgroundColor: '#1c1c1e', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <LocationProvider>
      <View style={{ flex: 1, backgroundColor: '#1c1c1e' }}>
        <Stack screenOptions={{ headerShown: false }}>
          {session ? (
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          ) : (
            <Stack.Screen 
              name="(auth)" 
              options={{ 
                headerShown: false,
                animation: Platform.OS === 'android' ? 'none' : 'fade'
              }} 
            />
          )}
        </Stack>
        <StatusBar style="light" />
      </View>
    </LocationProvider>
  );
}