import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { paymentsAPI } from '@/services/api';
import { useAuthStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', gold: '#F59E0B' };
const alert = (t: string, m: string, onOk?: () => void) => { if (isWeb) { window.alert(t + '\n' + m); onOk?.(); } else require('react-native').Alert.alert(t, m, onOk ? [{ text: 'OK', onPress: onOk }] : undefined); };

const PERKS = [
  { icon: 'shield-checkmark', title: 'Verified Badge', desc: 'Stand out with a blue verified checkmark on your profile' },
  { icon: 'star', title: 'Priority Placement', desc: 'Appear at the top of search results and expert listings' },
  { icon: 'flash', title: 'Boosted Proposals', desc: 'Your bids get highlighted to students — 2x more visibility' },
  { icon: 'people', title: 'Hiring Assistant', desc: 'Access to admin support to help students hire and interview' },
  { icon: 'analytics', title: 'Advanced Analytics', desc: 'See detailed stats on your profile views, bid performance' },
  { icon: 'ribbon', title: 'Pro Support', desc: 'Priority customer support with faster response times' },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const isPro = user?.verified;

  const handleUpgrade = async () => {
    if (isPro) { alert('Already Pro', 'You already have a Pro account!'); return; }
    setLoading(true);
    try {
      const { data } = await paymentsAPI.fundWallet({ amount: 20, method: 'stripe', currency: 'USD' });
      if (data.demo) {
        alert('Upgraded!', 'You are now a Verified Pro member!', () => router.back());
      } else if (data.url) {
        if (isWeb) window.location.href = data.url;
      }
    } catch (e: any) {
      alert('Error', e.response?.data?.detail || 'Upgrade failed');
    } finally { setLoading(false); }
  };

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={s.headerTitle}>Upgrade to Pro</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.proBadge}><Ionicons name="shield-checkmark" size={40} color="#fff" /></View>
          <Text style={s.heroTitle}>MyHomeworkPal Pro</Text>
          <Text style={s.heroDesc}>Get verified, stand out, and earn more</Text>
          <View style={s.priceTag}><Text style={s.priceAmount}>$20</Text><Text style={s.pricePer}>one-time</Text></View>
        </View>

        {/* Perks */}
        {PERKS.map((p, i) => (
          <View key={i} style={s.perkCard}>
            <View style={s.perkIcon}><Ionicons name={p.icon as any} size={22} color={C.primary} /></View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.perkTitle}>{p.title}</Text>
              <Text style={s.perkDesc}>{p.desc}</Text>
            </View>
          </View>
        ))}

        {/* CTA */}
        {isPro ? (
          <View style={[s.ctaBtn, { backgroundColor: C.accent }]}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={s.ctaText}>You are a Pro Member</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={handleUpgrade} disabled={loading} style={s.ctaBtn}>
            {loading ? <ActivityIndicator color="#fff" /> : <>
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={s.ctaText}>Upgrade Now — $20</Text>
            </>}
          </TouchableOpacity>
        )}

        <Text style={s.guarantee}>30-day money back guarantee. Cancel anytime.</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  hero: { alignItems: 'center', paddingVertical: 32, backgroundColor: C.primarySoft, borderRadius: 20, borderWidth: 1, borderColor: C.primary + '20', marginBottom: 20 },
  proBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: C.text },
  heroDesc: { fontSize: 15, color: C.textMuted, marginTop: 4 },
  priceTag: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 16 },
  priceAmount: { fontSize: 36, fontWeight: '800', color: C.primary },
  pricePer: { fontSize: 14, color: C.textMuted },
  perkCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  perkIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  perkTitle: { fontSize: 15, fontWeight: '600', color: C.text },
  perkDesc: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.primary, borderRadius: 16, height: 58, marginTop: 20 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  guarantee: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 12 },
});
