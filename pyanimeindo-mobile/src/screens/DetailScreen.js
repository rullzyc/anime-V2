import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  ActivityIndicator, TouchableOpacity, StatusBar
} from 'react-native';
import { fetchEpisodes, proxyImg } from '../api/apiClient';

export default function DetailScreen({ route, navigation }) {
  const { url, title } = route.params;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [expandSynopsis, setExpandSynopsis] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: '' });
    loadData();
  }, [url]);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchEpisodes(url);
    setDetail(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Gagal memuat data anime.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // API returns: { title, cover, sinopsis, info, episodes: [{title, url, date}], recommend: [{title, url, cover}] }
  const episodes = Array.isArray(detail.episodes) ? detail.episodes : [];
  const infoLines = typeof detail.info === 'string'
    ? detail.info.split('\n').filter(Boolean)
    : [];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Cover + Overlay Info */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: proxyImg(detail.cover) }}
            style={styles.coverBg}
            blurRadius={8}
          />
          <View style={styles.coverDimmer} />
          <View style={styles.coverContent}>
            <Image
              source={{ uri: proxyImg(detail.cover) }}
              style={styles.poster}
            />
            <View style={styles.coverInfo}>
              <Text style={styles.animeTitle}>{detail.title}</Text>
              <View style={styles.episodeCountBadge}>
                <Text style={styles.episodeCountText}>{episodes.length} Episode</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.watchBtn}
            onPress={() => {
              if (episodes.length > 0) {
                const firstEp = episodes[episodes.length - 1]; // Episode 1 ada di akhir list
                navigation.navigate('Watch', { 
                  episodeUrl: firstEp.url, 
                  title: firstEp.title,
                  animeTitle: detail.title,
                  episodes: episodes 
                });
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.watchBtnText}>▶  Mulai Tonton</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnActive]}
            onPress={() => setSaved(!saved)}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnText, saved && styles.saveBtnTextActive]}>
              {saved ? '✓' : '+'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Synopsis */}
        {detail.sinopsis ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sinopsis</Text>
            <Text style={styles.synopsis} numberOfLines={expandSynopsis ? undefined : 4}>
              {detail.sinopsis}
            </Text>
            <TouchableOpacity onPress={() => setExpandSynopsis(!expandSynopsis)}>
              <Text style={styles.expandBtn}>{expandSynopsis ? 'Sembunyikan ▲' : 'Selengkapnya ▼'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Info */}
        {infoLines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi</Text>
            {infoLines.map((line, i) => {
              const parts = line.split(':');
              const key = parts[0]?.trim() || '';
              const val = parts.slice(1).join(':').trim();
              return (
                <View key={i} style={styles.infoRow}>
                  <Text style={styles.infoKey}>{key}</Text>
                  <Text style={styles.infoVal}>{val || line}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Episode List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daftar Episode ({episodes.length})</Text>
          {episodes.length === 0 ? (
            <Text style={styles.emptyText}>Tidak ada episode.</Text>
          ) : (
            episodes.map((ep, i) => (
              <TouchableOpacity
                key={i}
                style={styles.episodeRow}
                onPress={() => navigation.navigate('Watch', { 
                  episodeUrl: ep.url, 
                  title: ep.title,
                  animeTitle: detail.title,
                  episodes: episodes
                })}
                activeOpacity={0.7}
              >
                <View style={styles.epPlay}>
                  <Text style={styles.epPlayIcon}>▶</Text>
                </View>
                <View style={styles.epInfo}>
                  <Text style={styles.epTitle} numberOfLines={1}>{ep.title}</Text>
                  {ep.date ? <Text style={styles.epDate}>{ep.date}</Text> : null}
                </View>
                <Text style={styles.epArrow}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#EF4444', fontSize: 14, marginBottom: 12 },
  retryBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#000', fontWeight: '700' },

  // Cover
  coverContainer: { height: 230, position: 'relative' },
  coverBg: { position: 'absolute', width: '100%', height: '100%', resizeMode: 'cover' },
  coverDimmer: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.65)' },
  coverContent: {
    position: 'absolute', bottom: 14, left: 14, right: 14,
    flexDirection: 'row', alignItems: 'flex-end',
  },
  poster: {
    width: 95, height: 135, borderRadius: 8,
    resizeMode: 'cover', backgroundColor: '#111',
    borderWidth: 1, borderColor: '#333',
  },
  coverInfo: { flex: 1, marginLeft: 12, paddingBottom: 4 },
  animeTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 10 },
  episodeCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderWidth: 1, borderColor: '#F59E0B',
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
  },
  episodeCountText: { color: '#F59E0B', fontSize: 11, fontWeight: '700' },

  // Actions
  actionRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  watchBtn: {
    flex: 1, backgroundColor: '#F59E0B',
    paddingVertical: 13, borderRadius: 8, alignItems: 'center',
  },
  watchBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  saveBtn: {
    width: 48, paddingVertical: 13, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#333', alignItems: 'center',
  },
  saveBtnActive: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)' },
  saveBtnText: { color: '#555', fontWeight: '700', fontSize: 18 },
  saveBtnTextActive: { color: '#F59E0B' },

  // Sections
  section: { paddingHorizontal: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#111' },
  sectionTitle: { color: '#F59E0B', fontSize: 14, fontWeight: '700', marginBottom: 10, letterSpacing: 0.3 },

  // Synopsis
  synopsis: { color: '#AAA', fontSize: 13, lineHeight: 22 },
  expandBtn: { color: '#F59E0B', fontSize: 12, marginTop: 8, fontWeight: '600' },

  // Info
  infoRow: {
    flexDirection: 'row', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  infoKey: { color: '#555', fontSize: 12, width: 100 },
  infoVal: { color: '#CCC', fontSize: 12, flex: 1 },

  // Episodes
  episodeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111',
  },
  epPlay: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1A1A1A', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  epPlayIcon: { color: '#F59E0B', fontSize: 11 },
  epInfo: { flex: 1 },
  epTitle: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  epDate: { color: '#555', fontSize: 11, marginTop: 3 },
  epArrow: { color: '#444', fontSize: 22, marginLeft: 8 },
  emptyText: { color: '#555', fontSize: 13 },
});
