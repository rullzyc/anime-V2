import React, { useEffect, useState } from 'react';
import { 
  View, StyleSheet, ActivityIndicator, Text, ScrollView, 
  TouchableOpacity, Dimensions, StatusBar, Image
} from 'react-native';
import { WebView } from 'react-native-webview';
import { fetchStreamsByResolution } from '../api/apiClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width } = Dimensions.get('window');
// 16:9 Aspect Ratio for video player
const VIDEO_HEIGHT = width * (9 / 16);

export default function WatchScreen({ route, navigation }) {
  const { episodeUrl, title, animeTitle, episodes } = route.params;
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRes, setActiveRes] = useState('720p');
  const [availableStreams, setAvailableStreams] = useState({});
  const insets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({ title: animeTitle || 'Nonton Anime' });
    loadStream(episodeUrl);

    // Allow screen rotation on this screen
    ScreenOrientation.unlockAsync();

    // Lock back to portrait when leaving
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [episodeUrl]);

  const loadStream = async (url) => {
    setLoading(true);
    setStreamUrl(null);
    const data = await fetchStreamsByResolution(url);
    if (data) {
      setAvailableStreams(data);
      // Determine default resolution (prefer 720p)
      const resKeys = Object.keys(data);
      const preferred = ['720p', '480p', '360p'].find(r => resKeys.includes(r)) || resKeys[0];
      
      if (preferred && data[preferred]) {
        setActiveRes(preferred);
        // Prefer 'ondesu' or 'ondesuhd' or 'vidhide' servers if available, else pick first
        const servers = data[preferred];
        const serverUrl = servers['ondesuhd'] || servers['ondesu'] || servers['vidhide'] || Object.values(servers)[0];
        setStreamUrl(serverUrl);
      }
    }
    setLoading(false);
  };

  const handleResChange = (res) => {
    setActiveRes(res);
    const servers = availableStreams[res];
    if (servers) {
      const serverUrl = servers['ondesuhd'] || servers['ondesu'] || servers['vidhide'] || Object.values(servers)[0];
      setStreamUrl(serverUrl);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      
      {/* Video Player Section */}
      <View style={[styles.playerContainer, { height: VIDEO_HEIGHT, marginTop: insets.top }]}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Memuat Video...</Text>
          </View>
        ) : streamUrl ? (
          <WebView
            source={{ uri: streamUrl }}
            style={styles.webview}
            allowsFullscreenVideo={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            backgroundColor="#000"
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.errorText}>Video tidak tersedia</Text>
          </View>
        )}
      </View>

      {/* Resolution Selector overlay (Mockup Wibuku Style) */}
      <View style={styles.resSelectorRow}>
        {Object.keys(availableStreams).sort().reverse().map(res => (
          <TouchableOpacity 
            key={res} 
            style={[styles.resBtn, activeRes === res && styles.resBtnActive]}
            onPress={() => handleResChange(res)}
          >
            <Text style={[styles.resBtnText, activeRes === res && styles.resBtnTextActive]}>{res}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.authorRow}>
            <Image 
              source={require('../assets/placeholder.png')} 
              style={styles.avatar} 
            />
            <View style={styles.authorInfo}>
              <Text style={styles.animeTitle}>{animeTitle}</Text>
              <Text style={styles.episodeSubTitle}>{title}</Text>
              <Text style={styles.statsText}>👁 16K tayangan • 2 hari yang lalu</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionScroll}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>👍</Text>
              <Text style={styles.actionText}>677</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>👎</Text>
              <Text style={styles.actionText}>7</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>⬇️</Text>
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>↗️</Text>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>🚩</Text>
              <Text style={styles.actionText}>Report</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Episode List */}
        {episodes && episodes.length > 0 && (
          <View style={styles.episodesSection}>
            <Text style={styles.sectionTitle}>Episode List ({episodes.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.episodeScroll}>
              {/* Episodes map is reversed because episode 1 is usually at the end of the array from otakudesu */}
              {[...episodes].reverse().map((ep, idx) => {
                const epNum = idx + 1;
                const isActive = ep.url === episodeUrl;
                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.epBox, isActive && styles.epBoxActive]}
                    onPress={() => {
                      if(!isActive) {
                        navigation.setParams({ episodeUrl: ep.url, title: ep.title });
                      }
                    }}
                  >
                    <Text style={[styles.epBoxText, isActive && styles.epBoxTextActive]}>
                      {epNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Comments Section (Mockup) */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>417 Comments</Text>
          <View style={styles.commentTabs}>
            <TouchableOpacity style={styles.commentTabActive}>
              <Text style={styles.commentTabTextActive}>Top Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commentTab}>
              <Text style={styles.commentTabText}>Terbaru</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.commentItem}>
            <View style={styles.commentAvatar} />
            <View style={styles.commentBody}>
              <Text style={styles.commentName}>User123 <Text style={styles.commentTime}>• 1 hari yang lalu</Text></Text>
              <Text style={styles.commentText}>Animasi episode ini sangat keren, nggak sabar nunggu minggu depan!</Text>
            </View>
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerContainer: {
    width: '100%',
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#F59E0B',
    marginTop: 10,
    fontSize: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },

  // Resolution Row
  resSelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: 8,
  },
  resBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1A1A1A',
  },
  resBtnActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  resBtnText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  resBtnTextActive: {
    color: '#F59E0B',
  },

  // Info Section
  infoSection: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  animeTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  episodeSubTitle: {
    color: '#CCC',
    fontSize: 13,
    marginBottom: 4,
  },
  statsText: {
    color: '#666',
    fontSize: 11,
  },

  // Actions
  actionScroll: {
    flexDirection: 'row',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  actionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Episodes
  episodesSection: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  episodeScroll: {
    gap: 10,
  },
  epBox: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  epBoxActive: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  epBoxText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '700',
  },
  epBoxTextActive: {
    color: '#000',
  },

  // Comments
  commentsSection: {
    padding: 14,
  },
  commentTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  commentTabActive: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  commentTabTextActive: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
  commentTab: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  commentTabText: {
    color: '#CCC',
    fontWeight: '600',
    fontSize: 12,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    marginRight: 10,
  },
  commentBody: {
    flex: 1,
  },
  commentName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentTime: {
    color: '#666',
    fontWeight: '400',
  },
  commentText: {
    color: '#CCC',
    fontSize: 13,
    lineHeight: 18,
  },
});
