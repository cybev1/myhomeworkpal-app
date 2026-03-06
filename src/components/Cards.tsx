import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { Card, Avatar, Badge, StarRating } from './UI';
import { Task, User } from '@/context/stores';
import { formatDistanceToNow } from 'date-fns';

// ═══════════════════════════════════════
// TASK CARD — Marketplace listing
// ═══════════════════════════════════════
interface TaskCardProps {
  task: Task;
  onPress: () => void;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, compact }) => {
  const statusMap: Record<string, { label: string; variant: any }> = {
    open: { label: 'Open', variant: 'success' },
    in_progress: { label: 'In Progress', variant: 'info' },
    delivered: { label: 'Delivered', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'error' },
    disputed: { label: 'Disputed', variant: 'error' },
  };

  const status = statusMap[task.status] || statusMap.open;

  return (
    <Card variant="gradient" onPress={onPress} style={compact ? styles.compactCard : styles.taskCard}>
      {/* Header */}
      <View style={styles.taskHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.taskMeta}>
            <Badge label={status.label} variant={status.variant} />
            <Text style={styles.taskCategory}>
              {task.category?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {task.title}
          </Text>
        </View>
      </View>

      {/* Description */}
      {!compact && (
        <Text style={styles.taskDesc} numberOfLines={3}>
          {task.description}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.taskFooter}>
        <View style={styles.taskFooterLeft}>
          {task.student && (
            <View style={styles.taskAuthor}>
              <Avatar name={task.student.name} size={24} />
              <Text style={styles.taskAuthorName}>{task.student.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.taskFooterRight}>
          <View style={styles.taskStat}>
            <Ionicons name="chatbubble-outline" size={14} color={Colors.muted} />
            <Text style={styles.taskStatText}>{task.bidsCount || 0} bids</Text>
          </View>
          <View style={styles.budgetPill}>
            <Text style={styles.budgetText}>${task.budget}</Text>
          </View>
        </View>
      </View>

      {/* Deadline */}
      <View style={styles.deadlineRow}>
        <Ionicons name="time-outline" size={13} color={Colors.muted} />
        <Text style={styles.deadlineText}>
          Due {task.deadline ? formatDistanceToNow(new Date(task.deadline), { addSuffix: true }) : 'N/A'}
        </Text>
        {task.createdAt && (
          <Text style={styles.postedText}>
            Posted {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
          </Text>
        )}
      </View>
    </Card>
  );
};

// ═══════════════════════════════════════
// HELPER SERVICE CARD — Gig listing
// ═══════════════════════════════════════
interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    deliveryDays: number;
    helper: User;
  };
  onPress: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress }) => (
  <Card variant="glass" onPress={onPress} style={styles.serviceCard}>
    {/* Gradient accent top */}
    <LinearGradient
      colors={['rgba(108,92,231,0.15)', 'transparent']}
      style={styles.serviceAccent}
    />

    <View style={styles.serviceContent}>
      <View style={styles.serviceHeader}>
        <Avatar name={service.helper?.name || 'H'} size={40} verified />
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={styles.serviceName}>{service.helper?.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <StarRating rating={service.helper?.rating || 0} size={12} />
            <Text style={styles.serviceReviews}>
              ({service.helper?.totalReviews || 0})
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.serviceTitle} numberOfLines={2}>
        {service.title}
      </Text>
      <Text style={styles.serviceDesc} numberOfLines={2}>
        {service.description}
      </Text>

      <View style={styles.serviceFooter}>
        <View style={styles.serviceDelivery}>
          <Ionicons name="flash-outline" size={14} color={Colors.accent} />
          <Text style={styles.serviceDeliveryText}>
            {service.deliveryDays} day delivery
          </Text>
        </View>
        <View>
          <Text style={styles.serviceFromLabel}>Starting at</Text>
          <Text style={styles.servicePrice}>${service.price}</Text>
        </View>
      </View>
    </View>
  </Card>
);

// ═══════════════════════════════════════
// BID CARD
// ═══════════════════════════════════════
interface BidCardProps {
  bid: {
    id: string;
    amount: number;
    message: string;
    deliveryDays: number;
    status: string;
    helper: User;
    createdAt: string;
  };
  onAccept?: () => void;
  onReject?: () => void;
  isOwner?: boolean;
}

export const BidCard: React.FC<BidCardProps> = ({ bid, onAccept, onReject, isOwner }) => (
  <Card variant="default" style={styles.bidCard}>
    <View style={styles.bidHeader}>
      <Avatar name={bid.helper?.name || 'H'} size={44} verified={bid.helper?.verified} online />
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Text style={styles.bidHelperName}>{bid.helper?.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <StarRating rating={bid.helper?.rating || 0} size={14} />
          <Text style={styles.bidHelperMeta}>
            {bid.helper?.completedOrders || 0} orders
          </Text>
        </View>
      </View>
      <View style={styles.bidPriceBox}>
        <Text style={styles.bidPrice}>${bid.amount}</Text>
        <Text style={styles.bidDelivery}>{bid.deliveryDays}d delivery</Text>
      </View>
    </View>

    <Text style={styles.bidMessage} numberOfLines={3}>
      {bid.message}
    </Text>

    {isOwner && bid.status === 'pending' && (
      <View style={styles.bidActions}>
        <TouchableOpacity onPress={onAccept} style={styles.bidAcceptBtn}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={[styles.bidActionText, { color: Colors.success }]}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onReject} style={styles.bidRejectBtn}>
          <Ionicons name="close-circle" size={20} color={Colors.error} />
          <Text style={[styles.bidActionText, { color: Colors.error }]}>Decline</Text>
        </TouchableOpacity>
      </View>
    )}
  </Card>
);

// ═══════════════════════════════════════
// CONVERSATION ITEM
// ═══════════════════════════════════════
interface ConversationItemProps {
  conversation: {
    id: string;
    participant: User;
    lastMessage?: { content: string; createdAt: string };
    unreadCount: number;
  };
  onPress: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.convItem}>
    <Avatar
      name={conversation.participant?.name || 'U'}
      size={52}
      online
    />
    <View style={styles.convContent}>
      <View style={styles.convHeader}>
        <Text style={styles.convName}>{conversation.participant?.name}</Text>
        {conversation.lastMessage && (
          <Text style={styles.convTime}>
            {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
          </Text>
        )}
      </View>
      <View style={styles.convPreview}>
        <Text style={styles.convMessage} numberOfLines={1}>
          {conversation.lastMessage?.content || 'Start a conversation'}
        </Text>
        {conversation.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

// ═══════════════════════════════════════
const styles = StyleSheet.create({
  taskCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.md },
  compactCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.sm, padding: Spacing.md },
  taskHeader: { flexDirection: 'row', marginBottom: Spacing.sm },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  taskCategory: { fontSize: 10, color: Colors.muted, fontWeight: '700', letterSpacing: 1 },
  taskTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white, lineHeight: 24 },
  taskDesc: { fontSize: Fonts.sizes.sm, color: Colors.subtle, lineHeight: 20, marginBottom: Spacing.md },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  taskFooterLeft: { flexDirection: 'row', alignItems: 'center' },
  taskFooterRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  taskAuthor: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskAuthorName: { fontSize: Fonts.sizes.sm, color: Colors.light, fontWeight: '500' },
  taskStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskStatText: { fontSize: Fonts.sizes.xs, color: Colors.muted },
  budgetPill: {
    backgroundColor: 'rgba(108,92,231,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  budgetText: { fontSize: Fonts.sizes.base, fontWeight: '800', color: Colors.primaryLight },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deadlineText: { fontSize: Fonts.sizes.xs, color: Colors.muted },
  postedText: { fontSize: Fonts.sizes.xs, color: Colors.muted, marginLeft: 'auto' },

  serviceCard: { width: 280, marginRight: Spacing.md, padding: 0, overflow: 'hidden' },
  serviceAccent: { height: 4, width: '100%' },
  serviceContent: { padding: Spacing.base },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  serviceName: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.light },
  serviceReviews: { fontSize: 11, color: Colors.muted },
  serviceTitle: { fontSize: Fonts.sizes.base, fontWeight: '700', color: Colors.white, marginBottom: 4, lineHeight: 22 },
  serviceDesc: { fontSize: Fonts.sizes.sm, color: Colors.subtle, lineHeight: 18, marginBottom: Spacing.md },
  serviceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  serviceDelivery: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceDeliveryText: { fontSize: Fonts.sizes.xs, color: Colors.accent, fontWeight: '600' },
  serviceFromLabel: { fontSize: 10, color: Colors.muted, textAlign: 'right' },
  servicePrice: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.white },

  bidCard: { marginBottom: Spacing.md },
  bidHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  bidHelperName: { fontSize: Fonts.sizes.base, fontWeight: '700', color: Colors.white },
  bidHelperMeta: { fontSize: Fonts.sizes.xs, color: Colors.muted },
  bidPriceBox: { alignItems: 'flex-end' },
  bidPrice: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.primaryLight },
  bidDelivery: { fontSize: Fonts.sizes.xs, color: Colors.accent },
  bidMessage: { fontSize: Fonts.sizes.sm, color: Colors.subtle, lineHeight: 20, marginBottom: Spacing.md },
  bidActions: { flexDirection: 'row', gap: Spacing.md },
  bidAcceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,230,118,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.2)',
  },
  bidRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,82,82,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.2)',
  },
  bidActionText: { fontSize: Fonts.sizes.sm, fontWeight: '600' },

  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBorder,
  },
  convContent: { flex: 1, marginLeft: Spacing.md },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convName: { fontSize: Fonts.sizes.base, fontWeight: '600', color: Colors.white },
  convTime: { fontSize: Fonts.sizes.xs, color: Colors.muted },
  convPreview: { flexDirection: 'row', alignItems: 'center' },
  convMessage: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.subtle },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  unreadText: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
