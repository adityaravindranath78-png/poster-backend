import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';

interface Props {
  color?: string;
}

export default function LoadingState({color = '#FF6B35'}: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});
