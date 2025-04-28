import { Stack } from 'expo-router';
import { View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

const AnimatedView = Platform.OS === 'web' ? View : Animated.View;

export default function AuthLayout() {
  return (
    <LinearGradient
      colors={['#1a1a1a', '#0d0d0d']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}>
      <AnimatedView 
        style={{ flex: 1 }}
        {...(Platform.OS !== 'web' ? { entering: FadeIn.duration(1000) } : {})}>
        <Stack
          initialRouteName="sign-in"
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: 'transparent',
            },
            animation: Platform.OS === 'web' ? 'none' : 'fade',
          }}
        />
      </AnimatedView>
    </LinearGradient>
  );
}