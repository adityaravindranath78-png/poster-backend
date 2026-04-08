import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../../navigation/types';
import {sendOtp, signInWithGoogle} from '../../services/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSendOtp() {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(cleaned);
      navigation.navigate('OtpVerify', {phoneNumber: cleaned});
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Error', error.message || 'Google sign-in failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>Poster</Text>
        <Text style={styles.subtitle}>
          Create stunning posters & status in seconds
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>+91</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="Enter your phone number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.otpButton]}
          onPress={handleSendOtp}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignIn}
          disabled={googleLoading}>
          {googleLoading ? (
            <ActivityIndicator color="#333" />
          ) : (
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FF6B35',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  countryCode: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpButton: {
    backgroundColor: '#FF6B35',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
});
