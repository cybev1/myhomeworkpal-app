import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/context/stores';
import { Avatar, Badge, StarRating, Card, Button } from '@/components/UI';

const { width } = Dimensions.get('window');

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const mockUser = user || {
    id: '1', name: 'Demo Student', email: 'demo@example.com',
    role: 'student' as const, bio: 'CS major at MIT', rating: 4.8,
    totalReviews: 23, completedOrders: 15, verified: true, createdAt: '',
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', route: '/profile/edit' },
        { icon: 'wallet-outline', label: 'Wallet & Earnings', route: '/payment' },
        { icon: 'card-outline', label: 'Payment Methods', route: '/payment' },
        { icon: 'star-outline', label: 'My Reviews', route: '/reviews' },
      ],
    },
    {
      title: 'Activity',
      items: [
        { icon: 'document-text-outline', label: 'My Tasks', route: '/orders' },
        { icon: 'briefcase-outline', label: 'My Services', route: '/create-service' },
        { icon: 'bookmark-outline', label: 'Saved Items', route: '/saved' },
        { icon: 'time-outline', label: 'History', route: '/history' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help Center', route: '/help' },
        { icon: 'chatbubble-outline', label: 'Contact Support', route: '/support' },
        { icon: 'shield-checkmark-outline', label: 'Trust & Safety', route: '/safety' },
        { icon: 'document-outline', label: 'Terms & Privacy', route: '/terms' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <LinearGradient
          colors={['#0A0F1E', '#151B2E']}
          style={styles.profileHeader}
        >
          <View style={[styles.orb, { top: -50, right: -30, backgroundColor: Colors.primary }]} />

          <View style={styles.profileTop}>
            <Text style={styles.headerTitle}>Account</Text>
            <TouchableOpacity style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={22} color={Colors.light} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Avatar name={mockUser.name} size={72} verified={mockUser.verified} online />
            <View style={{ flex: 1, marginLeft: Spacing.base }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.profileName}>{mockUser.name}</Text>
                {mockUser.verified && <Badge label="Verified" variant="info" />}
              </View>
              <Text style={styles.profileRole}>
                {mockUser.role === 'student' ? 'Student' : 'Helper'} · {mockUser.email}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <StarRating rating={mockUser.rating || 0} size={14} />
                <Text style={styles.ratingText}>{mockUser.rating} ({mockUser.totalReviews} reviews)</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mockUser.completedOrders || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mockUser.rating || 0}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mockUser.totalReviews || 0}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Wallet preview */}
        <View style={styles.walletSection}>
          <Card variant="gradient" style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <Ionicons name="wallet" size={24} color={Colors.primaryLight} />
              <Text style={styles.walletTitle}>Wallet Balance</Text>
            </View>
            <Text style={styles.walletBalance}>$234.50</Text>
            <View style={styles.walletActions}>
              <Button title="Add Funds" onPress={() => router.push('/payment')} size="sm" />
              <Button title="Withdraw" onPress={() => router.push('/payment')} variant="outline" size="sm" />
            </View>
          </Card>
        </View>

        {/* Menu sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <Card variant="default" style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, idx < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={() => {}}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIcon}>
                      <Ionicons name={item.icon as any} size={20} color={Colors.primaryLight} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            title="Sign Out"
            onPress={() => logout()}
            variant="danger"
            icon="log-out-outline"
            fullWidth
          />
        </View>

        <Text style={styles.version}>MyHomeworkPal v2.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  profileHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 200, height: 200,
    borderRadius: 100,
    opacity: 0.06,
  },
  profileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: { fontSize: Fonts.sizes['2xl'], fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.darkElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  profileName: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.white },
  profileRole: { fontSize: Fonts.sizes.sm, color: Colors.muted, marginTop: 2 },
  ratingText: { fontSize: Fonts.sizes.xs, color: Colors.subtle },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.darkCard,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: Fonts.sizes.xs, color: Colors.muted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.darkBorder },
  walletSection: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  walletCard: {},
  walletHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  walletTitle: { fontSize: Fonts.sizes.sm, color: Colors.subtle, fontWeight: '600' },
  walletBalance: { fontSize: Fonts.sizes['3xl'], fontWeight: '800', color: Colors.white, marginBottom: Spacing.md },
  walletActions: { flexDirection: 'row', gap: Spacing.md },
  menuSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  menuSectionTitle: {
    fontSize: Fonts.sizes.xs, fontWeight: '700', color: Colors.muted,
    letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: Spacing.sm, marginBottom: Spacing.sm,
  },
  menuCard: { padding: 0 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.darkBorder },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(108,92,231,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: Fonts.sizes.base, color: Colors.light, fontWeight: '500' },
  logoutSection: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  version: { textAlign: 'center', fontSize: Fonts.sizes.xs, color: Colors.muted, marginTop: Spacing.sm },
});
