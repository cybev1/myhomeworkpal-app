import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { paymentsAPI } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', error: '#EF4444' };

export default function PaymentScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [walletRes, txnRes] = await Promise.allSettled([
          paymentsAPI.wallet(),
          paymentsAPI.transactions(),
        ]);
        if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data);
        if (txnRes.status === 'fulfilled') setTxns(txnRes.value.data.transactions || txnRes.value.data || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const balance = wallet?.balance ?? 0;
  const escrow = wallet?.escrowBalance ?? 0;

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={20} color={C.textSoft} /></TouchableOpacity>
        <Text style={s.headerTitle}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.cardWrap}>
            <LinearGradient colors={['#4F46E5', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.walletCard}>
              <View style={s.cardTop}>
                <View style={s.cardChip}><Ionicons name="wallet" size={18} color="rgba(255,255,255,0.9)" /></View>
                <Text style={s.cardBrand}>MyHomeworkPal</Text>
              </View>
              <Text style={s.balLabel}>Available Balance</Text>
              <Text style={s.balAmount}>${balance.toFixed(2)}</Text>
              <View style={s.cardFooter}>
                <View><Text style={s.cardFieldLbl}>Escrow</Text><Text style={s.cardFieldVal}>${escrow.toFixed(2)}</Text></View>
                <View><Text style={s.cardFieldLbl}>Pending</Text><Text style={s.cardFieldVal}>$0.00</Text></View>
                <View><Text style={s.cardFieldLbl}>Currency</Text><Text style={s.cardFieldVal}>USD</Text></View>
              </View>
            </LinearGradient>
          </View>

          <View style={s.actionsRow}>
            <ActionBtn icon="add-circle" label="Add Funds" color={C.accent} />
            <ActionBtn icon="arrow-up-circle" label="Withdraw" color="#06B6D4" />
            <ActionBtn icon="swap-horizontal" label="Transfer" color="#F59E0B" />
            <ActionBtn icon="receipt" label="Invoices" color={C.primary} />
          </View>

          <View style={s.txHeader}><Text style={s.txTitle}>Recent Transactions</Text></View>
          {txns.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Ionicons name="receipt-outline" size={36} color={C.textMuted} />
              <Text style={{ color: C.textMuted, marginTop: 8, fontSize: 14 }}>No transactions yet</Text>
            </View>
          ) : (
            txns.map((tx: any, i: number) => (
              <View key={tx.id || i} style={s.txRow}>
                <View style={[s.txIcon, { backgroundColor: (tx.amount || 0) > 0 ? '#ECFDF5' : '#FEF2F2' }]}>
                  <Ionicons name={(tx.amount || 0) > 0 ? 'arrow-down' : 'arrow-up'} size={16} color={(tx.amount || 0) > 0 ? C.accent : C.error} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.txDesc}>{tx.description || tx.desc || 'Transaction'}</Text>
                  <Text style={s.txTime}>{tx.createdAt || tx.time || ''}</Text>
                </View>
                <Text style={[s.txAmt, { color: (tx.amount || 0) > 0 ? C.accent : C.text }]}>
                  {(tx.amount || 0) > 0 ? '+' : ''}${Math.abs(tx.amount || 0).toFixed(2)}
                </Text>
              </View>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const ActionBtn = ({ icon, label, color }: any) => (
  <TouchableOpacity style={s.actionBtn}>
    <View style={[s.actionIcon, { backgroundColor: `${color}10` }]}><Ionicons name={icon} size={22} color={color} /></View>
    <Text style={s.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  cardWrap: { paddingHorizontal: 20, paddingVertical: 12 },
  walletCard: { borderRadius: 20, padding: 24, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  cardChip: { width: 36, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  cardBrand: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  balLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  balAmount: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1, marginVertical: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cardFieldLbl: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  cardFieldVal: { fontSize: 15, fontWeight: '700', color: '#fff', marginTop: 2 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, paddingVertical: 16 },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '600', color: C.textSoft },
  txHeader: { paddingHorizontal: 20, marginBottom: 8 },
  txTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  txIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: 14, fontWeight: '600', color: C.text },
  txTime: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  txAmt: { fontSize: 15, fontWeight: '700' },
});
