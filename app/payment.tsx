import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius, Shadows } from '@/constants/theme';
import { Card, Button, FloatingInput, Badge } from '@/components/UI';

const { width } = Dimensions.get('window');

export default function PaymentScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'wallet' | 'methods' | 'history'>('wallet');

  const mockTransactions = [
    { id: '1', type: 'payment', desc: 'Calculus II homework', amount: -35, date: '2 hours ago', status: 'completed' },
    { id: '2', type: 'deposit', desc: 'Added funds', amount: 100, date: '1 day ago', status: 'completed' },
    { id: '3', type: 'earning', desc: 'Python project delivery', amount: 75, date: '3 days ago', status: 'completed' },
    { id: '4', type: 'refund', desc: 'Dispute resolution', amount: 20, date: '1 week ago', status: 'completed' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet & Payments</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Floating Stripe-style wallet card */}
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['#6C5CE7', '#5A4BD1', '#4834B0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            {/* Glass pattern overlay */}
            <View style={styles.cardPattern}>
              <View style={[styles.patternCircle, { top: -30, right: -20, width: 120, height: 120 }]} />
              <View style={[styles.patternCircle, { bottom: -40, left: -30, width: 160, height: 160 }]} />
            </View>

            <View style={styles.cardHeader}>
              <View style={styles.cardChip}>
                <Ionicons name="wallet" size={20} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.cardBrand}>MyHomeworkPal</Text>
            </View>

            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>$234.50</Text>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardFieldLabel}>Escrow</Text>
                <Text style={styles.cardFieldValue}>$35.00</Text>
              </View>
              <View>
                <Text style={styles.cardFieldLabel}>Pending</Text>
                <Text style={styles.cardFieldValue}>$0.00</Text>
              </View>
              <View>
                <Text style={styles.cardFieldLabel}>Earned</Text>
                <Text style={styles.cardFieldValue}>$1,245</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <ActionBtn icon="add-circle" label="Add Funds" color={Colors.success} />
          <ActionBtn icon="arrow-up-circle" label="Withdraw" color={Colors.accent} />
          <ActionBtn icon="swap-horizontal" label="Transfer" color={Colors.warning} />
          <ActionBtn icon="receipt" label="Invoices" color={Colors.primaryLight} />
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {(['wallet', 'methods', 'history'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content based on tab */}
        {activeTab === 'wallet' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {mockTransactions.map((tx) => (
              <TouchableOpacity key={tx.id} style={styles.txItem}>
                <View style={[styles.txIcon, {
                  backgroundColor: tx.amount > 0 ? 'rgba(0,230,118,0.12)' : 'rgba(255,82,82,0.12)',
                }]}>
                  <Ionicons
                    name={tx.amount > 0 ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={tx.amount > 0 ? Colors.success : Colors.error}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.txDesc}>{tx.desc}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.amount > 0 ? Colors.success : Colors.light }]}>
                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'methods' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>

            {/* Saved card */}
            <Card variant="glass" style={styles.methodCard}>
              <View style={styles.methodRow}>
                <View style={styles.methodIcon}>
                  <Ionicons name="card" size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.methodName}>Visa ending in 4242</Text>
                  <Text style={styles.methodExpiry}>Expires 12/27</Text>
                </View>
                <Badge label="Default" variant="info" />
              </View>
            </Card>

            <Button
              title="Add Payment Method"
              onPress={() => {}}
              variant="outline"
              icon="add"
              fullWidth
              style={{ marginTop: Spacing.md }}
            />
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Transactions</Text>
            {mockTransactions.map((tx) => (
              <TouchableOpacity key={tx.id} style={styles.txItem}>
                <View style={[styles.txIcon, {
                  backgroundColor: tx.amount > 0 ? 'rgba(0,230,118,0.12)' : 'rgba(255,82,82,0.12)',
                }]}>
                  <Ionicons
                    name={tx.amount > 0 ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={tx.amount > 0 ? Colors.success : Colors.error}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.txDesc}>{tx.desc}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.amount > 0 ? Colors.success : Colors.light }]}>
                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ActionBtn = ({ icon, label, color }: any) => (
  <TouchableOpacity style={styles.actionBtn}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.darkElevated, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  cardContainer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  walletCard: {
    borderRadius: Radius['2xl'], padding: Spacing.xl,
    overflow: 'hidden', position: 'relative',
    ...Shadows.lg,
  },
  cardPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  patternCircle: {
    position: 'absolute', borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing['2xl'] },
  cardChip: {
    width: 40, height: 30, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardBrand: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  balanceLabel: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  balanceAmount: { fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: Spacing.xl },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardFieldLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  cardFieldValue: { fontSize: Fonts.sizes.base, fontWeight: '700', color: '#fff' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: Fonts.sizes.xs, color: Colors.subtle, fontWeight: '500' },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.muted },
  tabTextActive: { color: Colors.white },
  section: { paddingHorizontal: Spacing.lg },
  sectionTitle: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, marginBottom: Spacing.md },
  txItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: Fonts.sizes.base, fontWeight: '600', color: Colors.light },
  txDate: { fontSize: Fonts.sizes.xs, color: Colors.muted, marginTop: 2 },
  txAmount: { fontSize: Fonts.sizes.base, fontWeight: '700' },
  methodCard: { marginBottom: Spacing.sm },
  methodRow: { flexDirection: 'row', alignItems: 'center' },
  methodIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(108,92,231,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  methodName: { fontSize: Fonts.sizes.base, fontWeight: '600', color: Colors.light },
  methodExpiry: { fontSize: Fonts.sizes.xs, color: Colors.muted, marginTop: 2 },
});
