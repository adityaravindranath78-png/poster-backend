import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {useAuthStore} from '../store/authStore';

export async function sendOtp(phoneNumber: string): Promise<void> {
  const formatted = phoneNumber.startsWith('+')
    ? phoneNumber
    : `+91${phoneNumber}`;
  const confirmation = await auth().signInWithPhoneNumber(formatted);
  useAuthStore.getState().setConfirmationResult(confirmation);
}

export async function verifyOtp(code: string): Promise<void> {
  const confirmation = useAuthStore.getState().confirmationResult;
  if (!confirmation) {
    throw new Error('No OTP request in progress. Call sendOtp first.');
  }
  await confirmation.confirm(code);
  // onAuthStateChanged listener in App.tsx handles setting user
}

export async function signInWithGoogle(): Promise<void> {
  await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in failed: no ID token');
  }
  const credential = auth.GoogleAuthProvider.credential(idToken);
  await auth().signInWithCredential(credential);
}

export async function signOut(): Promise<void> {
  await useAuthStore.getState().signOut();
}

export function onAuthStateChanged(
  callback: (user: ReturnType<typeof auth>['currentUser']) => void,
) {
  return auth().onAuthStateChanged(callback);
}
