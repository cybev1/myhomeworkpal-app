import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore, useTaskStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const { width } = Dimensions.get('window');
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', gold: '#F59E0B', cyan: '#06B6D4' };

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const [refreshing, setRefreshing] = useState(false);

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

  useEffect(() => { fetchTasks({ limit: 10 }); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks({ limit: 10 });
    setRefreshing(false);
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { open: C.accent, in_progress: C.cyan, delivered: C.gold, completed: C.accent };
    return map[s] || C.textMuted;
  };

  const recentTasks = tasks.slice(0, 5);

  return (
    <ScrollView
      style={s.page}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting()}</Text>
          <Text style={[s.name, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>{user?.name || 'Student'}</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={C.textSoft} />
            <View style={s.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/create-task')} style={s.createBtn}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={s.createText}>Post Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { borderColor: `${C.primary}20` }]}>
          <Ionicons name="briefcase-outline" size={20} color={C.primary} />
          <Text style={s.statValue}>{tasks.length}</Text>
          <Text style={s.statLabel}>Active Tasks</Text>
        </View>
        <View style={[s.statCard, { borderColor: `${C.accent}20` }]}>
          <Ionicons name="checkmark-done-outline" size={20} color={C.accent} />
          <Text style={s.statValue}>{tasks.filter(t => t.status === 'completed').length}</Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
        <View style={[s.statCard, { borderColor: `${C.gold}20` }]}>
          <Ionicons name="star-outline" size={20} color={C.gold} />
          <Text style={s.statValue}>{user?.rating?.toFixed(1) || '—'}</Text>
          <Text style={s.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Recent tasks */}
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Recent Tasks</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
          <Text style={s.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {isLoading && tasks.length === 0 ? (
        <View style={s.loadWrap}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : recentTasks.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="document-outline" size={40} color={C.textMuted} />
          <Text style={s.emptyTitle}>No tasks yet</Text>
          <Text style={s.emptyDesc}>Post your first task or browse available tasks</Text>
          <TouchableOpacity onPress={() => router.push('/create-task')} style={s.emptyBtn}>
            <Text style={s.emptyBtnText}>Post a Task</Text>
          </TouchableOpacity>
        </View>
      ) : (
        recentTasks.map((t: any) => (
          <TouchableOpacity key={t.id || t._id} style={s.taskCard} onPress={() => router.push(`/task/${t.id || t._id}`)}>
            <View style={s.taskTop}>
              <View style={[s.statusBadge, { backgroundColor: `${statusColor(t.status)}12` }]}>
                <View style={[s.statusDot, { backgroundColor: statusColor(t.status) }]} />
                <Text style={[s.statusText, { color: statusColor(t.status) }]}>
                  {(t.status || 'open').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Text>
              </View>
              <Text style={s.budget}>${t.budget}</Text>
            </View>
            <Text style={s.taskTitle} numberOfLines={2}>{t.title}</Text>
            <View style={s.taskBot}>
              <View style={s.taskMeta}>
                <Ionicons name="chatbubble-outline" size={14} color={C.textMuted} />
                <Text style={s.taskMetaText}>{t.bidsCount || t.bids_count || 0} bids</Text>
              </View>
              <Text style={s.taskCategory}>{(t.category || '').toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 16 },
  greeting: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, borderWidth: 1.5, borderColor: '#fff' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  createText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.bgSoft, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 11, color: C.textMuted, fontWeight: '500' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  seeAll: { fontSize: 14, color: C.primary, fontWeight: '600' },

  loadWrap: { paddingVertical: 60, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 12 },
  emptyDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  taskCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
  taskTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  budget: { fontSize: 17, fontWeight: '800', color: C.primary },
  taskTitle: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 22, marginBottom: 10 },
  taskBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMetaText: { fontSize: 12, color: C.textMuted },
  taskCategory: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1 },
});
