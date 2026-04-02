import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore, useTaskStore } from '@/context/stores';
import { ordersAPI, bidsAPI, paymentsAPI, api } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5', gold: '#F59E0B', cyan: '#06B6D4', error: '#EF4444' };

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { tasks, fetchTasks } = useTaskStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isHelper = user?.role === 'helper';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

  const fetchAll = async () => {
    try {
      await fetchTasks({ limit: 10 });
      await Promise.allSettled([
        ordersAPI.list().then(r => setOrders(r.data.orders || r.data || [])),
        paymentsAPI.wallet().then(r => setWallet(r.data)),
        isHelper ? bidsAPI.myBids().then(r => setMyBids(r.data.bids || r.data || [])) : Promise.resolve(),
        api.get('/schools', { params: { limit: 10 } }).then(r => setSchools(r.data.schools || [])).catch(() => {}),
      ]);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  const activeOrders = orders.filter(o => ['active', 'delivered', 'revision'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');
  const pendingBids = myBids.filter(b => b.status === 'pending');
  const sc = (st: string) => ({ open: C.accent, active: C.cyan, delivered: C.gold, completed: C.accent, revision: '#F97316', pending: C.gold, in_progress: C.cyan }[st] || C.textMuted);

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>{greeting()}</Text>
          <Text style={[s.name, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>{user?.name || 'User'}</Text>
          <Text style={s.rolePill}>{isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : isHelper ? 'Expert' : 'Student'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile/edit')} style={s.avatarBtn}>
          <View style={s.avatar}><Text style={s.avatarText}>{user?.name?.[0] || 'U'}</Text></View>
        </TouchableOpacity>
      </View>

      {/* Wallet card */}
      <View style={s.walletCard}>
        <View style={{ flex: 1 }}>
          <Text style={s.walletLabel}>{isHelper ? 'Available Earnings' : 'Wallet Balance'}</Text>
          <Text style={s.walletAmount}>${(wallet?.balance || 0).toFixed(2)}</Text>
          <View style={s.walletMeta}>
            <Text style={s.walletMetaText}>Escrow: ${(wallet?.escrowBalance || 0).toFixed(2)}</Text>
            {isHelper && <Text style={s.walletMetaText}> · Clearing: ${(wallet?.pendingClearance || 0).toFixed(2)}</Text>}
          </View>
        </View>
        <View style={{ gap: 6 }}>
          {!isHelper && <TouchableOpacity onPress={() => router.push('/add-funds')} style={s.walletBtn}><Ionicons name="add-circle" size={14} color="#fff" /><Text style={s.walletBtnText}>Add Funds</Text></TouchableOpacity>}
          <TouchableOpacity onPress={() => router.push('/payment')} style={[s.walletBtn, isHelper ? {} : { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name={isHelper ? 'arrow-down-circle' : 'wallet'} size={14} color="#fff" />
            <Text style={s.walletBtnText}>{isHelper ? 'Withdraw' : 'Wallet'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        {isHelper ? (
          <>
            <Stat icon="paper-plane" label="Bids" value={pendingBids.length} color={C.gold} />
            <Stat icon="briefcase" label="Active" value={activeOrders.length} color={C.cyan} />
            <Stat icon="checkmark-circle" label="Done" value={completedOrders.length} color={C.accent} />
            <Stat icon="star" label="Rating" value={user?.rating?.toFixed(1) || '—'} color={C.gold} />
          </>
        ) : (
          <>
            <Stat icon="document" label="Tasks" value={tasks.length} color={C.primary} />
            <Stat icon="briefcase" label="Active" value={activeOrders.length} color={C.cyan} />
            <Stat icon="checkmark-circle" label="Done" value={completedOrders.length} color={C.accent} />
            <Stat icon="star" label="Rating" value={user?.rating?.toFixed(1) || '—'} color={C.gold} />
          </>
        )}
      </View>

      {/* ═══ QUICK ACTIONS GRID — the key buttons ═══ */}
      <Text style={[s.sectionTitle, { paddingHorizontal: 20 }]}>Quick Actions</Text>
      <View style={s.actionsGrid}>
        {/* Role-specific primary actions */}
        {!isHelper && <QA icon="add-circle" label="Post Task" color={C.primary} onPress={() => router.push('/create-task')} />}
        {!isHelper && <QA icon="people" label="Find Experts" color={C.cyan} onPress={() => router.push('/(tabs)/explore')} />}
        {isHelper && <QA icon="search" label="Find Tasks" color={C.primary} onPress={() => router.push('/(tabs)/explore')} />}
        {isHelper && <QA icon="megaphone" label="Promote" color={C.gold} onPress={() => router.push('/promote')} />}

        {/* Common actions */}
        <QA icon="briefcase" label="My Orders" color={C.cyan} onPress={() => router.push('/(tabs)/orders')} />
        <QA icon="chatbubbles" label="Messages" color={C.accent} onPress={() => router.push('/(tabs)/messages')} />
        <QA icon="wallet" label={isHelper ? 'Earnings' : 'Wallet'} color="#8B5CF6" onPress={() => router.push('/payment')} />
        <QA icon="person" label="Profile" color={C.textSoft} onPress={() => router.push('/profile/edit')} />

        {/* Growth */}
        {isHelper && <QA icon="school" label="Schools" color={C.primary} onPress={() => router.push('/schools')} />}
        <QA icon="paper-plane" label="Telegram" color="#0EA5E9" onPress={() => { if (isWeb) window.open('https://t.me/MyHomeworkPalBot', '_blank'); }} />
        {!user?.verified && <QA icon="flash" label="Go Pro" color={C.gold} onPress={() => router.push('/upgrade')} />}
        <QA icon="help-circle" label="Help" color={C.textMuted} onPress={() => router.push('/help')} />

        {/* Admin */}
        {isAdmin && <QA icon="settings" label="Admin" color={C.error} onPress={() => router.push('/admin')} />}
        {isAdmin && <QA icon="school" label="Schools" color={C.cyan} onPress={() => router.push('/schools')} />}
      </View>

      {/* Telegram banner for students */}
      {!isHelper && (
        <TouchableOpacity onPress={() => { if (isWeb) window.open('https://t.me/MyHomeworkPalBot', '_blank'); }} style={s.tgBanner}>
          <View style={s.tgIcon}><Ionicons name="paper-plane" size={18} color="#fff" /></View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.tgTitle}>Use Telegram?</Text>
            <Text style={s.tgDesc}>Post tasks instantly from Telegram — no forms needed!</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#0284C7" />
        </TouchableOpacity>
      )}

      {/* Revision alert */}
      {orders.filter(o => o.status === 'revision').length > 0 && (
        <View style={s.alertBanner}><Ionicons name="alert-circle" size={18} color="#F97316" /><Text style={s.alertText}>{orders.filter(o => o.status === 'revision').length} order(s) need revision</Text></View>
      )}

      {/* Delivered orders needing review (students) */}
      {!isHelper && orders.filter(o => o.status === 'delivered').length > 0 && (
        <View style={[s.alertBanner, { backgroundColor: C.accentSoft, borderColor: '#D1FAE5' }]}><Ionicons name="checkmark-circle" size={18} color={C.accent} /><Text style={[s.alertText, { color: '#065F46' }]}>{orders.filter(o => o.status === 'delivered').length} delivery ready to review</Text></View>
      )}

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <>
          <SH title="Active Orders" count={activeOrders.length} action={() => router.push('/(tabs)/orders')} />
          {activeOrders.slice(0, 3).map(o => (
            <TouchableOpacity key={o.id} style={s.card} onPress={() => router.push(`/order/${o.id}`)}>
              <View style={s.cardTop}><View style={[s.badge, { backgroundColor: `${sc(o.status)}12` }]}><View style={[s.dot, { backgroundColor: sc(o.status) }]} /><Text style={[s.badgeText, { color: sc(o.status) }]}>{o.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text></View><Text style={s.amount}>${o.amount}</Text></View>
              <Text style={s.cardTitle}>{o.title || `Order #${o.id?.slice(0, 8)}`}</Text>
              <Text style={s.cardMeta}>{(isHelper ? o.studentName : o.helperName) || 'User'} · Due {o.deliveryDeadline ? new Date(o.deliveryDeadline).toLocaleDateString() : 'Flexible'}</Text>
              {o.status === 'delivered' && !isHelper && <View style={s.hint}><Ionicons name="checkmark-circle" size={12} color={C.accent} /><Text style={s.hintText}>Tap to approve</Text></View>}
              {o.status === 'active' && isHelper && <View style={s.hint}><Ionicons name="paper-plane" size={12} color={C.cyan} /><Text style={s.hintText}>Tap to deliver</Text></View>}
              {o.status === 'revision' && <View style={s.hint}><Ionicons name="refresh" size={12} color="#F97316" /><Text style={[s.hintText, { color: '#F97316' }]}>Revision needed</Text></View>}
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Helper: pending bids */}
      {isHelper && pendingBids.length > 0 && (
        <>
          <SH title="Pending Bids" count={pendingBids.length} />
          {pendingBids.slice(0, 3).map(b => (
            <TouchableOpacity key={b.id} style={s.card} onPress={() => router.push(`/task/${b.taskId}`)}>
              <View style={s.cardTop}><View style={[s.badge, { backgroundColor: `${C.gold}12` }]}><Text style={[s.badgeText, { color: C.gold }]}>Pending</Text></View><Text style={s.amount}>${b.amount}</Text></View>
              <Text style={s.cardMeta}>{b.deliveryDays}d delivery</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Schools with Telegram (helpers) */}
      {isHelper && schools.filter(sc => sc.telegramChannel || sc.telegramGroup).length > 0 && (
        <>
          <SH title="Schools to Target" action={() => router.push('/schools')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 12 }}>
            {schools.filter(sc => sc.telegramChannel || sc.telegramGroup).slice(0, 8).map(sc => (
              <TouchableOpacity key={sc.id} onPress={() => {
                const url = sc.telegramChannel || sc.telegramGroup;
                const link = url.startsWith('http') ? url : 'https://t.me/' + url.replace('@', '');
                if (isWeb) window.open(link, '_blank'); else Linking.openURL(link);
              }} style={sch.card}>
                <View style={sch.iconWrap}><Ionicons name="school" size={16} color={C.primary} /></View>
                <Text style={sch.name} numberOfLines={1}>{sc.shortName || sc.name}</Text>
                <View style={sch.joinPill}><Ionicons name="paper-plane" size={10} color="#fff" /><Text style={sch.joinText}>Join</Text></View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Tasks (students see theirs, helpers see latest open) */}
      <SH title={isHelper ? 'Latest Tasks' : 'My Tasks'} count={tasks.length} action={() => router.push('/(tabs)/explore')} />
      {loading && tasks.length === 0 ? <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View> :
      tasks.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name={isHelper ? 'briefcase-outline' : 'document-outline'} size={36} color={C.textMuted} />
          <Text style={s.emptyTitle}>{isHelper ? 'No tasks available' : 'No tasks yet'}</Text>
          <Text style={s.emptyDesc}>{isHelper ? 'Check back soon or browse Explore' : 'Post your first task to get started'}</Text>
          {!isHelper && <TouchableOpacity onPress={() => router.push('/create-task')} style={s.emptyBtn}><Text style={s.emptyBtnText}>Post a Task</Text></TouchableOpacity>}
        </View>
      ) : tasks.slice(0, 4).map((t: any) => (
        <TouchableOpacity key={t.id} style={s.card} onPress={() => router.push(`/task/${t.id}`)}>
          <View style={s.cardTop}><View style={[s.badge, { backgroundColor: `${sc(t.status)}12` }]}><View style={[s.dot, { backgroundColor: sc(t.status) }]} /><Text style={[s.badgeText, { color: sc(t.status) }]}>{(t.status || 'open').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text></View><Text style={s.amount}>${t.budget}</Text></View>
          <Text style={s.cardTitle}>{t.title}</Text>
          <Text style={s.cardMeta}>{t.bidsCount || 0} bids · {t.category}</Text>
        </TouchableOpacity>
      ))}

      {/* Helper promote banner */}
      {isHelper && (
        <TouchableOpacity onPress={() => router.push('/promote')} style={s.promoBanner}>
          <Ionicons name="megaphone" size={22} color="#fff" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.promoTitle}>Get more students</Text>
            <Text style={s.promoDesc}>Share on social media, join school channels</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ═══ Components ═══
const QA = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={qa.box}>
    <View style={[qa.iconWrap, { backgroundColor: `${color}12` }]}><Ionicons name={icon} size={20} color={color} /></View>
    <Text style={qa.label}>{label}</Text>
  </TouchableOpacity>
);
const qa = StyleSheet.create({
  box: { width: '23%', alignItems: 'center', paddingVertical: 12, gap: 4 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600', color: C.textSoft, textAlign: 'center' },
});

const Stat = ({ icon, label, value, color }: any) => (
  <View style={[s.statCard, { borderColor: `${color}20` }]}>
    <Ionicons name={icon} size={16} color={color} />
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const SH = ({ title, count, action }: any) => (
  <View style={s.sectionHeader}><Text style={s.sectionTitle}>{title}{count ? ` (${count})` : ''}</Text>{action && <TouchableOpacity onPress={action}><Text style={s.seeAll}>See All</Text></TouchableOpacity>}</View>
);

const sch = StyleSheet.create({
  card: { width: 90, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, gap: 5 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 10, fontWeight: '600', color: C.text, textAlign: 'center' },
  joinPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#0EA5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  joinText: { fontSize: 9, fontWeight: '600', color: '#fff' },
});

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12 },
  greeting: { fontSize: 13, color: C.textMuted },
  name: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  rolePill: { fontSize: 11, fontWeight: '600', color: C.primary, marginTop: 2 },
  avatarBtn: { marginLeft: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },

  walletCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, padding: 18, backgroundColor: C.primary, borderRadius: 18 },
  walletLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  walletAmount: { color: '#fff', fontSize: 26, fontWeight: '800' },
  walletMeta: { flexDirection: 'row', marginTop: 2 },
  walletMetaText: { color: 'rgba(255,255,255,0.45)', fontSize: 10 },
  walletBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  walletBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 6, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: C.bgSoft, borderRadius: 10, padding: 10, alignItems: 'center', gap: 1, borderWidth: 1 },
  statValue: { fontSize: 16, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 9, color: C.textMuted },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, marginBottom: 8 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 4, marginBottom: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: '600' },

  card: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  amount: { fontSize: 16, fontWeight: '800', color: C.primary },
  cardTitle: { fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 20 },
  cardMeta: { fontSize: 11, color: C.textMuted, marginTop: 3 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: C.border },
  hintText: { fontSize: 11, color: C.textMuted },

  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 8, padding: 12, backgroundColor: '#FFF7ED', borderRadius: 10, borderWidth: 1, borderColor: '#FFEDD5' },
  alertText: { fontSize: 12, fontWeight: '600', color: '#9A3412', flex: 1 },

  tgBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8, padding: 12, backgroundColor: '#E0F2FE', borderRadius: 12, borderWidth: 1, borderColor: '#BAE6FD' },
  tgIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center' },
  tgTitle: { fontSize: 13, fontWeight: '700', color: '#0C4A6E' },
  tgDesc: { fontSize: 11, color: '#075985' },

  promoBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 4, marginBottom: 8, padding: 16, backgroundColor: C.gold, borderRadius: 14 },
  promoTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  promoDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 1 },

  emptyBox: { alignItems: 'center', paddingVertical: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginTop: 8 },
  emptyDesc: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 3, paddingHorizontal: 40, marginBottom: 12 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
