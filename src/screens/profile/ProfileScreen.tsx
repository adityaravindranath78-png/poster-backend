import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useUserStore} from '../../store/userStore';
import {updateProfile} from '../../services/user';
import {uploadProfilePhoto, uploadLogo} from '../../services/storage';
import {useAuthStore} from '../../store/authStore';

export default function ProfileScreen() {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const updateLocalProfile = useUserStore((s) => s.updateProfile);
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [businessName, setBusinessName] = useState(profile?.businessName || '');
  const [photoUri, setPhotoUri] = useState(profile?.photoUrl || '');
  const [logoUri, setLogoUri] = useState(profile?.logoUrl || '');
  const [saving, setSaving] = useState(false);

  async function pickImage(type: 'photo' | 'logo') {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
    });

    if (result.assets?.[0]?.uri) {
      if (type === 'photo') {
        setPhotoUri(result.assets[0].uri);
      } else {
        setLogoUri(result.assets[0].uri);
      }
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    setSaving(true);
    try {
      let photoUrl = profile?.photoUrl || '';
      let logoUrl = profile?.logoUrl || '';

      // Upload new photo if changed
      if (photoUri && photoUri !== profile?.photoUrl) {
        photoUrl = await uploadProfilePhoto(photoUri);
      }
      // Upload new logo if changed
      if (logoUri && logoUri !== profile?.logoUrl) {
        logoUrl = await uploadLogo(logoUri);
      }

      const updates = {
        name: name.trim(),
        phone: phone.trim(),
        businessName: businessName.trim(),
        photoUrl,
        logoUrl,
        language: profile?.language || 'hi',
      };

      await updateProfile(updates);

      if (profile) {
        updateLocalProfile(updates);
      } else {
        setProfile({
          userId: user?.uid || '',
          subscriptionStatus: 'free',
          ...updates,
        });
      }

      Alert.alert('Saved', 'Profile updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      {/* Profile Photo */}
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => pickImage('photo')}>
        {photoUri ? (
          <Image source={{uri: photoUri}} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.field}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="10-digit phone number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Business Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your business or brand name"
          placeholderTextColor="#999"
          value={businessName}
          onChangeText={setBusinessName}
        />
      </View>

      {/* Logo */}
      <View style={styles.field}>
        <Text style={styles.label}>Business Logo</Text>
        <TouchableOpacity
          style={styles.logoPicker}
          onPress={() => pickImage('logo')}>
          {logoUri ? (
            <Image source={{uri: logoUri}} style={styles.logoImage} />
          ) : (
            <Text style={styles.logoPlaceholderText}>+ Add Logo</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    padding: 24,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  logoPicker: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
  logoImage: {
    width: 76,
    height: 76,
    borderRadius: 10,
  },
  logoPlaceholderText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
