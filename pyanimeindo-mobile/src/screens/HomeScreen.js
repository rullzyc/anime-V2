import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator, TextInput,
  ScrollView, StatusBar, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchOngoing, searchAnime, proxyImg, fetchAnimeByGenre } from '../api/apiClient';

const GENRES = [
  { name: 'Semua', path: null },
  { name: 'Action', path: '/genres/action/' },
  { name: 'Adventure', path: '/genres/adventure/' },
  { name: 'Comedy', path: '/genres/comedy/' },
  { name: 'Drama', path: '/genres/drama/' },
  { name: 'Fantasy', path: '/genres/fantasy/' },
  { name: 'Horror', path: '/genres/horror/' },
  { name: 'Mystery', path: '/genres/mystery/' },
  { name: 'Romance', path: '/genres/romance/' },
  { name: 'Sci-Fi', path: '/genres/sci-fi/' }
];

export default function HomeScreen({ navigation }) {
  const [ongoing, setOngoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeGenre, setActiveGenre] = useState('Semua');
  const [searchMode, setSearchMode] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, [activeGenre]);

  const loadData = async () => {
    setLoading(true);
    let data;
    if (activeGenre === 'Semua') {
      data = await fetchOngoing(1);
    } else {
      const genreObj = GENRES.find(g => g.name === activeGenre);
      if (genreObj && genreObj.path) {
        data = await fetchAnimeByGenre(genreObj.path);
      } else {
        data = await fetchOngoing(1);
      }
    }
    setOngoing(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    let data;
    if (activeGenre === 'Semua') {
      data = await fetchOngoing(1);
    } else {
      const genreObj = GENRES.find(g => g.name === activeGenre);
      if (genreObj && genreObj.path) {
        data = await fetchAnimeByGenre(genreObj.path);
      } else {
        data = await fetchOngoing(1);
      }
    }
    setOngoing(Array.isArray(data) ? data : []);
    setRefreshing(false);
  }, []);

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }
    setSearchMode(true);
    setSearching(true);
    const results = await searchAnime(text);
    setSearchResults(Array.isArray(results) ? results : []);
    setSearching(false);
  };

  // API returns: { title, eps, img, hari, url }
  const renderAnimeCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Detail', { url: item.url, title: item.title })}
      activeOpacity={0.75}
    >
      <Image
        source={{ uri: proxyImg(item.img) }}
        style={styles.cardImage}
      />
      <View style={styles.episodeBadge}>
        <Text style={styles.episodeBadgeText} numberOfLines={1}>{item.eps || 'NEW'}</Text>
      </View>
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  // searchAnime returns: { title, img, url }
  const renderSearchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={() => {
        setSearchMode(false);
        setSearchQuery('');
        navigation.navigate('Detail', { url: item.url, title: item.title });
      }}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: proxyImg(item.img) }}
        style={styles.searchThumb}
      />
      <View style={styles.searchInfo}>
        <Text style={styles.searchTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.searchSub}>Anime</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <Text style={styles.headerLogo}>PyAnimeIndo</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari anime..."
            placeholderTextColor="#555"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchMode(false); }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Genre Chips */}
      {!searchMode && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.genreScroll}
          contentContainerStyle={styles.genreContainer}
        >
          {GENRES.map((g) => (
            <TouchableOpacity
              key={g.name}
              style={[styles.genreChip, activeGenre === g.name && styles.genreChipActive]}
              onPress={() => setActiveGenre(g.name)}
            >
              <Text style={[styles.genreText, activeGenre === g.name && styles.genreTextActive]}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      {searchMode ? (
        searching ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#F59E0B" />
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item, i) => (item.url || String(i))}
            renderItem={renderSearchItem}
            contentContainerStyle={styles.searchList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Tidak ada hasil untuk "{searchQuery}"</Text>
            }
          />
        )
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>
            {activeGenre === 'Semua' ? 'Update Terbaru' : `Anime ${activeGenre}`}
          </Text>
          <FlatList
            data={ongoing}
            keyExtractor={(item, i) => (item.url || String(i))}
            renderItem={renderAnimeCard}
            numColumns={3}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>Gagal memuat data. Tarik ke bawah untuk refresh.</Text>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },

  header: { paddingHorizontal: 14, paddingBottom: 10, backgroundColor: '#000' },
  headerLogo: { color: '#F59E0B', fontSize: 22, fontWeight: '900', letterSpacing: 0.5, marginBottom: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 10,
    paddingHorizontal: 12, height: 44,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 14 },
  clearBtn: { color: '#666', fontSize: 16, paddingLeft: 8 },

  genreScroll: { flexGrow: 0, marginTop: 5 },
  genreContainer: { paddingHorizontal: 14, paddingVertical: 5, flexDirection: 'row' },
  genreChip: {
    paddingHorizontal: 16, height: 32,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 16, backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: '#2D2D2D',
    marginRight: 8,
  },
  genreChipActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  genreText: { color: '#888', fontSize: 13, fontWeight: '600' },
  genreTextActive: { color: '#000', fontWeight: '700' },

  sectionTitle: {
    color: '#FFF', fontSize: 15, fontWeight: '700',
    paddingHorizontal: 14, paddingBottom: 8,
  },

  gridContainer: { paddingHorizontal: 10, paddingBottom: 20 },
  card: {
    flex: 1, margin: 3, borderRadius: 6,
    overflow: 'hidden', backgroundColor: '#1A1A1A', aspectRatio: 0.68,
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover', backgroundColor: '#1A1A1A' },
  episodeBadge: {
    position: 'absolute', top: 5, left: 5,
    backgroundColor: '#F59E0B', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
    maxWidth: '80%',
  },
  episodeBadgeText: { color: '#000', fontSize: 9, fontWeight: '800' },
  cardOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.78)', padding: 5,
  },
  cardTitle: { color: '#FFF', fontSize: 10, fontWeight: '600', lineHeight: 14 },

  searchList: { paddingHorizontal: 14, paddingTop: 8 },
  searchItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  searchThumb: {
    width: 60, height: 85, borderRadius: 6,
    resizeMode: 'cover', backgroundColor: '#1A1A1A',
  },
  searchInfo: { flex: 1, marginLeft: 12 },
  searchTitle: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  searchSub: { color: '#F59E0B', fontSize: 12 },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 40, fontSize: 14 },
});
