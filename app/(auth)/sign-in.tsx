import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, Layers } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { trackApiCall } from '@/lib/api-logger';
import { 
  AnimatedAuthCard,
  AnimatedLogo,
  AnimatedForm,
  AnimatedFormToggle,
  AnimatedTitle,
  AnimatedSubtitle 
} from '@/components/AnimatedAuthCard';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    try {
      setLoading(true);
      setError(null);
      
      await trackApiCall('/auth/sign-in', 'POST', async () => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.replace('/(tabs)');
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const navigateToSignUp = () => {
    router.push('/(auth)/sign-up');
  };

  return (
    <AnimatedAuthCard>
      <AnimatedLogo>
        <View style={styles.logoCircle}>
          <Layers color="#fff" size={24} />
        </View>
      </AnimatedLogo>

      <AnimatedFormToggle>
        <Text style={[styles.toggleButton, styles.activeToggle]}>Sign In</Text>
        <TouchableOpacity onPress={navigateToSignUp}>
          <Text style={styles.toggleButton}>Create Account</Text>
        </TouchableOpacity>
      </AnimatedFormToggle>

      <AnimatedTitle>Sign In to Your Account</AnimatedTitle>
      <AnimatedSubtitle>Enter your credentials to access your account</AnimatedSubtitle>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <AnimatedForm>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#606060"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Mail color="#606060" size={20} style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#606060"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Lock color="#606060" size={20} style={styles.inputIcon} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={signIn}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </AnimatedForm>
    </AnimatedAuthCard>
  );
}

const styles = StyleSheet.create({
  logoCircle: {
    width: 48,
    height: 48,
    backgroundColor: '#0073e6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    color: '#a0a0a0',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeToggle: {
    color: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#0073e6',
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e0e0e0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  button: {
    backgroundColor: '#0073e6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#3B1B1B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 14,
  },
});