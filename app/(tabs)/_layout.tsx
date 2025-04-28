import { Tabs } from 'expo-router';
import { Cloud, CloudRain, Map, Sun, Moon, User } from 'lucide-react-native';
import { Platform } from 'react-native';

interface TabBarIconProps {
  color: string;
  size: number;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1c1c1e',
        },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#1c1c1e',
          borderTopColor: '#2c2c2e',
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#8e8e93',
        ...(Platform.OS === 'web' && {
          tabBarShowLabel: true,
          tabBarLabelPosition: 'below-icon',
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: '/',
          title: 'Weather Sphere',
          tabBarIcon: ({ color, size }: TabBarIconProps) => <Cloud size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          href: '/forecast',
          title: 'Forecast',
          tabBarIcon: ({ color, size }: TabBarIconProps) => <Sun size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="precipitation"
        options={{
          href: '/precipitation',
          title: 'Rain',
          tabBarIcon: ({ color, size }: TabBarIconProps) => <CloudRain size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="radar"
        options={{
          href: '/radar',
          title: 'Radar',
          tabBarIcon: ({ color, size }: TabBarIconProps) => <Map size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sun-and-moon"
        options={{
          href: '/sun-and-moon',
          title: 'Sun & Moon',
          tabBarIcon: ({ color, size }: TabBarIconProps) => <Moon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: '/profile',
          title: 'Profile',
          tabBarIcon: ({ color, size }: TabBarIconProps) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}