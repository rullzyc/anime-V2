import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <Text style={styles.username}>Arul</Text>
          <Text style={styles.userSub}>PyAnimeIndo Member</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Ditonton', value: '0' },
            { label: 'Tersimpan', value: '0' },
            { label: 'Selesai', value: '0' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {[
            { icon: '📖', label: 'Riwayat Tonton' },
            { icon: '🔖', label: 'Anime Tersimpan' },
            { icon: '🔔', label: 'Notifikasi' },
            { icon: '⚙️', label: 'Pengaturan' },
            { icon: 'ℹ️', label: 'Tentang Aplikasi' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>PyAnimeIndo v1.0 • by Arul</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { paddingBottom: 40 },

  avatarSection: { alignItems: 'center', paddingVertical: 36 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#000', fontSize: 32, fontWeight: '900' },
  username: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  userSub: { color: '#555', fontSize: 12, marginTop: 4 },

  statsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: '#111', paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#F59E0B', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#555', fontSize: 11, marginTop: 4 },

  menuSection: { marginTop: 12 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  menuIcon: { fontSize: 18, marginRight: 16 },
  menuLabel: { flex: 1, color: '#DDD', fontSize: 14, fontWeight: '500' },
  menuArrow: { color: '#333', fontSize: 22 },

  version: { color: '#333', textAlign: 'center', fontSize: 11, marginTop: 32 },
});
