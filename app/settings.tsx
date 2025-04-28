import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Settings() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Units</Text>
          <View style={styles.option}>
            <Text style={styles.optionText}>Temperature</Text>
            <Text style={styles.optionValue}>Celsius</Text>
          </View>
          <View style={styles.option}>
            <Text style={styles.optionText}>Wind Speed</Text>
            <Text style={styles.optionValue}>km/h</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.option}>
            <Text style={styles.optionText}>Severe Weather</Text>
            <Text style={styles.optionValue}>On</Text>
          </View>
          <View style={styles.option}>
            <Text style={styles.optionText}>Daily Forecast</Text>
            <Text style={styles.optionValue}>Off</Text>
          </View>
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
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 15,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  optionValue: {
    color: '#0a84ff',
    fontSize: 16,
  },
});