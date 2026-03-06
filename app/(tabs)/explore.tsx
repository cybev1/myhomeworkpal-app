import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981' };

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('tasks');
  const cats = ['All', 'Math', 'CS', 'English', 'Science', 'Business', 'Engineering'];
  const [activeCat, setActiveCat] = useState('All');
  const tasks = [
    { id: '1', title: 'Statistics homework — hypothesis testing', cat: 'Math', budget: 40, bids: 5, time: '30m ago' },
    { id: '2', title: 'React Native mobile app UI implementation', cat: 'CS', budget: 120, bids: 18, time: '1h ago' },
    { id: '3', title: 'Business case study analysis — 3000 words', cat: 'Business', budget: 65, bids: 8, time: '2h ago' },
    { id: '4', title: 'Organic Chemistry lab report', cat: 'Science', budget: 55, bids: 3, time: '10m ago' },
  ];

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
      <View style={s.tabRow}>
        {['tasks', 'services', 'helpers'].map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
        {cats.map((c) => (
          <TouchableOpacity key={c} onPress={() => setActiveCat(c)} style={[s.chip, activeCat === c && s.chipActive]}>
            <Text style={[s.chipText, activeCat === c && s.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false}>
        {tasks.map((t) => (
          <TouchableOpacity key={t.id} style={s.taskCard} onPress={() => router.push(`/task/${t.id}`)}>
            <View style={s.taskTop}><View style={s.badge}><Text style={s.badgeText}>Open</Text></View><Text style={s.taskCat}>{t.cat}</Text></View>
            <Text style={s.taskTitle}>{t.title}</Text>
            <View style={s.taskBot}><Text style={s.meta}>{t.bids} bids</Text><Text style={s.meta}>{t.time}</Text><View style={s.budgetPill}><Text style={s.budgetText}>${t.budget}</Text></View></View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: C.text },
  filterBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginVertical: 8, backgroundColor: C.bgSoft, borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 14, color: C.text, ...(isWeb ? { outlineStyle: 'none' } : {}) },
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 20, marginBottom: 8 },
  tab: { paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  tabTextActive: { color: C.primary },
  catRow: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primarySoft, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  chipTextActive: { color: C.primary },
  taskCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16 },
  taskTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  badge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.accent },
  taskCat: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 22, marginBottom: 8 },
  taskBot: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { fontSize: 12, color: C.textMuted },
  budgetPill: { marginLeft: 'auto', backgroundColor: C.primarySoft, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },
  budgetText: { fontSize: 14, fontWeight: '800', color: C.primary },
});
