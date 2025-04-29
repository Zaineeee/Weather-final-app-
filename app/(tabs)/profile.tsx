import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert, Modal, ScrollView, ActivityIndicator, Platform, FlatList, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Camera, Edit2, Check, X, Moon, Bell, Clock, Settings, ChevronDown, Lock, Trash2, Volume2, Vibrate, Layout, HelpCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { trackApiCall } from '@/lib/api-logger';
import { decode as base64Decode } from 'base-64';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  theme: 'dark-gray' | 'black' | 'dark-blue';
  alerts_enabled: boolean;
  alert_frequency: number; // hours between alerts
  alert_time: string; // time of day for alerts
  notification_sound: boolean;
  notification_vibration: boolean;
  role: 'admin' | 'user';
}

interface UserMetadata {
  full_name?: string;
}

type Profile = {
  alerts_enabled: boolean;
  alert_frequency: number;
  // ... other profile fields
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

// Add type guard function at the top of the file
const isValidProfile = (profile: UserProfile | null): profile is UserProfile => {
  return profile !== null;
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching user data...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user:', userError);
        throw userError;
      }

      if (!user) {
        console.log('No user found, redirecting to sign-in');
        router.replace('/(auth)/sign-in');
        return;
      }

      console.log('User found:', { id: user.id, email: user.email });
      console.log('User metadata:', user.user_metadata);

      // First try to get existing profile
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // If there's an error other than "no rows found", throw it
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      // If no profile exists, create one
      if (!profileData) {
        console.log('No profile found, creating new profile...');
        const defaultProfile = {
          id: user.id,
          email: user.email || '',
          full_name: (user.user_metadata as { full_name?: string })?.full_name || '',
          theme: 'dark-gray' as const,
          avatar_url: null,
          alerts_enabled: false,
          alert_frequency: 0,
          alert_time: '09:00',
          notification_sound: true,
          notification_vibration: true,
          role: 'user'
        };

        console.log('Creating profile with data:', defaultProfile);

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert(defaultProfile)
          .select('*')
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }

        if (newProfile) {
          console.log('New profile created successfully:', newProfile);
          profileData = newProfile;
        }
      } else {
        console.log('Existing profile found:', profileData);
      }

      // Set the profile data
      if (profileData) {
        setProfile(profileData as UserProfile);
        setEditedName(profileData.full_name || '');
      } else {
        throw new Error('Failed to create or fetch profile');
      }
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      Alert.alert('Error', error.message || 'Error loading profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!profile) return;

    try {
      setIsLoading(true);
      console.log('Updating profile name to:', editedName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: editedName })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully');
      setProfile(prev => prev ? { ...prev, full_name: editedName } : null);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile name');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change profile picture.');
        return;
      }

      // Launch image picker with optimized options for Android
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: Platform.OS === 'android' ? 0.5 : 0.8,
        allowsMultipleSelection: false,
        base64: Platform.OS === 'android',
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsLoading(true);
        const selectedAsset = result.assets[0];

        // Get file extension from URI
        const fileExt = selectedAsset.uri.substring(selectedAsset.uri.lastIndexOf('.') + 1);
        
        if (!['jpg', 'jpeg', 'png'].includes(fileExt.toLowerCase())) {
          Alert.alert('Error', 'Only JPG and PNG images are allowed');
          return;
        }

        // Generate a unique file name
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        let fileData: Uint8Array;
        
        if (Platform.OS === 'android' && selectedAsset.base64) {
          // For Android, convert base64 to binary data
          const binaryString = base64Decode(selectedAsset.base64);
          fileData = Uint8Array.from(binaryString, c => c.charCodeAt(0));
        } else {
          // For iOS, fetch the image data as blob
          const response = await fetch(selectedAsset.uri);
          const blob = await response.blob();
          
          // Convert blob to ArrayBuffer then to Uint8Array
          const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result instanceof ArrayBuffer) {
                resolve(reader.result);
              } else {
                reject(new Error('Failed to read image as ArrayBuffer'));
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(blob);
          });
          
          fileData = new Uint8Array(arrayBuffer);
        }

        if (!fileData) {
          throw new Error('Failed to process image data');
        }

        // Check file size (limit to 10MB)
        if (fileData.byteLength > 10 * 1024 * 1024) {
          Alert.alert('Error', 'Image size must be less than 10MB');
          return;
        }

        // Delete old avatar if it exists
        if (profile?.avatar_url) {
          try {
            const oldFileName = profile.avatar_url.split('/').pop()?.split('?')[0];
            if (oldFileName) {
              await supabase.storage
                .from('avatars')
                .remove([oldFileName]);
            }
          } catch (error) {
            console.log('Error removing old avatar:', error);
            // Continue with upload even if delete fails
          }
        }

        // Upload new image with retry logic
        let uploadError = null;
        let retries = 3;
        let uploadedUrl = null;

        while (retries > 0 && !uploadedUrl) {
          try {
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('avatars')
              .upload(fileName, fileData, {
                contentType: `image/${fileExt.toLowerCase()}`,
                cacheControl: '3600',
                upsert: false
              });

            if (uploadErr) {
              uploadError = uploadErr;
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
              throw uploadErr;
            }

            if (uploadData?.path) {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(uploadData.path);

              // Update profile with new avatar URL
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', profile?.id);

              if (updateError) throw updateError;

              // Update local state with clean URL
              const cleanUrl = publicUrl.split('?')[0];
              setProfile(prev => prev ? { ...prev, avatar_url: cleanUrl } : null);
              uploadedUrl = cleanUrl;
            }
          } catch (error) {
            console.error('Upload attempt failed:', error);
            uploadError = error;
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        if (!uploadedUrl && uploadError) {
          throw uploadError;
        }

        console.log('Profile picture updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', error.message || 'Failed to update profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = async (theme: UserProfile['theme']) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, theme });
      setShowThemeModal(false);
    } catch (error) {
      console.error('Error updating theme:', error);
      Alert.alert('Error', 'Failed to update theme');
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await trackApiCall('/auth/sign-out', 'POST', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        router.replace('/(auth)/sign-in');
      });
    } catch (e: any) {
      console.error('Error signing out:', e.message);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getThemeColor = (theme: UserProfile['theme']) => {
    switch (theme) {
      case 'black': return '#000000';
      case 'dark-blue': return '#1a237e';
      default: return '#1c1c1e'; // dark-gray
    }
  };

  const updateAlertSettings = async (enabled: boolean) => {
    if (!isValidProfile(profile)) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ alerts_enabled: enabled })
        .eq('id', profile.id)
        .single();

      if (error) throw error;
      setProfile({ ...profile, alerts_enabled: enabled });
    } catch (error) {
      console.error('Error updating alert settings:', error);
    }
  };

  const updateAlertFrequency = async (frequency: number) => {
    if (!isValidProfile(profile)) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ alert_frequency: frequency })
        .eq('id', profile.id)
        .single();

      if (error) throw error;
      setProfile({ ...profile, alert_frequency: frequency });
      setShowAlertModal(false);
    } catch (error) {
      console.error('Error updating alert frequency:', error);
    }
  };

  const updateNotificationPreferences = async (setting: 'sound' | 'vibration', value: boolean) => {
    if (!profile) return;

    try {
      setIsLoading(true);
      const updateData = setting === 'sound' 
        ? { notification_sound: value }
        : { notification_vibration: value };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updateData } : null);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      Alert.alert('Error', 'Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAlertTime = async (time: string) => {
    if (!profile) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ alert_time: time })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, alert_time: time } : null);
      setShowTimeModal(false);

      // Show confirmation to user
      const timeStr = formatTimeDisplay(
        time.slice(0, 2),
        time.slice(3, 5),
        parseInt(time.slice(0, 2)) >= 12 ? 'PM' : 'AM'
      );
      Alert.alert(
        'Alert Time Updated',
        `Weather alerts will be sent at ${timeStr}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating alert time:', error);
      Alert.alert('Error', 'Failed to update alert time');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeDisplay = (hour: string, minute: string, period: string) => {
    const h = parseInt(hour);
    const displayHour = period === 'AM' ? 
      (h === 0 ? '12' : h.toString()) : 
      (h === 12 ? '12' : (h % 12).toString());
    return `${displayHour.padStart(2, '0')}:${minute} ${period}`;
  };

  const convertTo24Hour = (hour: string, period: string): string => {
    let h = parseInt(hour);
    if (period === 'AM') {
      return (h === 12 ? '00' : hour.padStart(2, '0'));
    } else {
      return (h === 12 ? '12' : (h + 12).toString()).padStart(2, '0');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setPasswordLoading(true);
      
      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Error', 'Current password is incorrect');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      Alert.alert('Success', 'Password updated successfully');
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Delete profile data first
              const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profile?.id);

              if (profileError) throw profileError;

              // Delete user account
              const { error: deleteError } = await supabase.auth.admin.deleteUser(
                profile?.id as string
              );

              if (deleteError) throw deleteError;

              // Sign out and redirect to sign-in
              await handleSignOut();
              router.replace('/(auth)/sign-in');
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Render the profile content
  const renderContent = () => (
    <ScrollView style={styles.content}>
      {/* Profile Picture Section */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity 
          onPress={pickImage} 
          style={styles.avatarButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.avatarPlaceholder}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : profile?.avatar_url ? (
            <>
              <Image 
                source={{ 
                  uri: profile.avatar_url.split('?')[0],
                  headers: {
                    Pragma: 'no-cache',
                    'Cache-Control': 'no-cache'
                  },
                }} 
                style={styles.avatar}
                onLoadStart={() => console.log('Starting to load image:', profile.avatar_url)}
                onLoadEnd={() => console.log('Finished loading image attempt')}
                onError={(error) => {
                  console.log('Error loading avatar image. URL:', profile.avatar_url);
                  console.log('Error details:', error.nativeEvent);
                  
                  // Try fetching the image directly to check accessibility
                  if (profile?.avatar_url) {
                    fetch(profile.avatar_url.split('?')[0])
                      .then(response => {
                        console.log('Image fetch response:', response.status, response.statusText);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return response.blob();
                      })
                      .then(() => console.log('Image is accessible via fetch'))
                      .catch(fetchError => console.log('Image fetch error:', fetchError));

                    // Add a single timestamp parameter
                    const baseUrl = profile.avatar_url.split('?')[0];
                    const newUrl = `${baseUrl}?t=${Date.now()}`;
                    console.log('Retrying with new URL:', newUrl);
                    setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null);
                  }
                }}
              />
            </>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Camera size={40} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.changePhotoText}>
          {isLoading ? 'Uploading...' : 'Tap to change photo'}
        </Text>
      </View>

      {/* Profile Info Section */}
      <AnimatedView 
        entering={FadeIn} 
        exiting={FadeOut}
        style={styles.infoSection}
      >
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profile?.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Name</Text>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.input}
                value={editedName}
                onChangeText={setEditedName}
                autoFocus
              />
              <TouchableOpacity onPress={updateProfile} style={styles.iconButton}>
                <Check size={20} color="#32d74b" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.iconButton}>
                <X size={20} color="#ff453a" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editContainer}>
              <Text style={styles.value}>{profile?.full_name}</Text>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconButton}>
                <Edit2 size={20} color="#0a84ff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </AnimatedView>

      {/* Theme Selection */}
      <TouchableOpacity 
        style={styles.mainButton}
        onPress={() => setShowThemeModal(true)}
      >
        <View style={styles.mainButtonContent}>
          <Moon size={24} color="#fff" />
          <Text style={styles.mainButtonText}>Change Theme</Text>
        </View>
      </TouchableOpacity>

      {/* Alert Settings Section */}
      {isValidProfile(profile) && (
        <>
          <View style={styles.mainButton}>
            <View style={styles.mainButtonContent}>
              <Bell size={24} color="#fff" />
              <Text style={styles.mainButtonText}>Weather Alerts</Text>
            </View>
            <Switch
              value={profile.alerts_enabled}
              onValueChange={updateAlertSettings}
              trackColor={{ false: '#3a3a3c', true: '#2196F3' }}
              thumbColor={profile.alerts_enabled ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#3a3a3c"
            />
          </View>

          {profile.alerts_enabled && (
            <View style={styles.settingsGroup}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setShowAlertModal(true)}
              >
                <View style={styles.settingLabelContainer}>
                  <Clock size={20} color="#fff" />
                  <Text style={styles.settingLabel}>Alert Frequency</Text>
                </View>
                <View style={styles.settingValue}>
                  <Text style={styles.settingValueText}>
                    {profile.alert_frequency === 0 ? 'Not set' : `Every ${profile.alert_frequency} hours`}
                  </Text>
                  <ChevronDown size={20} color="#8e8e93" />
                </View>
              </TouchableOpacity>

              <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                  <Volume2 size={20} color="#fff" />
                  <Text style={styles.settingLabel}>Sound Notifications</Text>
                </View>
                <Switch
                  value={profile.notification_sound}
                  onValueChange={(value) => updateNotificationPreferences('sound', value)}
                  trackColor={{ false: '#3a3a3c', true: '#2196F3' }}
                  thumbColor={profile.notification_sound ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="#3a3a3c"
                />
              </View>

              <View style={[styles.settingRow, styles.lastSettingRow]}>
                <View style={styles.settingLabelContainer}>
                  <Vibrate size={20} color="#fff" />
                  <Text style={styles.settingLabel}>Vibration</Text>
                </View>
                <Switch
                  value={profile.notification_vibration}
                  onValueChange={(value) => updateNotificationPreferences('vibration', value)}
                  trackColor={{ false: '#3a3a3c', true: '#2196F3' }}
                  thumbColor={profile.notification_vibration ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="#3a3a3c"
                />
              </View>
            </View>
          )}

          {/* Settings Section */}
          <TouchableOpacity 
            style={styles.mainButton}
            onPress={() => setShowSettingsDropdown(!showSettingsDropdown)}
          >
            <View style={styles.mainButtonContent}>
              <Settings size={24} color="#fff" />
              <Text style={styles.mainButtonText}>Settings</Text>
            </View>
            <ChevronDown 
              size={20} 
              color="#8e8e93"
              style={[
                styles.chevron,
                showSettingsDropdown && styles.chevronUp
              ]}
            />
          </TouchableOpacity>

          {showSettingsDropdown && (
            <View style={styles.settingsGroup}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => {
                  setShowSettingsDropdown(false);
                  setShowChangePasswordModal(true);
                }}
              >
                <View style={styles.settingLabelContainer}>
                  <Lock size={20} color="#fff" />
                  <Text style={styles.settingLabel}>Change Password</Text>
                </View>
                <ChevronDown size={20} color="#8e8e93" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingRow, styles.lastSettingRow]}
                onPress={() => {
                  setShowSettingsDropdown(false);
                  handleDeleteAccount();
                }}
              >
                <View style={styles.settingLabelContainer}>
                  <Trash2 size={20} color="#ff453a" />
                  <Text style={[styles.settingLabel, { color: '#ff453a' }]}>Delete Account</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Dashboard Button - Only show for admin users */}
          {profile?.role === 'admin' && (
            <AnimatedTouchableOpacity 
              style={styles.mainButton}
              onPress={() => router.push('/dashboard')}
              entering={FadeIn.delay(300)}
              exiting={FadeOut}
            >
              <View style={styles.mainButtonContent}>
                <Layout size={24} color="#fff" />
                <Text style={styles.mainButtonText}>Dashboard</Text>
              </View>
            </AnimatedTouchableOpacity>
          )}

          {/* Customer Service Button */}
          <AnimatedTouchableOpacity 
            style={styles.mainButton}
            onPress={() => router.push('/customer-service')}
            entering={FadeIn.delay(350)}
            exiting={FadeOut}
          >
            <View style={styles.mainButtonContent}>
              <HelpCircle size={24} color="#fff" />
              <Text style={styles.mainButtonText}>Customer Service</Text>
            </View>
          </AnimatedTouchableOpacity>

          {/* Logout Button */}
          <AnimatedTouchableOpacity 
            style={[styles.mainButton, styles.logoutButton]}
            onPress={handleSignOut}
            disabled={isLoading}
            entering={FadeIn.delay(400)}
            exiting={FadeOut}
          >
            <View style={styles.mainButtonContent}>
              <LogOut size={24} color="#ff453a" />
              <Text style={[styles.mainButtonText, styles.logoutText]}>Log Out</Text>
            </View>
            {isLoading && <ActivityIndicator color="#ff453a" />}
          </AnimatedTouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  const AlertFrequencyModal = () => (
    <Modal
      visible={showAlertModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAlertModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Alert Frequency</Text>
          
          {[1, 3, 6, 12, 24].map((hours) => (
            <TouchableOpacity
              key={hours}
              style={[
                styles.frequencyOption,
                profile?.alert_frequency === hours && styles.selectedFrequency
              ]}
              onPress={() => updateAlertFrequency(hours)}
            >
              <Text style={styles.frequencyOptionText}>
                {hours === 1 ? 'Every hour' : `Every ${hours} hours`}
              </Text>
              {profile?.alert_frequency === hours && (
                <Check size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAlertModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const TimeSelectionModal = () => {
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
      <Modal
        visible={showTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Alert Time</Text>
            
            <View style={styles.timePickerContainer}>
              {/* Hours */}
              <View style={styles.timePickerColumn}>
                <FlatList
                  data={hours}
                  keyExtractor={(item) => `hour-${item}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.timeOption,
                        selectedHour === item && styles.selectedTimeOption
                      ]}
                      onPress={() => setSelectedHour(item)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedHour === item && styles.selectedTimeOptionText
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={5}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                />
              </View>
              
              <Text style={styles.timeSeparator}>:</Text>
              
              {/* Minutes */}
              <View style={styles.timePickerColumn}>
                <FlatList
                  data={minutes}
                  keyExtractor={(item) => `minute-${item}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.timeOption,
                        selectedMinute === item && styles.selectedTimeOption
                      ]}
                      onPress={() => setSelectedMinute(item)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedMinute === item && styles.selectedTimeOptionText
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={10}
                  maxToRenderPerBatch={20}
                  windowSize={5}
                />
              </View>

              {/* AM/PM */}
              <View style={[styles.timePickerColumn, styles.periodColumn]}>
                {['AM', 'PM'].map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodOption,
                      selectedPeriod === period && styles.selectedTimeOption
                    ]}
                    onPress={() => setSelectedPeriod(period)}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      selectedPeriod === period && styles.selectedTimeOptionText
                    ]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                const hour24 = convertTo24Hour(selectedHour, selectedPeriod);
                updateAlertTime(`${hour24}:${selectedMinute}:00`);
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTimeModal(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const ChangePasswordModal = () => (
    <Modal
      visible={showChangePasswordModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowChangePasswordModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>Change Password</Text>
          </View>

          <View style={[styles.modalContent, styles.passwordModalContent]}>
            <View style={styles.inputGroup}>
              <View style={styles.passwordInputContainer}>
                <Text style={styles.passwordLabel}>Current Password</Text>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#8e8e93"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.passwordDivider} />

              <View style={styles.passwordInputContainer}>
                <Text style={styles.passwordLabel}>New Password</Text>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#8e8e93"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.passwordDivider} />

              <View style={styles.passwordInputContainer}>
                <Text style={styles.passwordLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#8e8e93"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.confirmButton,
                  (!currentPassword || !newPassword || !confirmPassword) && styles.buttonDisabled,
                  passwordLoading && styles.buttonDisabled
                ]}
                onPress={handleChangePassword}
                disabled={!currentPassword || !newPassword || !confirmPassword || passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: profile?.theme ? getThemeColor(profile.theme) : '#1c1c1e' }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0073e6" />
        </View>
      ) : (
        <>
          {renderContent()}
          <AlertFrequencyModal />
          <TimeSelectionModal />
          <ChangePasswordModal />
        </>
      )}

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Theme</Text>
            {(['dark-gray', 'black', 'dark-blue'] as const).map((theme) => (
              <TouchableOpacity
                key={theme}
                style={[
                  styles.themeOption,
                  { backgroundColor: getThemeColor(theme) },
                  profile?.theme === theme && styles.selectedTheme
                ]}
                onPress={() => updateTheme(theme)}
              >
                <Text style={styles.themeOptionText}>
                  {theme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Text>
                {profile?.theme === theme && (
                  <Check size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Selection Modal */}
      <TimeSelectionModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: -75,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#2c2c2e',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#0a84ff',
    fontSize: 14,
    marginTop: 8,
  },
  infoSection: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    color: '#8e8e93',
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    color: '#fff',
    fontSize: 16,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0a84ff',
    paddingVertical: 4,
  },
  passwordInput: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 17,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  iconButton: {
    padding: 4,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2c2c2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  mainButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  logoutButton: {
    marginBottom: 32,
  },
  logoutText: {
    color: '#ff453a',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#2c2c2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  passwordModalContent: {
    padding: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedTheme: {
    borderWidth: 2,
    borderColor: '#0a84ff',
  },
  themeOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#3a3a3c',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  frequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3c',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  frequencyButtonText: {
    color: '#0a84ff',
    fontSize: 14,
    fontWeight: '500',
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3a3a3c',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedFrequency: {
    borderColor: '#0a84ff',
    borderWidth: 2,
  },
  frequencyOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3c',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  timeButtonText: {
    color: '#0a84ff',
    fontSize: 14,
    fontWeight: '500',
  },
  notificationPreferences: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3c',
  },
  preferencesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferenceText: {
    color: '#fff',
    fontSize: 16,
  },
  preferenceToggle: {
    width: 51,
    height: 31,
    backgroundColor: '#3a3a3c',
    borderRadius: 16,
    padding: 2,
  },
  preferenceToggleActive: {
    backgroundColor: '#32d74b',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 20,
    gap: 10,
  },
  timePickerColumn: {
    width: 60,
    height: 200,
  },
  periodColumn: {
    height: 100,
    justifyContent: 'space-around',
  },
  periodOption: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#3a3a3c',
  },
  timeSeparator: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginHorizontal: 10,
  },
  timeOption: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedTimeOption: {
    backgroundColor: '#0a84ff',
  },
  timeOptionText: {
    color: '#fff',
    fontSize: 18,
  },
  selectedTimeOptionText: {
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0a84ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  customerServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  customerServiceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
  },
  settingsDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
  },
  settingsOptionText: {
    color: '#fff',
    marginLeft: 12,
    fontSize: 16,
  },
  deleteOption: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    alignItems: 'center',
  },
  modalHeaderText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 24,
  },
  passwordInputContainer: {
    marginBottom: 20,
  },
  passwordLabel: {
    color: '#8e8e93',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  passwordDivider: {
    height: 1,
    backgroundColor: '#2c2c2e',
    marginVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#2c2c2e',
  },
  confirmButton: {
    backgroundColor: '#0a84ff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  section: {
    marginVertical: 8,
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3c',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 17,
    color: '#fff',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValueText: {
    fontSize: 17,
    color: '#8e8e93',
  },
  alertOptionsContainer: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  alertOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3c',
  },
  mainSettingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2c2c2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  mainSettingText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
  settingsGroup: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  lastSettingRow: {
    borderBottomWidth: 0,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
}); 