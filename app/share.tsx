import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share as ShareIcon, Twitter, Facebook } from 'lucide-react-native';

export default function Share() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Share Weather</Text>
        
        <TouchableOpacity style={styles.shareButton}>
          <ShareIcon color="#fff" size={24} />
          <Text style={styles.shareText}>Share Screenshot</Text>
        </TouchableOpacity>

        <View style={styles.socialButtons}>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#1DA1F2' }]}>
            <Twitter color="#fff" size={24} />
            <Text style={styles.socialText}>Twitter</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#4267B2' }]}>
            <Facebook color="#fff" size={24} />
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
        </View>
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
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  shareText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
    justifyContent: 'center',
  },
  socialText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
});