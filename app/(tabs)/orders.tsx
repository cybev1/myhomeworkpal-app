import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ordersAPI, tasksAPI } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', gold: '#F59E0B', cyan: '#06B6D4' };

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      // Try orders endpoint first, fallback to my tasks
      try {
        const { data } = await ordersAPI.list();
        setOrders(data.orders || data || []);
      } catch {
        const { data } = await tasksAPI.myTasks();
        setOrders(data.tasks || data || []);
      }
    } catch (e) {
      console.log('Orders fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { open: C.accent, in_progress: C.cyan, delivered: C.gold, completed: C.accent, cancelled: '#EF4444' };
    return map[s] || C.textMuted;
  };

  return (
    <ScrollView
      style={s.page}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      <View style={s.header}>
        <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>My Orders</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/create-task')}><Ionicons name="add" size={22} color="#fff" /></TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadWrap}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : orders.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="briefcase-outline" size={40} color={C.textMuted} />
          <Text style={s.emptyTitle}>No orders yet</Text>
          <Text style={s.emptyDesc}>Your orders will appear here once you accept a bid or get hired</Text>
        </View>
      ) : (
        orders.map((o: any) => (
          <TouchableOpacity key={o.id || o._id} style={s.card} onPress={() => router.push(`/order/${o.id || o._id}`)}>
            <View style={s.cardTop}>
              <View style={[s.statusBadge, { backgroundColor: `${statusColor(o.status)}12` }]}>
                <View style={[s.statusDot, { backgroundColor: statusColor(o.status) }]} />
                <Text style={[s.statusText, { color: statusColor(o.status) }]}>
                  {(o.status || 'open').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Text>
              </View>
              <Text style={s.budget}>${o.budget || o.amount || 0}</Text>
            </View>
            <Text style={s.cardTitle}>{o.title}</Text>
            <View style={s.cardBot}>
              {o.helper?.name && (
                <View style={s.helperRow}>
                  <View style={s.helperAv}><Text style={s.helperIn}>{o.helper.name[0]}</Text></View>
                  <Text style={s.helperName}>{o.helper.name}</Text>
                </View>
              )}
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
  title: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  addBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },

  loadWrap: { paddingVertical: 60, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 12 },
  emptyDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', marginTop: 4, paddingHorizontal: 40 },

  card: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  budget: { fontSize: 17, fontWeight: '800', color: C.primary },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 22, marginBottom: 10 },
  cardBot: { flexDirection: 'row', alignItems: 'center' },
  helperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  helperAv: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  helperIn: { color: '#fff', fontSize: 12, fontWeight: '700' },
  helperName: { fontSize: 13, color: C.textSoft, fontWeight: '500' },
});
