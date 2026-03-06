import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius, Shadows } from '@/constants/theme';
import { Card, Badge, Avatar, Button, EmptyState } from '@/components/UI';

const { width } = Dimensions.get('window');

type StatusFilter = 'all' | 'active' | 'delivered' | 'completed' | 'disputed';

export default function OrdersScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const mockOrders = [
    {
      id: '1', title: 'Calculus II integration problems', budget: 35, status: 'in_progress',
      helper: { name: 'Dr. Chen', rating: 4.9 },
      deadline: new Date(Date.now() + 86400000).toISOString(),
      progress: 60,
    },
    {
      id: '2', title: 'Python data analysis project', budget: 75, status: 'delivered',
      helper: { name: 'Alex R.', rating: 4.8 },
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
      progress: 100,
    },
    {
      id: '3', title: 'Renaissance art essay', budget: 50, status: 'completed',
      helper: { name: 'Prof. Williams', rating: 5.0 },
      deadline: new Date(Date.now() - 86400000 * 2).toISOString(),
      progress: 100,
    },
  ];

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    in_progress: { bg: 'rgba(0,210,255,0.12)', text: Colors.accent, label: 'In Progress' },
    delivered: { bg: 'rgba(255,145,0,0.12)', text: Colors.warning, label: 'Delivered' },
    completed: { bg: 'rgba(0,230,118,0.12)', text: Colors.success, label: 'Completed' },
    disputed: { bg: 'rgba(255,82,82,0.12)', text: Colors.error, label: 'Disputed' },
    revision: { bg: 'rgba(255,217,61,0.12)', text: Colors.premium, label: 'Revision' },
  };

  const filteredOrders = filter === 'all'
    ? mockOrders
    : mockOrders.filter((o) => o.status === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/create-task')}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Summary cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
        <SummaryPill icon="hourglass-outline" label="Active" count={1} color={Colors.accent} active={filter === 'active'} onPress={() => setFilter('active')} />
        <SummaryPill icon="paper-plane-outline" label="Delivered" count={1} color={Colors.warning} active={filter === 'delivered'} onPress={() => setFilter('delivered')} />
        <SummaryPill icon="checkmark-done-outline" label="Completed" count={1} color={Colors.success} active={filter === 'completed'} onPress={() => setFilter('completed')} />
        <SummaryPill icon="alert-circle-outline" label="Disputed" count={0} color={Colors.error} active={filter === 'disputed'} onPress={() => setFilter('disputed')} />
      </ScrollView>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'delivered', 'completed'] as StatusFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="No orders yet"
            message="Post a task and hire a helper to get started"
            action={{ label: 'Post a Task', onPress: () => router.push('/create-task') }}
          />
        ) : (
          filteredOrders.map((order) => {
            const sc = statusColors[order.status] || statusColors.in_progress;
            return (
              <TouchableOpacity key={order.id} activeOpacity={0.85} onPress={() => router.push(`/task/${order.id}`)}>
                <Card variant="gradient" style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: sc.text }]} />
                        <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                      </View>
                      <Text style={styles.orderTitle} numberOfLines={2}>{order.title}</Text>
                    </View>
                    <Text style={styles.orderBudget}>${order.budget}</Text>
                  </View>

                  {/* Progress bar */}
                  {order.status === 'in_progress' && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <LinearGradient
                          colors={['#6C5CE7', '#00D2FF']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressFill, { width: `${order.progress}%` }]}
                        />
                      </View>
                      <Text style={styles.progressText}>{order.progress}%</Text>
                    </View>
                  )}

                  <View style={styles.orderFooter}>
                    <View style={styles.orderHelper}>
                      <Avatar name={order.helper.name} size={28} />
                      <Text style={styles.orderHelperName}>{order.helper.name}</Text>
                    </View>
                    {order.status === 'delivered' && (
                      <Button title="Review" onPress={() => {}} size="sm" />
                    )}
                    {order.status === 'in_progress' && (
                      <TouchableOpacity style={styles.chatBtn} onPress={() => router.push('/messages')}>
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const SummaryPill = ({ icon, label, count, color, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <LinearGradient
      colors={active ? [`${color}25`, `${color}10`] : [Colors.darkCard, Colors.darkCard]}
      style={[styles.summaryPill, active && { borderColor: color }]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.summaryCount}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: Fonts.sizes['2xl'], fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.sm },
  summaryPill: {
    width: (width - 56) / 3,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    alignItems: 'center',
  },
  summaryCount: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.white, marginTop: 4 },
  summaryLabel: { fontSize: Fonts.sizes.xs, color: Colors.muted, marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  filterChipActive: { backgroundColor: 'rgba(108,92,231,0.15)', borderColor: Colors.primary },
  filterChipText: { fontSize: Fonts.sizes.sm, color: Colors.muted, fontWeight: '500' },
  filterChipTextActive: { color: Colors.primaryLight },
  orderCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.md },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, gap: 6, marginBottom: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderTitle: { fontSize: Fonts.sizes.base, fontWeight: '700', color: Colors.white, lineHeight: 22 },
  orderBudget: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.primaryLight },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  progressBar: { flex: 1, height: 6, backgroundColor: Colors.darkBorder, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: Fonts.sizes.xs, color: Colors.accent, fontWeight: '700', width: 36, textAlign: 'right' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderHelper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderHelperName: { fontSize: Fonts.sizes.sm, color: Colors.light, fontWeight: '500' },
  chatBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(108,92,231,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
