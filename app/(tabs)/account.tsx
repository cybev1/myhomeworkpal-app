import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5', gold: '#F59E0B', error: '#EF4444' };

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isHelper = user?.role === 'helper';

  // Profile completion
  const hasName = !!user?.name;
  const hasBio = !!(user as any)?.bio;
  const hasSkills = !!(user as any)?.skills;
  const completionParts = [hasName, hasBio, hasSkills];
  const completionPercent = Math.round((completionParts.filter(Boolean).length / completionParts.length) * 100);

  const handleLogout = async () => {
    const confirmed = isWeb
      ? window.confirm('Are you sure you want to sign out?')
      : await new Promise<boolean>((resolve) => {
          require('react-native').Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', onPress: () => resolve(false) },
            { text: 'Sign Out', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    if (confirmed) {
      await logout();
      if (isWeb) window.location.href = '/';
      else router.replace('/');
    }
  };

  const MenuItem = ({ icon, label, onPress, badge, color }: any) => (
    <TouchableOpacity onPress={onPress} style={s.menuItem}>
      <Ionicons name={icon} size={20} color={color || C.textSoft} />
      <Text style={s.menuLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {badge && <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View>}
        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>
      {/* Profile header */}
      <View style={s.profileSection}>
        <View style={s.avatar}><Text style={s.avatarText}>{user?.name?.[0] || 'U'}</Text></View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[s.name, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>{user?.name || 'User'}</Text>
            {user?.verified && <Ionicons name="checkmark-circle" size={16} color={C.primary} />}
          </View>
          <Text style={s.email}>{user?.email}</Text>
          <Text style={s.role}>{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : isHelper ? 'Helper / Expert' : 'Student'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile/edit')} style={s.editBtn}>
          <Ionicons name="create-outline" size={18} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Profile completion (helpers) */}
      {isHelper && completionPercent < 100 && (
        <TouchableOpacity onPress={() => router.push('/profile/edit')} style={s.completionCard}>
          <View style={s.completionTop}>
            <Text style={s.completionTitle}>Complete your profile</Text>
            <Text style={s.completionPercent}>{completionPercent}%</Text>
          </View>
          <View style={s.progressBar}><View style={[s.progressFill, { width: `${completionPercent}%` }]} /></View>
          <Text style={s.completionHint}>Helpers with complete profiles get 3x more bids</Text>
        </TouchableOpacity>
      )}

      {/* Pro upgrade banner */}
      {!user?.verified && (
        <TouchableOpacity onPress={() => router.push('/upgrade')} style={s.proCard}>
          <View style={s.proIcon}><Ionicons name="flash" size={22} color="#fff" /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.proTitle}>Upgrade to Pro</Text>
            <Text style={s.proDesc}>Get verified badge, priority placement & more</Text>
          </View>
          <View style={s.proPill}><Text style={s.proPillText}>$20</Text></View>
        </TouchableOpacity>
      )}

      {/* Menu sections */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/profile/edit')} />
        <MenuItem icon="wallet-outline" label="Wallet & Payments" onPress={() => router.push('/payment')} />
        <MenuItem icon="add-circle-outline" label="Add Funds" onPress={() => router.push('/add-funds')} />
        {isHelper && <MenuItem icon="cash-outline" label="Withdraw Earnings" onPress={() => router.push('/payment')} />}
      </View>

      {isHelper && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Work</Text>
          <MenuItem icon="briefcase-outline" label="Active Orders" onPress={() => router.push('/(tabs)/orders')} />
          <MenuItem icon="paper-plane-outline" label="My Proposals" onPress={() => router.push('/(tabs)/orders')} />
          <MenuItem icon="search-outline" label="Find Work" onPress={() => router.push('/(tabs)/explore')} />
        </View>
      )}

      {!isHelper && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Hiring</Text>
          <MenuItem icon="add-outline" label="Post a Task" onPress={() => router.push('/create-task')} />
          <MenuItem icon="briefcase-outline" label="My Orders" onPress={() => router.push('/(tabs)/orders')} />
          <MenuItem icon="people-outline" label="Find Experts" onPress={() => router.push('/(tabs)/explore')} />
        </View>
      )}

      {isAdmin && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Administration</Text>
          <MenuItem icon="settings-outline" label="Admin Panel" onPress={() => router.push('/admin')} badge="Admin" color={C.primary} />
        </View>
      )}

      <View style={s.section}>
        <Text style={s.sectionTitle}>Support</Text>
        <MenuItem icon="help-circle-outline" label="Help Center" onPress={() => router.push('/help')} />
        <MenuItem icon="document-outline" label="Terms & Privacy" onPress={() => router.push('/privacy')} />
        <MenuItem icon="chatbubble-outline" label="Contact Support" onPress={() => router.push('/help')} />
        <MenuItem icon="school-outline" label="Schools Directory" onPress={() => router.push('/schools')} />
        <MenuItem icon="paper-plane-outline" label="Telegram Bot" onPress={() => { if (isWeb) window.open('https://t.me/MyHomeworkPalBot', '_blank'); }} />
      </View>

      <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
        <Ionicons name="log-out-outline" size={20} color={C.error} />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={{ textAlign: 'center', color: C.textMuted, fontSize: 12, marginTop: 12, marginBottom: 40 }}>MyHomeworkPal v1.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'ios' ? 56 : 44 },
  profileSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', color: C.text },
  email: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  role: { fontSize: 12, fontWeight: '600', color: C.primary, marginTop: 2 },
  editBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  completionCard: { margin: 20, marginBottom: 0, backgroundColor: C.accentSoft, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#D1FAE5' },
  completionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  completionPercent: { fontSize: 15, fontWeight: '700', color: C.accent },
  progressBar: { height: 6, backgroundColor: '#D1FAE5', borderRadius: 3, marginTop: 8, marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: C.accent, borderRadius: 3 },
  completionHint: { fontSize: 12, color: '#065F46' },
  proCard: { flexDirection: 'row', alignItems: 'center', margin: 20, marginBottom: 0, backgroundColor: '#FEF3C7', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FDE68A' },
  proIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  proTitle: { fontSize: 15, fontWeight: '700', color: '#92400E' },
  proDesc: { fontSize: 12, color: '#A16207', marginTop: 2 },
  proPill: { backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  proPillText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
  badge: { backgroundColor: C.primarySoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  badgeText: { fontSize: 11, fontWeight: '600', color: C.primary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { fontSize: 15, fontWeight: '600', color: C.error },
});
