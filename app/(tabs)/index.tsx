import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore, useTaskStore } from '@/context/stores';
import { ordersAPI, bidsAPI, paymentsAPI } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5', gold: '#F59E0B', cyan: '#06B6D4', error: '#EF4444' };

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { tasks, fetchTasks } = useTaskStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isHelper = user?.role === 'helper';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

  const fetchAll = async () => {
    try {
      const promises: Promise<any>[] = [fetchTasks({ limit: 10 })];
      promises.push(ordersAPI.list().then(r => setOrders(r.data.orders || r.data || [])).catch(() => {}));
      promises.push(paymentsAPI.wallet().then(r => setWallet(r.data)).catch(() => {}));
      if (isHelper) promises.push(bidsAPI.myBids().then(r => setMyBids(r.data.bids || r.data || [])).catch(() => {}));
      await Promise.allSettled(promises);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  const activeOrders = orders.filter(o => ['active', 'delivered', 'revision'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');
  const pendingBids = myBids.filter(b => b.status === 'pending');
  const statusColor = (s: string) => ({ open: C.accent, in_progress: C.cyan, delivered: C.gold, completed: C.accent, active: C.cyan, revision: '#F97316', pending: C.gold, accepted: C.accent, rejected: C.error }[s] || C.textMuted);

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting()}</Text>
          <Text style={[s.name, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>{user?.name || 'User'}</Text>
        </View>
        <View style={s.headerRight}>
          {isAdmin && <TouchableOpacity onPress={() => router.push('/admin')} style={s.iconBtn}><Ionicons name="settings-outline" size={20} color={C.primary} /></TouchableOpacity>}
          <TouchableOpacity style={s.iconBtn}><Ionicons name="notifications-outline" size={22} color={C.textSoft} /></TouchableOpacity>
          {!isHelper && <TouchableOpacity onPress={() => router.push('/create-task')} style={s.createBtn}><Ionicons name="add" size={20} color="#fff" /><Text style={s.createText}>Post Task</Text></TouchableOpacity>}
          {isHelper && <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} style={s.createBtn}><Ionicons name="search" size={18} color="#fff" /><Text style={s.createText}>Find Work</Text></TouchableOpacity>}
        </View>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        {isHelper ? (
          <>
            <StatBox icon="paper-plane-outline" label="Pending Bids" value={pendingBids.length} color={C.gold} />
            <StatBox icon="briefcase-outline" label="Active Orders" value={activeOrders.length} color={C.cyan} />
            <StatBox icon="cash-outline" label="Balance" value={`$${wallet?.balance?.toFixed(0) || 0}`} color={C.accent} />
          </>
        ) : (
          <>
            <StatBox icon="document-outline" label="My Tasks" value={tasks.length} color={C.primary} />
            <StatBox icon="briefcase-outline" label="Active Orders" value={activeOrders.length} color={C.cyan} />
            <StatBox icon="star-outline" label="Rating" value={user?.rating?.toFixed(1) || '—'} color={C.gold} />
          </>
        )}
      </View>

      {/* Wallet card (helpers) */}
      {isHelper && wallet && (
        <TouchableOpacity onPress={() => router.push('/payment')} style={s.walletCard}>
          <View style={s.walletLeft}>
            <Ionicons name="wallet" size={24} color={C.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={s.walletLabel}>Available Balance</Text>
              <Text style={s.walletAmount}>${(wallet.balance || 0).toFixed(2)}</Text>
            </View>
          </View>
          <View style={s.walletBtn}><Text style={s.walletBtnText}>Withdraw</Text><Ionicons name="arrow-forward" size={16} color={C.primary} /></View>
        </TouchableOpacity>
      )}

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <>
          <SectionHead title="Active Orders" count={activeOrders.length} action={() => router.push('/(tabs)/orders')} />
          {activeOrders.slice(0, 3).map(o => (
            <TouchableOpacity key={o.id} style={s.card} onPress={() => router.push(`/order/${o.id}`)}>
              <View style={s.cardTop}>
                <View style={[s.badge, { backgroundColor: `${statusColor(o.status)}12` }]}><View style={[s.dot, { backgroundColor: statusColor(o.status) }]} /><Text style={[s.badgeText, { color: statusColor(o.status) }]}>{(o.status || '').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text></View>
                <Text style={s.amount}>${o.amount}</Text>
              </View>
              <Text style={s.cardTitle}>{o.taskId ? `Order #${o.id?.slice(0, 8)}` : 'Service Order'}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Helper: My Bids */}
      {isHelper && pendingBids.length > 0 && (
        <>
          <SectionHead title="Pending Bids" count={pendingBids.length} />
          {pendingBids.slice(0, 5).map(b => (
            <TouchableOpacity key={b.id} style={s.card} onPress={() => router.push(`/task/${b.taskId}`)}>
              <View style={s.cardTop}>
                <View style={[s.badge, { backgroundColor: `${C.gold}12` }]}><Text style={[s.badgeText, { color: C.gold }]}>Pending</Text></View>
                <Text style={s.amount}>${b.amount}</Text>
              </View>
              <Text style={s.cardMeta}>{b.deliveryDays}d delivery · Sent {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Student: Recent Tasks */}
      {!isHelper && (
        <>
          <SectionHead title="Recent Tasks" count={tasks.length} action={() => router.push('/(tabs)/explore')} />
          {loading && tasks.length === 0 ? <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View> :
          tasks.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="document-outline" size={40} color={C.textMuted} />
              <Text style={s.emptyTitle}>No tasks yet</Text>
              <Text style={s.emptyDesc}>Post your first task and get bids from verified experts</Text>
              <TouchableOpacity onPress={() => router.push('/create-task')} style={s.emptyBtn}><Text style={s.emptyBtnText}>Post a Task</Text></TouchableOpacity>
            </View>
          ) : tasks.slice(0, 5).map((t: any) => (
            <TouchableOpacity key={t.id} style={s.card} onPress={() => router.push(`/task/${t.id}`)}>
              <View style={s.cardTop}>
                <View style={[s.badge, { backgroundColor: `${statusColor(t.status)}12` }]}><View style={[s.dot, { backgroundColor: statusColor(t.status) }]} /><Text style={[s.badgeText, { color: statusColor(t.status) }]}>{(t.status || 'open').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text></View>
                <Text style={s.amount}>${t.budget}</Text>
              </View>
              <Text style={s.cardTitle} numberOfLines={2}>{t.title}</Text>
              <View style={s.cardBot}><Text style={s.cardMeta}>{t.bidsCount || 0} bids · {t.category}</Text></View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Completed */}
      {completedOrders.length > 0 && (
        <>
          <SectionHead title="Completed" count={completedOrders.length} />
          {completedOrders.slice(0, 3).map(o => (
            <TouchableOpacity key={o.id} style={s.card} onPress={() => router.push(`/order/${o.id}`)}>
              <View style={s.cardTop}>
                <View style={[s.badge, { backgroundColor: `${C.accent}12` }]}><Ionicons name="checkmark-circle" size={14} color={C.accent} /><Text style={[s.badgeText, { color: C.accent }]}>Completed</Text></View>
                <Text style={s.amount}>${o.amount}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const StatBox = ({ icon, label, value, color }: any) => (
  <View style={[s.statCard, { borderColor: `${color}20` }]}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const SectionHead = ({ title, count, action }: { title: string; count?: number; action?: () => void }) => (
  <View style={s.sectionHeader}>
    <Text style={s.sectionTitle}>{title}{count ? ` (${count})` : ''}</Text>
    {action && <TouchableOpacity onPress={action}><Text style={s.seeAll}>See All</Text></TouchableOpacity>}
  </View>
);

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 16 },
  greeting: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  createText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: C.bgSoft, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  walletCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, padding: 18, backgroundColor: C.primarySoft, borderRadius: 16, borderWidth: 1, borderColor: C.primary + '20', marginBottom: 16 },
  walletLeft: { flexDirection: 'row', alignItems: 'center' },
  walletLabel: { fontSize: 12, color: C.textMuted },
  walletAmount: { fontSize: 22, fontWeight: '800', color: C.primary },
  walletBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  walletBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  seeAll: { fontSize: 14, color: C.primary, fontWeight: '600' },
  card: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 17, fontWeight: '800', color: C.primary },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 22 },
  cardBot: { marginTop: 6 },
  cardMeta: { fontSize: 12, color: C.textMuted },
  emptyBox: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 12 },
  emptyDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
