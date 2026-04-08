import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../../navigation/types';
import {verifyOtp, sendOtp} from '../../services/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

export default function OtpVerifyScreen({route}: Props) {
  const {phoneNumber} = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  function handleChange(text: string, index: number) {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every((d) => d.length === 1)) {
      handleVerify(newOtp.join(''));
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(code?: string) {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(otpCode);
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await sendOtp(phoneNumber);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to +91 {phoneNumber}
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({nativeEvent}) =>
              handleKeyPress(nativeEvent.key, index)
            }
            autoFocus={index === 0}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.verifyButton}
        onPress={() => handleVerify()}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.verifyText}>Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResend}
        disabled={resending}>
        <Text style={styles.resendText}>
          {resending ? 'Sending...' : "Didn't receive? Resend OTP"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  otpInputFilled: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F0',
  },
  verifyButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  resendButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});
