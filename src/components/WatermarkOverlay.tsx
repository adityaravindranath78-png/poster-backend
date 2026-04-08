import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function WatermarkOverlay() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Poster</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 48,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.25)',
    transform: [{rotate: '-30deg'}],
    letterSpacing: 8,
  },
});
