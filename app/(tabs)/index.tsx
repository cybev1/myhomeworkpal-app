import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const { width } = Dimensions.get('window');
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', gold: '#F59E0B' };

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

  const tasks = [
    { id: '1', title: 'Need help with Calculus II integration problems', category: 'Math', budget: 35, bids: 7, time: '2h ago', status: 'Open' },
    { id: '2', title: 'Python data analysis project — Pandas & Matplotlib', category: 'CS', budget: 75, bids: 12, time: '4h ago', status: 'Open' },
    { id: '3', title: 'Essay on Renaissance art movements — 2000 words', category: 'Humanities', budget: 50, bids: 4, time: '1h ago', status: 'Open' },
  ];

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting()}</Text>
          <Text style={[s.name, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>{user?.name || 'Student'}</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconBtn}><Ionicons name="notifications-outline" size={22} color={C.textSoft} /></TouchableOpacity>
          <View style={s.avatar}><Text style={s.avatarText}>{(user?.name || 'U')[0]}</Text></View>
        </View>
      </View>

      {/* Search */}
      <TouchableOpacity style={s.searchBar} onPress={() => router.push('/explore')}>
        <Ionicons name="search-outline" size={20} color={C.textMuted} />
        <Text style={s.searchText}>Search tasks, helpers, subjects...</Text>
      </TouchableOpacity>

      {/* Quick actions */}
      <View style={s.actionsRow}>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push('/create-task')}>
          <View style={[s.actionIcon, { backgroundColor: C.primarySoft }]}><Ionicons name="add-circle-outline" size={24} color={C.primary} /></View>
          <Text style={s.actionLabel}>Post Task</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push('/explore')}>
          <View style={[s.actionIcon, { backgroundColor: '#ECFDF5' }]}><Ionicons name="people-outline" size={24} color={C.accent} /></View>
          <Text style={s.actionLabel}>Find Experts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push('/orders')}>
          <View style={[s.actionIcon, { backgroundColor: '#FFFBEB' }]}><Ionicons name="briefcase-outline" size={24} color={C.gold} /></View>
          <Text style={s.actionLabel}>My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push('/payment')}>
          <View style={[s.actionIcon, { backgroundColor: '#FEF2F2' }]}><Ionicons name="wallet-outline" size={24} color="#EF4444" /></View>
          <Text style={s.actionLabel}>Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}><Text style={s.statVal}>3</Text><Text style={s.statLbl}>Active</Text></View>
        <View style={s.statCard}><Text style={s.statVal}>12</Text><Text style={s.statLbl}>Completed</Text></View>
        <View style={s.statCard}><Text style={s.statVal}>$450</Text><Text style={s.statLbl}>Spent</Text></View>
        <View style={s.statCard}><Text style={s.statVal}>4.8</Text><Text style={s.statLbl}>Rating</Text></View>
      </View>

      {/* Latest tasks */}
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>Latest Tasks</Text>
        <TouchableOpacity onPress={() => router.push('/explore')}><Text style={s.seeAll}>See all</Text></TouchableOpacity>
      </View>
      {tasks.map((t) => (
        <TouchableOpacity key={t.id} style={s.taskCard} onPress={() => router.push(`/task/${t.id}`)}>
          <View style={s.taskTop}>
            <View style={s.taskBadge}><Text style={s.taskBadgeText}>{t.status}</Text></View>
            <Text style={s.taskCat}>{t.category}</Text>
          </View>
          <Text style={s.taskTitle}>{t.title}</Text>
          <View style={s.taskBottom}>
            <Text style={s.taskMeta}><Ionicons name="chatbubble-outline" size={12} color={C.textMuted} /> {t.bids} bids</Text>
            <Text style={s.taskMeta}>{t.time}</Text>
            <View style={s.taskBudget}><Text style={s.taskBudgetText}>${t.budget}</Text></View>
          </View>
        </TouchableOpacity>
      ))}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12 },
  greeting: { fontSize: 13, color: C.textMuted },
  name: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginVertical: 12, backgroundColor: C.bgSoft, borderRadius: 12, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: C.border },
  searchText: { fontSize: 14, color: C.textMuted },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  actionCard: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '600', color: C.textSoft },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: C.bgSoft, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statVal: { fontSize: 20, fontWeight: '800', color: C.text },
  statLbl: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: '600' },
  taskCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 18 },
  taskTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  taskBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  taskBadgeText: { fontSize: 11, fontWeight: '700', color: C.accent },
  taskCat: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 22, marginBottom: 10 },
  taskBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskMeta: { fontSize: 12, color: C.textMuted },
  taskBudget: { marginLeft: 'auto', backgroundColor: C.primarySoft, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },
  taskBudgetText: { fontSize: 14, fontWeight: '800', color: C.primary },
});
