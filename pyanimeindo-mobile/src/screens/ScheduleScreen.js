import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, StatusBar, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchSchedule, proxyImg } from '../api/apiClient';

// API returns a dict: { "Senin": [{title, eps, img, hari, url}, ...], "Selasa": [...], ... }
const DAYS_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

function getTodayName() {
  const dayIndex = new Date().getDay(); // 0=Minggu, 1=Senin, ...
  const map = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return map[dayIndex];
}

export default function ScheduleScreen({ navigation }) {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(getTodayName());
  const [availableDays, setAvailableDays] = useState([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchSchedule();
    // data is { "Senin": [...], "Selasa": [...], ... }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      setSchedule(data);
      // Sort days by DAYS_ORDER, filter only days that exist in data
      const days = DAYS_ORDER.filter(d => data[d] && data[d].length > 0);
      // Also include any extra day keys not in DAYS_ORDER
      Object.keys(data).forEach(k => {
        if (!days.includes(k) && data[k].length > 0) days.push(k);
      });
      setAvailableDays(days);
      // If today has no schedule, pick first available
      if (!data[activeDay] && days.length > 0) {
        setActiveDay(days[0]);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  const animeList = Array.isArray(schedule[activeDay]) ? schedule[activeDay] : [];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      {/* Day Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayScroll}
        contentContainerStyle={styles.dayContainer}
      >
        {(availableDays.length > 0 ? availableDays : DAYS_ORDER).map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayTab, activeDay === day && styles.dayTabActive]}
            onPress={() => setActiveDay(day)}
          >
            <Text style={[styles.dayText, activeDay === day && styles.dayTextActive]}>{day}</Text>
            {activeDay === day && <View style={styles.dayIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Anime List */}
      <ScrollView contentContainerStyle={styles.list}>
        {animeList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada jadwal untuk {activeDay}.</Text>
          </View>
        ) : (
          animeList.map((anime, i) => (
            <TouchableOpacity
              key={i}
              style={styles.animeItem}
              onPress={() => anime.url
                ? navigation.navigate('Detail', { url: anime.url, title: anime.title })
                : null
              }
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: proxyImg(anime.img) }}
                style={styles.animeThumbnail}
              />
              <View style={styles.animeInfo}>
                <Text style={styles.animeTitle} numberOfLines={2}>{anime.title}</Text>
                <Text style={styles.animeEps}>{anime.eps || 'Ongoing'}</Text>
              </View>
              <Text style={styles.arrowIcon}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },

  dayScroll: { flexGrow: 0, backgroundColor: '#0D0D0D', borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  dayContainer: { flexDirection: 'row', paddingHorizontal: 8 },
  dayTab: {
    paddingHorizontal: 14, paddingVertical: 14,
    alignItems: 'center', position: 'relative',
  },
  dayTabActive: {},
  dayText: { color: '#555', fontSize: 13, fontWeight: '600' },
  dayTextActive: { color: '#F59E0B', fontWeight: '700' },
  dayIndicator: {
    position: 'absolute', bottom: 0, left: 8, right: 8,
    height: 2, backgroundColor: '#F59E0B', borderRadius: 2,
  },

  list: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 20 },
  emptyContainer: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: '#444', fontSize: 14, textAlign: 'center' },

  animeItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111',
  },
  animeThumbnail: {
    width: 50, height: 70, borderRadius: 6,
    resizeMode: 'cover', backgroundColor: '#1A1A1A',
    marginRight: 12,
  },
  animeInfo: { flex: 1 },
  animeTitle: { color: '#FFF', fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 4 },
  animeEps: { color: '#F59E0B', fontSize: 12, fontWeight: '500' },
  arrowIcon: { color: '#333', fontSize: 22, marginLeft: 8 },
});
