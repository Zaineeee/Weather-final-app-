import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, Layers, User } from 'lucide-react-native';
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

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUp() {
    try {
      if (!email || !password || !fullName) {
        setError('Please fill in all fields');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      setLoading(true);
      setError(null);

      console.log('Starting sign-up process...');

      await trackApiCall('/auth/sign-up', 'POST', async () => {
        // Create new user first
        console.log('Creating new user account...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (authError) {
          console.error('Auth Error:', JSON.stringify(authError));
          throw authError;
        }

        if (!authData?.user?.id) {
          console.error('User creation failed - no user data returned');
          throw new Error('Failed to create user account');
        }

        console.log('User account created successfully, ID:', authData.user.id);

        // Small delay to ensure auth is propagated
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create user profile
        console.log('Creating user profile...');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email.toLowerCase(),
            full_name: fullName.trim(),
            theme: 'dark-gray',
            alerts_enabled: false,
            alert_frequency: 0,
            alert_time: '09:00:00',
            notification_sound: true,
            notification_vibration: true
          });

        if (profileError) {
          console.error('Profile Error Details:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          
          console.log('Attempting to clean up failed user creation...');
          try {
            await supabase.auth.signOut();
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        console.log('Profile created successfully');

        // Get the session to ensure we're logged in
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session Error:', sessionError);
          throw new Error('Failed to get user session');
        }

        if (!session?.session) {
          console.log('No session found, attempting to sign in...');
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) {
            console.error('Sign in Error:', signInError);
            throw new Error('Failed to sign in after registration');
          }
        }

        console.log('Sign-up process completed successfully');
        router.replace('/(tabs)');
      });
    } catch (e: any) {
      console.error('Sign-up error details:', {
        message: e.message,
        code: e.code,
        details: e.details,
        stack: e.stack
      });
      
      if (e.message.includes('duplicate key') || e.message.includes('already registered')) {
        setError('This email is already registered');
      } else if (e.message.includes('Failed to create profile')) {
        setError('Failed to create user profile. Please try again.');
      } else if (e.message.includes('rate limit')) {
        setError('Too many attempts. Please try again later.');
      } else if (e.message.includes('invalid email')) {
        setError('Please enter a valid email address');
      } else if (e.message.includes('weak password')) {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError(e.message || 'An error occurred during sign up');
      }
    } finally {
      setLoading(false);
    }
  }

  const navigateToSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  return (
    <AnimatedAuthCard>
      <AnimatedLogo>
        <View style={styles.logoCircle}>
          <Layers color="#fff" size={24} />
        </View>
      </AnimatedLogo>

      <AnimatedFormToggle>
        <TouchableOpacity onPress={navigateToSignIn}>
          <Text style={styles.toggleButton}>Sign In</Text>
        </TouchableOpacity>
        <Text style={[styles.toggleButton, styles.activeToggle]}>Create Account</Text>
      </AnimatedFormToggle>

      <AnimatedTitle>Create Your Account</AnimatedTitle>
      <AnimatedSubtitle>Fill in your details to get started</AnimatedSubtitle>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <AnimatedForm>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#606060"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            <User color="#606060" size={20} style={styles.inputIcon} />
          </View>
        </View>

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
              placeholder="Choose a secure password"
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
          onPress={signUp}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
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