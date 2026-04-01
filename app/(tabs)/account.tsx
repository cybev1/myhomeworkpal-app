import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/context/stores';
import { paymentsAPI } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', error: '#EF4444' };

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const u = user || { name: 'Student', email: 'user@example.com', role: 'student' };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await paymentsAPI.wallet();
        setWalletBalance(data.balance ?? 0);
      } catch {}
    })();
  }, []);

  const handleLogout = async () => {
    // Alert.alert doesn't work on web — use confirm() instead
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to sign out?')
      : await new Promise((resolve) => {
          Alert.alert('Logout', 'Are you sure you want to sign out?', [
            { text: 'Cancel', onPress: () => resolve(false) },
            { text: 'Sign Out', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    if (confirmed) {
      await logout();
      if (Platform.OS === 'web') {
        window.location.href = '/';  // Hard redirect on web (most reliable)
      } else {
        router.replace('/');
      }
    }
  };

  const menus = [
    { section: 'Account', items: [
      { icon: 'person-outline', label: 'Edit Profile', onPress: () => {} },
      { icon: 'wallet-outline', label: 'Wallet & Earnings', onPress: () => router.push('/payment') },
      { icon: 'card-outline', label: 'Payment Methods', onPress: () => {} },
      { icon: 'star-outline', label: 'My Reviews', onPress: () => {} },
    ]},
    { section: 'Support', items: [
      ...(user?.role === 'admin' || user?.role === 'superadmin' ? [{ icon: 'settings-outline', label: 'Admin Panel', onPress: () => router.push('/admin') }] : []),
      { icon: 'help-circle-outline', label: 'Help Center', onPress: () => {} },
      { icon: 'chatbubble-outline', label: 'Contact Support', onPress: () => {} },
      { icon: 'shield-checkmark-outline', label: 'Trust & Safety', onPress: () => {} },
      { icon: 'document-outline', label: 'Terms & Privacy', onPress: () => router.push('/privacy') },
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
          <Text style={s.name}>{u.name}</Text>
          <Text style={s.email}>{u.email}</Text>
          <View style={s.roleRow}>
            <View style={[s.roleBadge, u.role === 'helper' && { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
              <Text style={[s.roleText, u.role === 'helper' && { color: C.accent }]}>
                {u.role === 'helper' ? 'Expert Helper' : 'Student'}
              </Text>
            </View>
            {walletBalance !== null && (
              <Text style={s.balance}>${walletBalance.toFixed(2)}</Text>
            )}
          </View>
        </View>
      </View>

      {menus.map((section) => (
        <View key={section.section} style={s.section}>
          <Text style={s.sectionTitle}>{section.section}</Text>
          {section.items.map((item) => (
            <TouchableOpacity key={item.label} style={s.menuItem} onPress={item.onPress}>
              <View style={s.menuIcon}>
                <Ionicons name={item.icon as any} size={20} color={C.primary} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={C.error} />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={s.version}>MyHomeworkPal v2.1.0</Text>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  profileCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 18, backgroundColor: C.bgSoft, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
  av: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  name: { fontSize: 17, fontWeight: '700', color: C.text },
  email: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100, backgroundColor: C.primarySoft, borderWidth: 1, borderColor: '#DDD8FF' },
  roleText: { fontSize: 11, fontWeight: '600', color: C.primary },
  balance: { fontSize: 15, fontWeight: '800', color: C.accent },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.textMuted, paddingHorizontal: 20, marginBottom: 6, letterSpacing: 0.5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', gap: 8 },
  logoutText: { fontSize: 15, fontWeight: '600', color: C.error },
  version: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 20 },
});
