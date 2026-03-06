import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/context/stores';
const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', error: '#EF4444' };

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const u = user || { name: 'Demo Student', email: 'demo@example.com', role: 'student' };
  const menus = [
    { section: 'Account', items: [
      { icon: 'person-outline', label: 'Edit Profile' }, { icon: 'wallet-outline', label: 'Wallet & Earnings' },
      { icon: 'card-outline', label: 'Payment Methods' }, { icon: 'star-outline', label: 'My Reviews' },
    ]},
    { section: 'Support', items: [
      { icon: 'help-circle-outline', label: 'Help Center' }, { icon: 'chatbubble-outline', label: 'Contact Support' },
      { icon: 'shield-checkmark-outline', label: 'Trust & Safety' }, { icon: 'document-outline', label: 'Terms & Privacy' },
    ]},
  ];
  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Account</Text>
      </View>
      <View style={s.profileCard}>
        <View style={s.av}><Text style={s.avText}>{u.name[0]}</Text></View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.profileName}>{u.name}</Text>
          <Text style={s.profileEmail}>{u.email}</Text>
        </View>
        <TouchableOpacity style={s.editBtn}><Ionicons name="create-outline" size={18} color={C.primary} /></TouchableOpacity>
      </View>
      {/* Wallet preview */}
      <View style={s.walletCard}>
        <Text style={s.walletLabel}>Balance</Text>
        <Text style={s.walletAmt}>$234.50</Text>
        <View style={s.walletActions}>
          <TouchableOpacity style={s.walletBtn}><Text style={s.walletBtnText}>Add Funds</Text></TouchableOpacity>
          <TouchableOpacity style={s.walletBtnAlt}><Text style={s.walletBtnAltText}>Withdraw</Text></TouchableOpacity>
        </View>
      </View>
      {menus.map((m) => (
        <View key={m.section}>
          <Text style={s.sectionHead}>{m.section}</Text>
          <View style={s.menuCard}>
            {m.items.map((item, i) => (
              <TouchableOpacity key={item.label} style={[s.menuItem, i < m.items.length - 1 && s.menuBorder]}>
                <View style={s.menuIconWrap}><Ionicons name={item.icon as any} size={20} color={C.primary} /></View>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      <TouchableOpacity style={s.logoutBtn} onPress={() => logout()}>
        <Ionicons name="log-out-outline" size={20} color={C.error} />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>
      <Text style={s.version}>MyHomeworkPal v2.0.0</Text>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: C.text },
  profileCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, padding: 16, backgroundColor: C.bgSoft, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  av: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileName: { fontSize: 17, fontWeight: '700', color: C.text },
  profileEmail: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  walletCard: { marginHorizontal: 20, marginBottom: 20, padding: 20, backgroundColor: C.primary, borderRadius: 18 },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  walletAmt: { fontSize: 32, fontWeight: '800', color: '#fff', marginVertical: 4 },
  walletActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  walletBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  walletBtnText: { fontSize: 14, fontWeight: '700', color: C.primary },
  walletBtnAlt: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  walletBtnAltText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  sectionHead: { fontSize: 12, fontWeight: '700', color: C.textMuted, letterSpacing: 1, paddingHorizontal: 24, marginBottom: 6, marginTop: 12 },
  menuCard: { marginHorizontal: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: C.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  logoutText: { fontSize: 15, fontWeight: '600', color: C.error },
  version: { textAlign: 'center', fontSize: 12, color: C.textMuted, marginTop: 16 },
});
