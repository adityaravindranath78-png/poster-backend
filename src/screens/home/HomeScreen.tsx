import React, {useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../navigation/types';
import {useTemplateStore} from '../../store/templateStore';
import {getTemplates, getDailyTemplates} from '../../services/templates';
import {CATEGORIES} from '../../utils/constants';
import TemplateCard from '../../components/TemplateCard';
import ErrorState from '../../components/ErrorState';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeScreen'>;

export default function HomeScreen({navigation}: Props) {
  const {
    dailyTemplates,
    trendingTemplates,
    selectedLanguage,
    isLoading,
    error,
    setDailyTemplates,
    setTrendingTemplates,
    setLoading,
    setError,
  } = useTemplateStore();

  useEffect(() => {
    loadContent();
  }, [selectedLanguage]);

  async function loadContent() {
    setLoading(true);
    setError(null);
    try {
      const [daily, trending] = await Promise.all([
        getDailyTemplates(selectedLanguage),
        getTemplates({language: selectedLanguage, limit: 10}),
      ]);
      setDailyTemplates(daily.data);
      setTrendingTemplates(trending.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryPress(categoryId: string, categoryLabel: string) {
    navigation.navigate('Category', {categoryId, categoryLabel});
  }

  function handleTemplatePress(template: any) {
    navigation.navigate('TemplatePreview', {template});
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadContent} />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Categories Grid */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.categoriesGrid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(cat.id, cat.label)}>
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={styles.categoryLabel} numberOfLines={1}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Daily Templates */}
      {dailyTemplates.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Today's Specials</Text>
          <FlatList
            horizontal
            data={dailyTemplates}
            keyExtractor={(item) => item.id}
            renderItem={({item}) => (
              <TemplateCard
                template={item}
                onPress={() => handleTemplatePress(item)}
                style={styles.horizontalCard}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </>
      )}

      {/* Trending */}
      <Text style={styles.sectionTitle}>Trending</Text>
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color="#FF6B35"
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={trendingTemplates}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({item}) => (
            <TemplateCard
              template={item}
              onPress={() => handleTemplatePress(item)}
              style={styles.gridCard}
            />
          )}
          scrollEnabled={false}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridList}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
    fontWeight: '500',
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  horizontalCard: {
    width: 160,
    height: 160,
  },
  gridList: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  gridRow: {
    gap: 12,
    paddingHorizontal: 4,
  },
  gridCard: {
    flex: 1,
    aspectRatio: 1,
  },
  loader: {
    marginVertical: 40,
  },
});
