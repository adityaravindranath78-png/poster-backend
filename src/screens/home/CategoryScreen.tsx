import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../navigation/types';
import {useTemplateStore} from '../../store/templateStore';
import {getTemplates} from '../../services/templates';
import {TemplateMeta} from '../../types/template';
import TemplateCard from '../../components/TemplateCard';
import ErrorState from '../../components/ErrorState';

type Props = NativeStackScreenProps<HomeStackParamList, 'Category'>;

export default function CategoryScreen({route, navigation}: Props) {
  const {categoryId} = route.params;
  const selectedLanguage = useTemplateStore((s) => s.selectedLanguage);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [nextKey, setNextKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTemplates({
        category: categoryId,
        language: selectedLanguage,
        limit: 20,
      });
      setTemplates(res.data);
      setNextKey(res.nextKey);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [categoryId, selectedLanguage]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  async function loadMore() {
    if (!nextKey || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const res = await getTemplates({
        category: categoryId,
        language: selectedLanguage,
        limit: 20,
        nextKey,
      });
      setTemplates((prev) => [...prev, ...res.data]);
      setNextKey(res.nextKey);
    } catch {
      // Silently fail on load more
    } finally {
      setLoadingMore(false);
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadTemplates} />;
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#FF6B35"
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({item}) => (
            <TemplateCard
              template={item}
              onPress={() => navigation.navigate('TemplatePreview', {template: item})}
              style={styles.card}
            />
          )}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color="#FF6B35"
                style={styles.footerLoader}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  list: {
    padding: 12,
    paddingBottom: 24,
  },
  row: {
    gap: 12,
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    marginBottom: 12,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
  },
});
