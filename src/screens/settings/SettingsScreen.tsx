import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {useAuthStore} from '../../store/authStore';
import {useUserStore} from '../../store/userStore';
import {useTemplateStore} from '../../store/templateStore';
import {LANGUAGES} from '../../utils/constants';

export default function SettingsScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const clearProfile = useUserStore((s) => s.clearProfile);
  const {selectedLanguage, setSelectedLanguage} = useTemplateStore();

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          clearProfile();
          await signOut();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Content Language</Text>
      <View style={styles.languageGrid}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.id}
            style={[
              styles.languageChip,
              selectedLanguage === lang.id && styles.languageChipActive,
            ]}
            onPress={() => setSelectedLanguage(lang.id)}>
            <Text
              style={[
                styles.languageChipText,
                selectedLanguage === lang.id && styles.languageChipTextActive,
              ]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Contact Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Rate Us</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Poster v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  languageChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  languageChipText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  languageChipTextActive: {
    color: '#FFF',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowText: {
    fontSize: 16,
    color: '#333',
  },
  signOutButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4444',
  },
  version: {
    textAlign: 'center',
    color: '#CCC',
    fontSize: 13,
    marginTop: 24,
    marginBottom: 40,
  },
});
