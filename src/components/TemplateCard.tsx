import React from 'react';
import {
  TouchableOpacity,
  Image,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {TemplateMeta} from '../types/template';

interface Props {
  template: TemplateMeta;
  onPress: () => void;
  style?: ViewStyle;
}

export default function TemplateCard({template, onPress, style}: Props) {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Image
        source={{uri: template.thumbnail_url}}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      {template.premium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>PRO</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#333',
  },
});
