import React, {useEffect} from 'react';
import {StatusBar, View, Text, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import RootNavigator from './src/navigation/RootNavigator';
import {useAuthStore} from './src/store/authStore';

GoogleSignin.configure({
  webClientId: '1023925943500-2h3mfnk3ds4jg22vforn5tvjjlbe5c9c.apps.googleusercontent.com',
});

function App() {
  const {setUser, isLoading} = useAuthStore();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user?.uid || 'no user');
      setUser(user);
      if (user) {
        const token = await user.getIdToken();
        useAuthStore.getState().setToken(token);
      }
    });
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Poster</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FF6B35',
  },
});

export default App;
