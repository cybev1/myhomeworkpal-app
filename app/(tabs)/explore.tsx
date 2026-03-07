import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTaskStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981' };

const cats = ['All', 'Math', 'CS', 'English', 'Science', 'Business', 'Engineering'];

export default function ExploreScreen() {
  const router = useRouter();
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchTasks(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const onCatChange = (cat: string) => {
    setActiveCat(cat);
    if (cat === 'All') fetchTasks();
    else fetchTasks({ category: cat.toLowerCase() });
  };

  const filteredTasks = tasks.filter((t: any) => {
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusColor = (s: string) => {
    const map: Record<string, string> = { open: C.accent, in_progress: '#06B6D4', delivered: '#F59E0B', completed: C.accent };
    return map[s] || C.textMuted;
  };

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Explore</Text>
        <TouchableOpacity style={s.filterBtn}><Ionicons name="options-outline" size={20} color={C.textSoft} /></TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color={C.textMuted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search tasks, helpers, subjects..." placeholderTextColor={C.textMuted} style={s.searchInput} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
        {cats.map((c) => (
          <TouchableOpacity key={c} onPress={() => onCatChange(c)} style={[s.catChip, activeCat === c && s.catChipActive]}>
            <Text style={[s.catText, activeCat === c && s.catTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {isLoading && tasks.length === 0 ? (
          <View style={s.loadWrap}><ActivityIndicator size="large" color={C.primary} /></View>
        ) : filteredTasks.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="search" size={40} color={C.textMuted} />
            <Text style={s.emptyTitle}>No tasks found</Text>
            <Text style={s.emptyDesc}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          filteredTasks.map((t: any) => (
            <TouchableOpacity key={t.id || t._id} style={s.card} onPress={() => router.push(`/task/${t.id || t._id}`)}>
              <View style={s.cardTop}>
                <View style={[s.statusBadge, { backgroundColor: `${statusColor(t.status)}12` }]}>
                  <View style={[s.statusDot, { backgroundColor: statusColor(t.status) }]} />
                  <Text style={[s.statusText, { color: statusColor(t.status) }]}>
                    {(t.status || 'open').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Text>
                </View>
                <Text style={s.budget}>${t.budget}</Text>
              </View>
              <Text style={s.cardTitle} numberOfLines={2}>{t.title}</Text>
              {t.description && <Text style={s.cardDesc} numberOfLines={2}>{t.description}</Text>}
              <View style={s.cardBot}>
                <View style={s.meta}>
                  <Ionicons name="chatbubble-outline" size={13} color={C.textMuted} />
                  <Text style={s.metaText}>{t.bidsCount || t.bids_count || 0} bids</Text>
                </View>
                <Text style={s.category}>{(t.category || '').toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  filterBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginVertical: 12, backgroundColor: C.bgSoft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: C.text, ...(isWeb ? { outlineStyle: 'none' } : {}) },
  catScroll: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border },
  catChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  catText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  catTextActive: { color: '#fff' },

  loadWrap: { paddingVertical: 60, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 12 },
  emptyDesc: { fontSize: 14, color: C.textMuted, marginTop: 4 },

  card: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  budget: { fontSize: 17, fontWeight: '800', color: C.primary },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 22, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: C.textMuted, lineHeight: 20, marginBottom: 10 },
  cardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: C.textMuted },
  category: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1 },
});
