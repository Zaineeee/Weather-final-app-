import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingItem {
  id: string;
  title: string;
  type: 'toggle' | 'link';
  value?: boolean;
  icon: string;
}

export const Profile = () => {
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      id: 'notifications',
      title: 'Push Notifications',
      type: 'toggle',
      value: true,
      icon: 'notifications-outline',
    },
    {
      id: 'location',
      title: 'Location Services',
      type: 'toggle',
      value: true,
      icon: 'location-outline',
    },
    {
      id: 'account',
      title: 'Account Settings',
      type: 'link',
      icon: 'person-outline',
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      type: 'link',
      icon: 'shield-outline',
    },
    {
      id: 'help',
      title: 'Help & Support',
      type: 'link',
      icon: 'help-circle-outline',
    },
  ]);

  const handleToggle = (id: string) => {
    setSettings(settings.map(item =>
      item.id === id ? { ...item, value: !item.value } : item
    ));
  };

  const handlePress = (id: string) => {
    // Handle navigation or actions for link type settings
    console.log(`Pressed ${id}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#fff" />
        </View>
        <Text style={styles.name}>Kent Mervin Inot</Text>
        <Text style={styles.email}>kentmervin09@example.com</Text>
      </View>

      <View style={styles.settingsContainer}>
        {settings.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.settingItem}
            onPress={() => item.type === 'link' && handlePress(item.id)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name={item.icon as any} size={24} color="#fff" />
              <Text style={styles.settingTitle}>{item.title}</Text>
            </View>
            {item.type === 'toggle' ? (
              <Switch
                value={item.value}
                onValueChange={() => handleToggle(item.id)}
                trackColor={{ false: '#2c2c2e', true: '#81b0ff' }}
                thumbColor={item.value ? '#2196F3' : '#8e8e93'}
              />
            ) : (
              <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1c1c1e',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  avatarContainer: {
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  email: {
    fontSize: 16,
    color: '#8e8e93',
  },
  settingsContainer: {
    backgroundColor: '#1c1c1e',
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2c2c2e',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    marginLeft: 15,
    color: '#fff',
  },
}); 