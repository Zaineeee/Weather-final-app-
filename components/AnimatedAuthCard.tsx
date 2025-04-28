import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInDown,
  SlideInUp 
} from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function AnimatedAuthCard({ children, visible = true }) {
  if (!visible) return null;

  return (
    <Animated.View 
      entering={FadeIn.duration(800)}
      layout={Layout.springify()}
      style={styles.container}>
      <AnimatedBlurView
        entering={FadeIn.duration(1000)}
        intensity={50}
        tint="dark"
        style={styles.authCard}>
        {children}
      </AnimatedBlurView>
    </Animated.View>
  );
}

export function AnimatedLogo({ children }) {
  return (
    <Animated.View
      entering={SlideInDown.duration(800).springify()}
      style={styles.logo}>
      {children}
    </Animated.View>
  );
}

export function AnimatedForm({ children }) {
  return (
    <Animated.View
      entering={SlideInUp.duration(800).springify().delay(400)}
      style={styles.form}>
      {children}
    </Animated.View>
  );
}

export function AnimatedFormToggle({ children }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(800).delay(200)}
      style={styles.formToggle}>
      {children}
    </Animated.View>
  );
}

export function AnimatedTitle({ children }) {
  return (
    <Animated.Text
      entering={FadeInDown.duration(800).delay(300)}
      style={styles.title}>
      {children}
    </Animated.Text>
  );
}

export function AnimatedSubtitle({ children }) {
  return (
    <Animated.Text
      entering={FadeInDown.duration(800).delay(400)}
      style={styles.subtitle}>
      {children}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  logo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  form: {
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    color: '#a0a0a0',
    fontSize: 16,
    marginBottom: 24,
  },
});