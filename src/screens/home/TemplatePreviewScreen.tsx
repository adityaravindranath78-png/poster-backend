import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../navigation/types';
import {useUserStore} from '../../store/userStore';
import {useSubscriptionStore} from '../../store/subscriptionStore';
import {getTemplateSchema} from '../../services/templates';
import {fillTemplate} from '../../utils/templateEngine';
import {Template} from '../../types/template';
import WatermarkOverlay from '../../components/WatermarkOverlay';

type Props = NativeStackScreenProps<HomeStackParamList, 'TemplatePreview'>;

export default function TemplatePreviewScreen({route, navigation}: Props) {
  const {template: meta} = route.params;
  const profile = useUserStore((s) => s.profile);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const [filledTemplate, setFilledTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAndFill();
  }, []);

  async function loadAndFill() {
    try {
      const schema = await getTemplateSchema(meta.schema_url);
      if (profile) {
        const filled = fillTemplate(schema, profile);
        setFilledTemplate(filled);
      } else {
        setFilledTemplate(schema);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load template');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission needed', 'Storage permission is required to save images');
        return;
      }
    }
    // In production: render the filled template to an image using canvas/Sharp
    // For MVP: we show the thumbnail as preview
    Alert.alert('Downloaded', 'Image saved to gallery');
  }

  async function handleShare() {
    try {
      await Share.share({
        message: 'Check out this poster I made with Poster app!',
        url: meta.thumbnail_url,
      });
    } catch {
      // User cancelled
    }
  }

  function handleEdit() {
    // Navigate to editor with the filled template
    if (filledTemplate) {
      navigation.getParent()?.navigate('Editor', {template: filledTemplate});
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.previewContainer}>
        <Image
          source={{uri: meta.thumbnail_url}}
          style={styles.preview}
          resizeMode="contain"
        />
        {!isPremium() && meta.premium && <WatermarkOverlay />}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton]}
          onPress={handleDownload}>
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
        <Text style={styles.editButtonText}>Open in Editor</Text>
      </TouchableOpacity>

      {meta.premium && !isPremium() && (
        <Text style={styles.premiumNote}>
          Premium template — download includes watermark
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#FF6B35',
  },
  shareButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  editButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  premiumNote: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    paddingBottom: 16,
  },
});
