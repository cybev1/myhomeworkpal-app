import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ordersAPI } from '@/services/api';
import { useAuthStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', gold: '#F59E0B', cyan: '#06B6D4', error: '#EF4444' };

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'completed' | 'all'>('active');

  const isHelper = user?.role === 'helper';

  const fetchOrders = async () => {
    try {
      const { data } = await ordersAPI.list();
      setOrders(data.orders || data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); };

  const sc = (s: string) => ({ active: C.cyan, delivered: C.gold, completed: C.accent, revision: '#F97316', disputed: C.error, pending: C.textMuted, cancelled: C.error }[s] || C.textMuted);

  const filtered = orders.filter(o => {
    if (tab === 'active') return ['active', 'delivered', 'revision', 'pending'].includes(o.status);
    if (tab === 'completed') return ['completed', 'cancelled', 'disputed'].includes(o.status);
    return true;
  });

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>My Orders</Text>
        {!isHelper && <TouchableOpacity style={s.addBtn} onPress={() => router.push('/create-task')}><Ionicons name="add" size={22} color="#fff" /></TouchableOpacity>}
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(['active', 'completed', 'all'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === 'active' ? `Active (${orders.filter(o => ['active','delivered','revision','pending'].includes(o.status)).length})` : t === 'completed' ? 'Completed' : 'All'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}>
        {loading ? (
          <View style={s.loadWrap}><ActivityIndicator size="large" color={C.primary} /></View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="briefcase-outline" size={44} color={C.textMuted} />
            <Text style={s.emptyTitle}>{tab === 'active' ? 'No active orders' : tab === 'completed' ? 'No completed orders' : 'No orders yet'}</Text>
            <Text style={s.emptyDesc}>{isHelper ? 'Browse tasks and place bids to get started' : 'Post a task and accept a bid to create an order'}</Text>
            <TouchableOpacity onPress={() => router.push(isHelper ? '/(tabs)/explore' : '/create-task')} style={s.emptyBtn}>
              <Text style={s.emptyBtnText}>{isHelper ? 'Find Tasks' : 'Post a Task'}</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.map((o: any) => (
          <TouchableOpacity key={o.id} style={s.card} onPress={() => router.push(`/order/${o.id}`)}>
            <View style={s.cardTop}>
              <View style={[s.badge, { backgroundColor: `${sc(o.status)}12` }]}>
                <View style={[s.dot, { backgroundColor: sc(o.status) }]} />
                <Text style={[s.badgeText, { color: sc(o.status) }]}>{(o.status || '').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text>
              </View>
              <Text style={s.amount}>${o.amount}</Text>
            </View>
            <Text style={s.cardTitle} numberOfLines={2}>{o.title || `Order #${o.id?.slice(0, 8)}`}</Text>
            <View style={s.cardBot}>
              <View style={s.personRow}>
                <View style={s.miniAv}><Text style={s.miniAvText}>{(isHelper ? o.studentName : o.helperName)?.[0] || '?'}</Text></View>
                <Text style={s.personName}>{isHelper ? (o.studentName || 'Student') : (o.helperName || 'Awaiting helper')}</Text>
              </View>
              {o.deliveryDeadline && <Text style={s.deadline}>Due {new Date(o.deliveryDeadline).toLocaleDateString()}</Text>}
            </View>
            {/* Action hint */}
            {o.status === 'delivered' && !isHelper && (
              <View style={s.actionHint}><Ionicons name="checkmark-circle-outline" size={14} color={C.accent} /><Text style={s.actionHintText}>Ready to review — tap to approve or request revision</Text></View>
            )}
            {o.status === 'active' && isHelper && (
              <View style={s.actionHint}><Ionicons name="paper-plane-outline" size={14} color={C.cyan} /><Text style={s.actionHintText}>Tap to deliver your work</Text></View>
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  addBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: C.bgSoft, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  tabTextActive: { color: C.primary },
  loadWrap: { paddingVertical: 60, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 12 },
  emptyDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', marginTop: 4, paddingHorizontal: 40, marginBottom: 20 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  card: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '800', color: C.primary },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 22, marginBottom: 10 },
  cardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniAv: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  miniAvText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  personName: { fontSize: 13, color: C.textSoft, fontWeight: '500' },
  deadline: { fontSize: 12, color: C.textMuted },
  actionHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  actionHintText: { fontSize: 12, color: C.textMuted, flex: 1 },
});
