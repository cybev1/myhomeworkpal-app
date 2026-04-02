import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { paymentsAPI } from '@/services/api';
import { useAuthStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5', gold: '#F59E0B', error: '#EF4444' };
const alert = (t: string, m: string) => { if (isWeb) window.alert(t + '\n' + m); else require('react-native').Alert.alert(t, m); };

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'transactions' | 'withdraw'>('overview');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchWallet = async () => {
    try {
      const [w, t] = await Promise.allSettled([paymentsAPI.wallet(), paymentsAPI.transactions()]);
      if (w.status === 'fulfilled') setWallet(w.value.data);
      if (t.status === 'fulfilled') setTxns(t.value.data.transactions || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchWallet(); }, []);

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmt);
    if (!amt || amt < 10) { alert('Invalid', 'Minimum withdrawal is $10'); return; }
    setWithdrawing(true);
    try {
      const { data } = await paymentsAPI.withdraw({ amount: amt, method: 'bank_transfer' });
      alert('Withdrawal Initiated', data.message || `$${amt.toFixed(2)} withdrawal processing.`);
      setWithdrawAmt('');
      fetchWallet();
    } catch (e: any) { alert('Error', e.response?.data?.detail || 'Withdrawal failed'); }
    finally { setWithdrawing(false); }
  };

  if (loading) return <View style={[s.page, s.center]}><ActivityIndicator size="large" color={C.primary} /></View>;

  const balance = wallet?.balance || 0;
  const escrow = wallet?.escrowBalance || 0;
  const available = wallet?.availableForWithdrawal ?? balance;
  const clearing = wallet?.pendingClearance || 0;

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={[s.headerTitle, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Balance card */}
      <View style={s.balanceCard}>
        <Text style={s.balLabel}>Total Balance</Text>
        <Text style={s.balAmount}>${balance.toFixed(2)}</Text>
        <View style={s.balRow}>
          <View style={s.balItem}><Text style={s.balItemLabel}>Escrow</Text><Text style={s.balItemVal}>${escrow.toFixed(2)}</Text></View>
          <View style={s.balDivider} />
          <View style={s.balItem}><Text style={s.balItemLabel}>Withdrawable</Text><Text style={[s.balItemVal, { color: C.accent }]}>${available.toFixed(2)}</Text></View>
          <View style={s.balDivider} />
          <View style={s.balItem}><Text style={s.balItemLabel}>Clearing</Text><Text style={s.balItemVal}>${clearing.toFixed(2)}</Text></View>
        </View>
        <View style={s.balActions}>
          <TouchableOpacity onPress={() => router.push('/add-funds')} style={s.balActionBtn}><Ionicons name="add-circle" size={18} color="#fff" /><Text style={s.balActionText}>Add Funds</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('withdraw')} style={[s.balActionBtn, { backgroundColor: C.accent }]}><Ionicons name="arrow-down-circle" size={18} color="#fff" /><Text style={s.balActionText}>Withdraw</Text></TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(['overview', 'transactions', 'withdraw'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {tab === 'overview' && (
          <>
            <View style={s.infoCard}>
              <Ionicons name="shield-checkmark" size={20} color={C.accent} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.infoTitle}>How payments work</Text>
                <Text style={s.infoText}>When you accept a bid, funds move from your wallet to escrow. After you approve the delivery, the helper receives payment minus the platform fee. Helpers have a {wallet?.clearanceDays || 14}-day clearance period before withdrawal.</Text>
              </View>
            </View>
            {clearing > 0 && (
              <View style={[s.infoCard, { borderColor: '#FDE68A' }]}>
                <Ionicons name="time" size={20} color={C.gold} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.infoTitle}>Funds in clearance</Text>
                  <Text style={s.infoText}>${clearing.toFixed(2)} from recent orders is in the {wallet?.clearanceDays || 14}-day clearance period and not yet available for withdrawal.</Text>
                </View>
              </View>
            )}
          </>
        )}

        {tab === 'transactions' && (
          txns.length === 0 ? <View style={s.center}><Ionicons name="receipt-outline" size={40} color={C.textMuted} /><Text style={{ color: C.textMuted, marginTop: 8 }}>No transactions yet</Text></View> :
          txns.map((t: any) => (
            <View key={t.id} style={s.txnCard}>
              <View style={[s.txnIcon, { backgroundColor: t.amount > 0 ? C.accentSoft : '#FEF2F2' }]}>
                <Ionicons name={t.amount > 0 ? 'arrow-down' : 'arrow-up'} size={16} color={t.amount > 0 ? C.accent : C.error} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.txnDesc}>{t.description}</Text>
                <Text style={s.txnDate}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}</Text>
              </View>
              <Text style={[s.txnAmount, { color: t.amount > 0 ? C.accent : C.error }]}>{t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}</Text>
            </View>
          ))
        )}

        {tab === 'withdraw' && (
          <>
            <Text style={s.wLabel}>Withdraw to your bank account</Text>
            <View style={s.wAmountBox}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: C.primary }}>$</Text>
              <TextInput value={withdrawAmt} onChangeText={setWithdrawAmt} placeholder="0.00" placeholderTextColor={C.textMuted} keyboardType="numeric" style={s.wInput} />
            </View>
            <Text style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Available: ${available.toFixed(2)} · Min $10</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {[25, 50, 100, 'All'].map(a => (
                <TouchableOpacity key={String(a)} onPress={() => setWithdrawAmt(a === 'All' ? available.toFixed(2) : String(a))} style={s.wQuick}>
                  <Text style={s.wQuickText}>{a === 'All' ? 'All' : `$${a}`}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleWithdraw} disabled={withdrawing} style={s.wBtn}>
              {withdrawing ? <ActivityIndicator color="#fff" /> : <><Ionicons name="arrow-down-circle" size={18} color="#fff" /><Text style={s.wBtnText}>Withdraw ${parseFloat(withdrawAmt || '0').toFixed(2)}</Text></>}
            </TouchableOpacity>
            <View style={[s.infoCard, { marginTop: 16 }]}>
              <Ionicons name="information-circle" size={18} color={C.primary} />
              <Text style={[s.infoText, { flex: 1, marginLeft: 8 }]}>Withdrawals are processed within 1-3 business days. Funds in clearance cannot be withdrawn.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  balanceCard: { margin: 20, backgroundColor: C.primary, borderRadius: 20, padding: 24 },
  balLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  balAmount: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4 },
  balRow: { flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12 },
  balItem: { flex: 1, alignItems: 'center' },
  balItemLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  balItemVal: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  balDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  balActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  balActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, borderRadius: 12 },
  balActionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: C.bgSoft, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  tabTextActive: { color: C.primary },
  infoCard: { backgroundColor: C.bgSoft, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', marginBottom: 12 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  infoText: { fontSize: 12, color: C.textMuted, lineHeight: 18, marginTop: 2 },
  txnCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  txnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txnDesc: { fontSize: 14, fontWeight: '500', color: C.text },
  txnDate: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  txnAmount: { fontSize: 16, fontWeight: '700' },
  wLabel: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  wAmountBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft, borderRadius: 16, borderWidth: 2, borderColor: C.primary, paddingHorizontal: 20, height: 64, marginBottom: 8 },
  wInput: { flex: 1, fontSize: 28, fontWeight: '800', color: C.text, marginLeft: 8, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  wQuick: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 100, backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border },
  wQuickText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  wBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 14, height: 54 },
  wBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
