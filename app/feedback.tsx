import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Feedback() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Your Feedback</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={6}
          placeholder="Tell us what you think..."
          placeholderTextColor="#666"
        />
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Submit Feedback</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#0a84ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});