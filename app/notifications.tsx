import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Notifications() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.notification}>
          <Text style={styles.title}>Severe Weather Alert</Text>
          <Text style={styles.description}>Strong thunderstorms expected in your area</Text>
          <Text style={styles.time}>2 hours ago</Text>
        </View>
        
        <View style={styles.notification}>
          <Text style={styles.title}>Daily Forecast</Text>
          <Text style={styles.description}>Today will be partly cloudy with a high of 28°C</Text>
          <Text style={styles.time}>5 hours ago</Text>
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
  notification: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  title: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
});