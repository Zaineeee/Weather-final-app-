import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MessageCircle, Phone, Mail, HelpCircle } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function CustomerService() {
  const contactOptions = [
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: MessageCircle,
      color: '#32d74b',
      onPress: () => {
        // Implement live chat functionality
        console.log('Live chat pressed');
      }
    },
    {
      title: 'Call Us',
      description: 'Speak with a representative',
      icon: Phone,
      color: '#0a84ff',
      onPress: () => {
        // Implement call functionality
        console.log('Call pressed');
      }
    },
    {
      title: 'Email Support',
      description: 'Send us an email',
      icon: Mail,
      color: '#ff9f0a',
      onPress: () => {
        // Implement email functionality
        console.log('Email pressed');
      }
    },
    {
      title: 'FAQs',
      description: 'Find answers to common questions',
      icon: HelpCircle,
      color: '#ff375f',
      onPress: () => {
        // Navigate to FAQs
        console.log('FAQs pressed');
      }
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Customer Service</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>How can we help you today?</Text>

        <View style={styles.optionsGrid}>
          {contactOptions.map((option, index) => (
            <AnimatedTouchableOpacity
              key={option.title}
              style={[styles.optionCard, { borderLeftColor: option.color }]}
              onPress={option.onPress}
              entering={FadeIn.delay(index * 100)}
            >
              <option.icon size={24} color={option.color} />
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </AnimatedTouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Support Hours</Text>
          <Text style={styles.infoText}>Monday - Friday: 9:00 AM - 6:00 PM</Text>
          <Text style={styles.infoText}>Saturday: 10:00 AM - 4:00 PM</Text>
          <Text style={styles.infoText}>Sunday: Closed</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  optionsGrid: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    gap: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 14,
    color: '#8e8e93',
  },
  infoSection: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 4,
  },
}); 