import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL } from '../utils/env';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>School Management SaaS</Text>
      <Text style={styles.subtitle}>Mobile client</Text>
      <Text style={styles.meta}>API: {API_BASE_URL}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#475569',
  },
  meta: {
    marginTop: 24,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
