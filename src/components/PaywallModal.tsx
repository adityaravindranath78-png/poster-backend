import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PaywallModal({visible, onClose}: Props) {
  const navigation = useNavigation<any>();

  function handleUpgrade() {
    onClose();
    navigation.navigate('Profile', {screen: 'Subscription'});
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Premium Template</Text>
          <Text style={styles.subtitle}>
            Upgrade to Premium to download without watermark and access all
            templates.
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>Just ₹99/month</Text>
          </View>

          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeText}>View Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Download with Watermark</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 22,
  },
  priceRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF6B35',
  },
  upgradeButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
});
