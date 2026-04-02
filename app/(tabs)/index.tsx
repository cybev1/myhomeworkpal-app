import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, RefreshControl, Linking } from 'react-native';
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
      await fetchTasks({ limit: 10 });
      const [o, w, b] = await Promise.allSettled([
        ordersAPI.list().then(r => setOrders(r.data.orders || r.data || [])),
        paymentsAPI.wallet().then(r => setWallet(r.data)),
        isHelper ? bidsAPI.myBids().then(r => setMyBids(r.data.bids || r.data || [])) : Promise.resolve(),
      ]);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  const activeOrders = orders.filter(o => ['active', 'delivered', 'revision'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');
  const pendingBids = myBids.filter(b => b.status === 'pending');
  const sc = (s: string) => ({ open: C.accent, active: C.cyan, delivered: C.gold, completed: C.accent, revision: '#F97316', pending: C.gold, in_progress: C.cyan }[s] || C.textMuted);

  // ═══ HELPER DASHBOARD ═══
  if (isHelper) return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting()}</Text>
          <Text style={[s.name, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>{user?.name || 'Expert'}</Text>
        </View>
        <View style={s.headerRight}>
          {isAdmin && <TouchableOpacity onPress={() => router.push('/admin')} style={s.iconBtn}><Ionicons name="settings" size={18} color={C.primary} /></TouchableOpacity>}
          <TouchableOpacity style={s.iconBtn}><Ionicons name="notifications-outline" size={20} color={C.textSoft} /></TouchableOpacity>
        </View>
      </View>

      {/* Wallet card */}
      <TouchableOpacity onPress={() => router.push('/payment')} style={s.walletCard}>
        <View>
          <Text style={s.walletLabel}>Available Balance</Text>
          <Text style={s.walletAmount}>${(wallet?.balance || 0).toFixed(2)}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>
            Escrow: ${(wallet?.escrowBalance || 0).toFixed(2)} · Clearing: ${(wallet?.pendingClearance || 0).toFixed(2)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={s.walletBtn}><Text style={s.walletBtnText}>Withdraw</Text><Ionicons name="arrow-forward" size={14} color="#fff" /></View>
        </View>
      </TouchableOpacity>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatBox icon="paper-plane" label="Pending Bids" value={pendingBids.length} color={C.gold} />
        <StatBox icon="briefcase" label="Active" value={activeOrders.length} color={C.cyan} />
        <StatBox icon="checkmark-circle" label="Completed" value={completedOrders.length} color={C.accent} />
        <StatBox icon="star" label="Rating" value={user?.rating?.toFixed(1) || '—'} color={C.gold} />
      </View>

      {/* Quick actions */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, marginBottom: 16 }}>
        <QuickAction icon="search" label="Find Tasks" color={C.primary} onPress={() => router.push('/(tabs)/explore')} />
        <QuickAction icon="school" label="Find Schools" color={C.cyan} onPress={() => router.push('/schools')} />
        <QuickAction icon="megaphone" label="Promote" color={C.gold} onPress={() => router.push('/promote')} />
        <QuickAction icon="paper-plane" label="Telegram" color="#0EA5E9" onPress={() => { if (isWeb) window.open('https://t.me/MyHomeworkPalBot', '_blank'); }} />
        <QuickAction icon="person" label="My Profile" color={C.accent} onPress={() => router.push(`/profile/${user?.id}`)} />
        <QuickAction icon="flash" label="Go Pro" color="#8B5CF6" onPress={() => router.push('/upgrade')} />
      </ScrollView>

      {/* Orders needing action */}
      {orders.filter(o => o.status === 'revision').length > 0 && (
        <>
          <View style={s.alertBanner}>
            <Ionicons name="alert-circle" size={20} color="#F97316" />
            <Text style={s.alertText}>You have {orders.filter(o => o.status === 'revision').length} order(s) requiring revision</Text>
          </View>
        </>
      )}

      {activeOrders.length > 0 && (
        <>
          <SectionHead title="Active Orders" count={activeOrders.length} action={() => router.push('/(tabs)/orders')} />
          {activeOrders.slice(0, 3).map(o => (
            <TouchableOpacity key={o.id} style={s.card} onPress={() => router.push(`/order/${o.id}`)}>
              <View style={s.cardTop}>
                <View style={[s.badge, { backgroundColor: `${sc(o.status)}12` }]}><View style={[s.dot, { backgroundColor: sc(o.status) }]} /><Text style={[s.badgeText, { color: sc(o.status) }]}>{o.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text></View>
                <Text style={s.amount}>${o.amount}</Text>
              </View>
              <Text style={s.cardTitle}>{o.title || `Order #${o.id?.slice(0, 8)}`}</Text>
              <Text style={s.cardMeta}>{o.studentName || 'Student'} · Due {o.deliveryDeadline ? new Date(o.deliveryDeadline).toLocaleDateString() : 'Flexible'}</Text>
              {o.status === 'active' && <View style={s.actionHint}><Ionicons name="paper-plane" size={12} color={C.cyan} /><Text style={s.actionHintText}>Tap to deliver your work</Text></View>}
              {o.status === 'revision' && <View style={s.actionHint}><Ionicons name="refresh" size={12} color="#F97316" /><Text style={[s.actionHintText, { color: '#F97316' }]}>Revision requested — tap to update</Text></View>}
            </TouchableOpacity>
          ))}
        </>
      )}

      {pendingBids.length > 0 && (
        <>
          <SectionHead title="Pending Bids" count={pendingBids.length} />
          {pendingBids.slice(0, 5).map(b => (
            <TouchableOpacity key={b.id} style={s.card} onPress={() => router.push(`/task/${b.taskId}`)}>
              <View style={s.cardTop}><View style={[s.badge, { backgroundColor: `${C.gold}12` }]}><Text style={[s.badgeText, { color: C.gold }]}>Pending</Text></View><Text style={s.amount}>${b.amount}</Text></View>
              <Text style={s.cardMeta}>{b.deliveryDays}d delivery · Sent {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Browse tasks */}
      <SectionHead title="Latest Tasks" count={tasks.length} action={() => router.push('/(tabs)/explore')} />
      {loading && tasks.length === 0 ? <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View> :
      tasks.length === 0 ? <View style={s.emptyBox}><Ionicons name="briefcase-outline" size={40} color={C.textMuted} /><Text style={s.emptyTitle}>No tasks yet</Text><Text style={s.emptyDesc}>Check back soon or browse the explore page</Text></View> :
      tasks.slice(0, 4).map((t: any) => (
        <TouchableOpacity key={t.id} style={s.card} onPress={() => router.push(`/task/${t.id}`)}>
          <View style={s.cardTop}><View style={[s.badge, { backgroundColor: `${C.accent}12` }]}><Text style={[s.badgeText, { color: C.accent }]}>Open</Text></View><Text style={s.amount}>${t.budget}</Text></View>
          <Text style={s.cardTitle}>{t.title}</Text>
          <Text style={s.cardMeta}>{t.bidsCount || 0} bids · {t.category}</Text>
        </TouchableOpacity>
      ))}

      {/* Promote banner */}
      <TouchableOpacity onPress={() => router.push('/promote')} style={s.promoBanner}>
        <Ionicons name="megaphone" size={24} color="#fff" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.promoTitle}>Get more students</Text>
          <Text style={s.promoDesc}>Create campaigns, share on social media, join school channels</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  // ═══ STUDENT DASHBOARD ═══
  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting()}</Text>
          <Text style={[s.name, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>{user?.name || 'Student'}</Text>
        </View>
        <View style={s.headerRight}>
          {isAdmin && <TouchableOpacity onPress={() => router.push('/admin')} style={s.iconBtn}><Ionicons name="settings" size={18} color={C.primary} /></TouchableOpacity>}
          <TouchableOpacity style={s.iconBtn}><Ionicons name="notifications-outline" size={20} color={C.textSoft} /></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/create-task')} style={s.createBtn}><Ionicons name="add" size={18} color="#fff" /><Text style={s.createText}>Post Task</Text></TouchableOpacity>
        </View>
      </View>

      {/* Wallet */}
      <TouchableOpacity onPress={() => router.push('/add-funds')} style={s.walletCard}>
        <View>
          <Text style={s.walletLabel}>Wallet Balance</Text>
          <Text style={s.walletAmount}>${(wallet?.balance || 0).toFixed(2)}</Text>
          {(wallet?.escrowBalance || 0) > 0 && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>In escrow: ${wallet.escrowBalance.toFixed(2)}</Text>}
        </View>
        <View style={s.walletBtn}><Text style={s.walletBtnText}>Add Funds</Text><Ionicons name="arrow-forward" size={14} color="#fff" /></View>
      </TouchableOpacity>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatBox icon="document" label="Tasks" value={tasks.length} color={C.primary} />
        <StatBox icon="briefcase" label="Active" value={activeOrders.length} color={C.cyan} />
        <StatBox icon="star" label="Rating" value={user?.rating?.toFixed(1) || '—'} color={C.gold} />
      </View>

      {/* Telegram link */}
      <TouchableOpacity onPress={() => { if (isWeb) window.open('https://t.me/MyHomeworkPalBot', '_blank'); }} style={s.tgBanner}>
        <View style={s.tgIcon}><Ionicons name="paper-plane" size={20} color="#fff" /></View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.tgTitle}>Use Telegram?</Text>
          <Text style={s.tgDesc}>Post tasks and check orders right from Telegram — no app needed!</Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#0284C7" />
      </TouchableOpacity>

      {activeOrders.length > 0 && (
        <>
          <SectionHead title="Active Orders" count={activeOrders.length} action={() => router.push('/(tabs)/orders')} />
          {activeOrders.slice(0, 3).map(o => (
            <TouchableOpacity key={o.id} style={s.card} onPress={() => router.push(`/order/${o.id}`)}>
              <View style={s.cardTop}><View style={[s.badge, { backgroundColor: `${sc(o.status)}12` }]}><View style={[s.dot, { backgroundColor: sc(o.status) }]} /><Text style={[s.badgeText, { color: sc(o.status) }]}>{o.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text></View><Text style={s.amount}>${o.amount}</Text></View>
              <Text style={s.cardTitle}>{o.title || `Order #${o.id?.slice(0, 8)}`}</Text>
              {o.status === 'delivered' && <View style={s.actionHint}><Ionicons name="checkmark-circle" size={12} color={C.accent} /><Text style={s.actionHintText}>Ready to review — tap to approve</Text></View>}
            </TouchableOpacity>
          ))}
        </>
      )}

      <SectionHead title="My Tasks" count={tasks.length} action={() => router.push('/(tabs)/explore')} />
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
          <View style={s.cardTop}><View style={[s.badge, { backgroundColor: `${sc(t.status)}12` }]}><View style={[s.dot, { backgroundColor: sc(t.status) }]} /><Text style={[s.badgeText, { color: sc(t.status) }]}>{(t.status || 'open').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text></View><Text style={s.amount}>${t.budget}</Text></View>
          <Text style={s.cardTitle}>{t.title}</Text>
          <Text style={s.cardMeta}>{t.bidsCount || 0} bids · {t.category}</Text>
        </TouchableOpacity>
      ))}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const QuickAction = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={[qs.box, { borderColor: `${color}20` }]}>
    <View style={[qs.iconWrap, { backgroundColor: `${color}12` }]}><Ionicons name={icon} size={20} color={color} /></View>
    <Text style={qs.label}>{label}</Text>
  </TouchableOpacity>
);
const qs = StyleSheet.create({
  box: { width: 85, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, gap: 6 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600', color: C.textSoft, textAlign: 'center' },
});

const StatBox = ({ icon, label, value, color }: any) => (
  <View style={[s.statCard, { borderColor: `${color}20` }]}>
    <Ionicons name={icon} size={18} color={color} />
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);
const SectionHead = ({ title, count, action }: any) => (
  <View style={s.sectionHeader}><Text style={s.sectionTitle}>{title}{count ? ` (${count})` : ''}</Text>{action && <TouchableOpacity onPress={action}><Text style={s.seeAll}>See All</Text></TouchableOpacity>}</View>
);

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12 },
  greeting: { fontSize: 13, color: C.textMuted },
  name: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  createText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  walletCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, padding: 20, backgroundColor: C.primary, borderRadius: 18 },
  walletLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  walletAmount: { color: '#fff', fontSize: 28, fontWeight: '800' },
  walletBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  walletBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: C.bgSoft, borderRadius: 12, padding: 12, alignItems: 'center', gap: 2, borderWidth: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 10, color: C.textMuted },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 4, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: '600' },
  card: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  amount: { fontSize: 17, fontWeight: '800', color: C.primary },
  cardTitle: { fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 20 },
  cardMeta: { fontSize: 12, color: C.textMuted, marginTop: 4 },
  actionHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  actionHintText: { fontSize: 12, color: C.textMuted },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 12, padding: 14, backgroundColor: '#FFF7ED', borderRadius: 12, borderWidth: 1, borderColor: '#FFEDD5' },
  alertText: { fontSize: 13, fontWeight: '600', color: '#9A3412', flex: 1 },
  tgBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, padding: 14, backgroundColor: '#E0F2FE', borderRadius: 14, borderWidth: 1, borderColor: '#BAE6FD' },
  tgIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center' },
  tgTitle: { fontSize: 14, fontWeight: '700', color: '#0C4A6E' },
  tgDesc: { fontSize: 12, color: '#075985', marginTop: 1 },
  promoBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 8, marginBottom: 12, padding: 18, backgroundColor: C.gold, borderRadius: 16 },
  promoTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  promoDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 10 },
  emptyDesc: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 4, paddingHorizontal: 40, marginBottom: 16 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
