import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { paymentsAPI } from '@/services/api';
import { useAuthStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5', gold: '#F59E0B', error: '#EF4444' };
const alert = (t: string, m: string, onOk?: () => void) => { if (isWeb) { window.alert(t + '\n' + m); onOk?.(); } else require('react-native').Alert.alert(t, m, onOk ? [{ text: 'OK', onPress: onOk }] : undefined); };

const AMOUNTS = [25, 50, 100, 200, 500];

export default function AddFundsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('50');
  const [method, setMethod] = useState<'stripe' | 'flutterwave'>('stripe');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const num = parseFloat(amount);
    if (!num || num < 5) { alert('Invalid', 'Minimum deposit is $5'); return; }
    if (num > 10000) { alert('Invalid', 'Maximum deposit is $10,000'); return; }

    setLoading(true);
    try {
      const { data } = await paymentsAPI.fundWallet({ amount: num, method, currency: 'USD' });

      if (data.demo) {
        // Demo mode — funds added instantly
        alert('Funds Added!', `$${num.toFixed(2)} has been added to your wallet.`, () => router.back());
      } else if (data.url) {
        // Redirect to payment page
        if (isWeb) {
          window.location.href = data.url;
        } else {
          await Linking.openURL(data.url);
        }
      }
    } catch (err: any) {
      alert('Payment Failed', err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={s.headerTitle}>Add Funds</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.content}>
        {/* Current balance */}
        <View style={s.balanceCard}>
          <Ionicons name="wallet-outline" size={22} color={C.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={s.balanceLabel}>Current Balance</Text>
            <Text style={s.balanceAmount}>${((user as any)?.balance || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Amount input */}
        <Text style={s.label}>How much do you want to add?</Text>
        <View style={s.amountInput}>
          <Text style={s.dollarSign}>$</Text>
          <TextInput value={amount} onChangeText={setAmount} placeholder="50" placeholderTextColor={C.textMuted} keyboardType="numeric" style={s.amountField} />
        </View>

        {/* Quick amounts */}
        <View style={s.quickRow}>
          {AMOUNTS.map(a => (
            <TouchableOpacity key={a} onPress={() => setAmount(String(a))} style={[s.quickBtn, amount === String(a) && s.quickBtnActive]}>
              <Text style={[s.quickText, amount === String(a) && s.quickTextActive]}>${a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment method */}
        <Text style={s.label}>Payment Method</Text>
        <TouchableOpacity onPress={() => setMethod('stripe')} style={[s.methodCard, method === 'stripe' && s.methodActive]}>
          <View style={[s.methodIcon, { backgroundColor: '#635BFF15' }]}><Ionicons name="card" size={22} color="#635BFF" /></View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.methodName}>Credit / Debit Card</Text>
            <Text style={s.methodDesc}>Visa, Mastercard, Amex via Stripe</Text>
          </View>
          <View style={[s.radio, method === 'stripe' && s.radioActive]}>{method === 'stripe' && <View style={s.radioDot} />}</View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMethod('flutterwave')} style={[s.methodCard, method === 'flutterwave' && s.methodActive]}>
          <View style={[s.methodIcon, { backgroundColor: '#FB990015' }]}><Ionicons name="phone-portrait" size={22} color="#FB9900" /></View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.methodName}>Mobile Money / Bank</Text>
            <Text style={s.methodDesc}>M-Pesa, MTN MoMo, Bank Transfer via Flutterwave</Text>
          </View>
          <View style={[s.radio, method === 'flutterwave' && s.radioActive]}>{method === 'flutterwave' && <View style={s.radioDot} />}</View>
        </TouchableOpacity>

        {/* Security note */}
        <View style={s.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color={C.accent} />
          <Text style={s.securityText}>Payments are encrypted and secure. Funds are added instantly after payment confirmation.</Text>
        </View>

        {/* Pay button */}
        <TouchableOpacity onPress={handlePay} disabled={loading} style={[s.payBtn, loading && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <><Ionicons name="lock-closed" size={18} color="#fff" /><Text style={s.payBtnText}>Pay ${parseFloat(amount || '0').toFixed(2)}</Text></>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  content: { padding: 20 },
  balanceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primarySoft, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: C.primary + '20' },
  balanceLabel: { fontSize: 12, color: C.textMuted },
  balanceAmount: { fontSize: 24, fontWeight: '800', color: C.primary },
  label: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 10 },
  amountInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft, borderRadius: 16, borderWidth: 2, borderColor: C.primary, paddingHorizontal: 20, height: 64, marginBottom: 12 },
  dollarSign: { fontSize: 28, fontWeight: '800', color: C.primary },
  amountField: { flex: 1, fontSize: 28, fontWeight: '800', color: C.text, marginLeft: 8, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  quickBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 100, backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border },
  quickBtnActive: { backgroundColor: C.primarySoft, borderColor: C.primary },
  quickText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  quickTextActive: { color: C.primary },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: C.border, marginBottom: 10 },
  methodActive: { borderColor: C.primary, backgroundColor: C.primarySoft + '40' },
  methodIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  methodName: { fontSize: 15, fontWeight: '600', color: C.text },
  methodDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary },
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accentSoft, borderRadius: 12, padding: 14, marginTop: 16, marginBottom: 20, borderWidth: 1, borderColor: '#D1FAE5' },
  securityText: { flex: 1, fontSize: 12, color: '#065F46', lineHeight: 18 },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.primary, borderRadius: 14, height: 56 },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
