import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTaskStore } from '@/context/stores';
import { usersAPI } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', gold: '#F59E0B', cyan: '#06B6D4' };
const cats = ['All', 'Math', 'CS', 'English', 'Science', 'Business', 'Engineering', 'Humanities', 'Other'];

export default function ExploreScreen() {
  const router = useRouter();
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [tab, setTab] = useState<'tasks' | 'experts'>('tasks');
  const [experts, setExperts] = useState<any[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchTasks(); fetchExperts(); }, []);

  const fetchExperts = async () => {
    setLoadingExperts(true);
    try { const { data } = await usersAPI.topHelpers(); setExperts(data.helpers || data || []); }
    catch {} finally { setLoadingExperts(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchTasks(); await fetchExperts(); setRefreshing(false); };
  const onCatChange = (cat: string) => { setActiveCat(cat); fetchTasks(cat === 'All' ? {} : { category: cat.toLowerCase() }); };

  const filteredTasks = tasks.filter((t: any) => !search || t.title?.toLowerCase().includes(search.toLowerCase()));
  const filteredExperts = experts.filter((e: any) => !search || e.name?.toLowerCase().includes(search.toLowerCase()));

  const statusColor = (s: string) => ({ open: C.accent, in_progress: C.cyan, delivered: C.gold, completed: C.accent }[s] || C.textMuted);

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Explore</Text>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color={C.textMuted} />
        <TextInput value={search} onChangeText={setSearch} placeholder={tab === 'tasks' ? 'Search tasks...' : 'Search experts...'} placeholderTextColor={C.textMuted} style={s.searchInput} />
      </View>

      {/* Tasks / Experts toggle */}
      <View style={s.toggleRow}>
        <TouchableOpacity onPress={() => setTab('tasks')} style={[s.toggleBtn, tab === 'tasks' && s.toggleActive]}>
          <Ionicons name="briefcase-outline" size={16} color={tab === 'tasks' ? C.primary : C.textMuted} />
          <Text style={[s.toggleText, tab === 'tasks' && { color: C.primary }]}>Find Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('experts')} style={[s.toggleBtn, tab === 'experts' && s.toggleActive]}>
          <Ionicons name="people-outline" size={16} color={tab === 'experts' ? C.primary : C.textMuted} />
          <Text style={[s.toggleText, tab === 'experts' && { color: C.primary }]}>Find Experts</Text>
        </TouchableOpacity>
      </View>

      {/* Categories (tasks only) */}
      {tab === 'tasks' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
          {cats.map(c => (
            <TouchableOpacity key={c} onPress={() => onCatChange(c)} style={[s.catChip, activeCat === c && s.catChipActive]}>
              <Text style={[s.catText, activeCat === c && { color: '#fff' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}>
        {/* TASKS TAB */}
        {tab === 'tasks' && (
          isLoading && tasks.length === 0 ? <View style={s.loadWrap}><ActivityIndicator size="large" color={C.primary} /></View> :
          filteredTasks.length === 0 ? <View style={s.emptyBox}><Ionicons name="search" size={40} color={C.textMuted} /><Text style={s.emptyTitle}>No tasks found</Text></View> :
          filteredTasks.map((t: any) => (
            <TouchableOpacity key={t.id} style={s.card} onPress={() => router.push(`/task/${t.id}`)}>
              <View style={s.cardTop}>
                <View style={[s.badge, { backgroundColor: `${statusColor(t.status)}12` }]}>
                  <View style={[s.dot, { backgroundColor: statusColor(t.status) }]} />
                  <Text style={[s.badgeText, { color: statusColor(t.status) }]}>{(t.status || 'open').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text>
                </View>
                <Text style={s.budget}>${t.budget}</Text>
              </View>
              <Text style={s.cardTitle} numberOfLines={2}>{t.title}</Text>
              {t.description && <Text style={s.cardDesc} numberOfLines={2}>{t.description}</Text>}
              <View style={s.cardBot}>
                <Text style={s.meta}>{t.bidsCount || 0} bids · {t.category}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* EXPERTS TAB */}
        {tab === 'experts' && (
          loadingExperts ? <View style={s.loadWrap}><ActivityIndicator size="large" color={C.primary} /></View> :
          filteredExperts.length === 0 ? <View style={s.emptyBox}><Ionicons name="people" size={40} color={C.textMuted} /><Text style={s.emptyTitle}>No experts found</Text></View> :
          filteredExperts.map((e: any) => (
            <TouchableOpacity key={e.id} style={s.expertCard} onPress={() => router.push(`/profile/${e.id}`)}>
              <View style={s.expertAvatar}><Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{e.name?.[0] || '?'}</Text></View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.expertName}>{e.name}</Text>
                  {e.verified && <Ionicons name="checkmark-circle" size={14} color={C.primary} />}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Ionicons name="star" size={14} color={C.gold} />
                  <Text style={s.expertMeta}>{e.rating?.toFixed(1) || '—'} · {e.completedOrders || 0} orders</Text>
                </View>
                {e.skills && <Text style={s.expertSkills} numberOfLines={1}>{e.skills}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
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
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginVertical: 10, backgroundColor: C.bgSoft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: C.text, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  toggleRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, backgroundColor: C.bgSoft, borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  toggleActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  catScroll: { paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border },
  catChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  catText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  loadWrap: { paddingVertical: 60, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 12 },
  card: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  budget: { fontSize: 17, fontWeight: '800', color: C.primary },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 22, marginBottom: 2 },
  cardDesc: { fontSize: 13, color: C.textMuted, lineHeight: 20, marginBottom: 6 },
  cardBot: { marginTop: 4 },
  meta: { fontSize: 12, color: C.textMuted },
  expertCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  expertAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  expertName: { fontSize: 15, fontWeight: '700', color: C.text },
  expertMeta: { fontSize: 12, color: C.textMuted },
  expertSkills: { fontSize: 12, color: C.primary, marginTop: 4 },
});
