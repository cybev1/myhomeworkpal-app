import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tasksAPI, bidsAPI, ordersAPI, chatAPI } from '@/services/api';
import { useAuthStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5', gold: '#F59E0B', cyan: '#06B6D4', error: '#EF4444' };

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [task, setTask] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidDays, setBidDays] = useState('3');
  const [submitting, setSubmitting] = useState(false);

  const isOwner = task?.studentId === user?.id;
  const isHelper = user?.role === 'helper';

  const fetchData = async () => {
    if (!id) return;
    try {
      const { data: t } = await tasksAPI.get(id as string);
      setTask(t);
      try {
        const { data: b } = await bidsAPI.list(id as string);
        setBids(b.bids || b || []);
      } catch {}
    } catch (e) { console.log('Task fetch error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handlePlaceBid = async () => {
    if (!bidAmount || !bidMessage) { Alert.alert('Required', 'Enter your bid amount and a message'); return; }
    setSubmitting(true);
    try {
      await bidsAPI.create(id as string, {
        amount: parseFloat(bidAmount),
        message: bidMessage,
        delivery_days: parseInt(bidDays) || 3,
      });
      Alert.alert('Bid Submitted!', 'The student will review your proposal.');
      setShowBidForm(false);
      setBidAmount(''); setBidMessage(''); setBidDays('3');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to submit bid');
    } finally { setSubmitting(false); }
  };

  const handleAcceptBid = async (bid: any) => {
    Alert.alert('Accept Bid', `Accept ${bid.helper?.name || 'this helper'}'s bid for $${bid.amount}? Funds will be held in escrow.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept & Pay', style: 'default', onPress: async () => {
        try {
          await bidsAPI.accept(bid.id);
          // Create order
          await ordersAPI.create({
            task_id: id as string,
            helper_id: bid.helperId || bid.helper?.id,
            amount: bid.amount,
          });
          Alert.alert('Order Started!', 'Your task is now in progress. Chat with your helper to track delivery.', [
            { text: 'View Orders', onPress: () => router.push('/(tabs)/orders') },
          ]);
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.detail || 'Failed to accept bid');
        }
      }},
    ]);
  };

  const handleRejectBid = async (bidId: string) => {
    try {
      await bidsAPI.reject(bidId);
      fetchData();
    } catch {}
  };

  const handleMessageHelper = async (helperId: string) => {
    try {
      const { data } = await chatAPI.startConversation(helperId);
      router.push(`/chat/${data.id || data._id}`);
    } catch {
      Alert.alert('Chat', 'Could not start conversation. Try again.');
    }
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { open: C.accent, in_progress: C.cyan, delivered: C.gold, completed: C.accent, disputed: C.error };
    return map[s] || C.textMuted;
  };

  const timeAgo = (date: string) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return <View style={[s.container, s.center]}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (!task) return (
    <View style={[s.container, s.center]}>
      <Ionicons name="alert-circle-outline" size={48} color={C.textMuted} />
      <Text style={{ fontSize: 17, color: C.text, fontWeight: '600', marginTop: 12 }}>Task not found</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
        <Text style={{ color: C.primary, fontWeight: '600' }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.textSoft} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Task Details</Text>
        <TouchableOpacity style={s.backBtn}>
          <Ionicons name="share-outline" size={20} color={C.textSoft} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.section}>
          {/* Status + category */}
          <View style={s.metaRow}>
            <View style={[s.statusBadge, { backgroundColor: `${statusColor(task.status)}12` }]}>
              <View style={[s.statusDot, { backgroundColor: statusColor(task.status) }]} />
              <Text style={[s.statusText, { color: statusColor(task.status) }]}>
                {(task.status || 'open').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Text>
            </View>
            <Text style={s.categoryTag}>{(task.category || '').toUpperCase()}</Text>
          </View>

          <Text style={s.taskTitle}>{task.title}</Text>
          <Text style={s.taskDesc}>{task.description}</Text>

          {/* Quick stats */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Ionicons name="cash-outline" size={18} color={C.primary} />
              <Text style={s.statLabel}>Budget</Text>
              <Text style={s.statValue}>${task.budget}</Text>
            </View>
            <View style={s.statBox}>
              <Ionicons name="time-outline" size={18} color={C.cyan} />
              <Text style={s.statLabel}>Deadline</Text>
              <Text style={s.statValue}>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Flexible'}</Text>
            </View>
            <View style={s.statBox}>
              <Ionicons name="chatbubbles-outline" size={18} color={C.gold} />
              <Text style={s.statLabel}>Bids</Text>
              <Text style={s.statValue}>{bids.length || task.bidsCount || 0}</Text>
            </View>
          </View>

          {/* Files */}
          {task.files && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.subTitle}>Attachments</Text>
              <TouchableOpacity style={s.fileItem}>
                <Ionicons name="document-attach-outline" size={20} color={C.primary} />
                <Text style={s.fileName}>{task.files}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Student card (if not owner) */}
        {task.student && !isOwner && (
          <View style={s.section}>
            <Text style={s.subTitle}>Posted by</Text>
            <View style={s.personCard}>
              <View style={s.avatar}><Text style={s.avatarText}>{task.student.name?.[0] || 'S'}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.personName}>{task.student.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={14} color={C.gold} />
                  <Text style={s.personMeta}>{task.student.rating?.toFixed(1) || '—'} ({task.student.totalReviews || 0} reviews)</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Bids section */}
        <View style={s.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={s.subTitle}>Proposals ({bids.length})</Text>
            {!isOwner && task.status === 'open' && (
              <TouchableOpacity onPress={() => setShowBidForm(!showBidForm)} style={s.smallBtn}>
                <Ionicons name={showBidForm ? 'close' : 'add'} size={16} color={C.primary} />
                <Text style={s.smallBtnText}>{showBidForm ? 'Cancel' : 'Place Bid'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bid form */}
          {showBidForm && (
            <View style={s.bidForm}>
              <Text style={s.formLabel}>Your Bid Amount ($)</Text>
              <View style={s.inputWrap}>
                <Text style={{ color: C.textMuted, fontSize: 16 }}>$</Text>
                <TextInput value={bidAmount} onChangeText={setBidAmount} placeholder={`${task.budget}`} placeholderTextColor={C.textMuted} keyboardType="numeric" style={s.formInput} />
              </View>
              <Text style={s.formLabel}>Delivery (days)</Text>
              <View style={s.inputWrap}>
                <Ionicons name="time-outline" size={16} color={C.textMuted} />
                <TextInput value={bidDays} onChangeText={setBidDays} placeholder="3" placeholderTextColor={C.textMuted} keyboardType="numeric" style={s.formInput} />
              </View>
              <Text style={s.formLabel}>Cover Letter</Text>
              <View style={[s.inputWrap, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                <TextInput value={bidMessage} onChangeText={setBidMessage} placeholder="Introduce yourself and explain why you're the best fit..." placeholderTextColor={C.textMuted} multiline style={[s.formInput, { height: 80, textAlignVertical: 'top' }]} />
              </View>
              <TouchableOpacity onPress={handlePlaceBid} disabled={submitting} style={[s.submitBidBtn, submitting && { opacity: 0.7 }]}>
                {submitting ? <ActivityIndicator color="#fff" /> : (
                  <><Ionicons name="paper-plane" size={16} color="#fff" /><Text style={s.submitBidText}>Submit Proposal</Text></>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Bids list */}
          {bids.length === 0 ? (
            <View style={s.emptyBids}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color={C.textMuted} />
              <Text style={{ color: C.textMuted, marginTop: 8, fontSize: 14 }}>No bids yet. {isOwner ? 'Sit tight — experts will start bidding soon!' : 'Be the first to bid!'}</Text>
            </View>
          ) : bids.map((bid: any) => (
            <View key={bid.id} style={s.bidCard}>
              <View style={s.bidHeader}>
                <View style={s.avatar}><Text style={s.avatarText}>{bid.helper?.name?.[0] || 'H'}</Text></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.bidName}>{bid.helper?.name || 'Helper'}</Text>
                    {bid.helper?.verified && <Ionicons name="checkmark-circle" size={16} color={C.primary} />}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="star" size={12} color={C.gold} />
                    <Text style={s.bidMeta}>{bid.helper?.rating?.toFixed(1) || '—'} · {bid.helper?.completedOrders || 0} orders</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.bidAmount}>${bid.amount}</Text>
                  <Text style={s.bidDelivery}>{bid.deliveryDays}d delivery</Text>
                </View>
              </View>
              <Text style={s.bidMessage}>{bid.message}</Text>
              <Text style={s.bidTime}>{timeAgo(bid.createdAt)}</Text>

              {/* Actions */}
              {isOwner && bid.status === 'pending' && (
                <View style={s.bidActions}>
                  <TouchableOpacity style={s.acceptBtn} onPress={() => handleAcceptBid(bid)}>
                    <Ionicons name="checkmark-circle" size={18} color="#059669" />
                    <Text style={[s.actionText, { color: '#059669' }]}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => handleRejectBid(bid.id)}>
                    <Ionicons name="close-circle" size={18} color={C.error} />
                    <Text style={[s.actionText, { color: C.error }]}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.chatBtn} onPress={() => handleMessageHelper(bid.helperId || bid.helper?.id)}>
                    <Ionicons name="chatbubble-outline" size={18} color={C.primary} />
                    <Text style={[s.actionText, { color: C.primary }]}>Chat</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      {task.status === 'open' && !isOwner && !showBidForm && (
        <View style={s.bottomBar}>
          <View>
            <Text style={s.bottomLabel}>Budget</Text>
            <Text style={s.bottomPrice}>${task.budget}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowBidForm(true)} style={s.bottomCta}>
            <Ionicons name="paper-plane" size={18} color="#fff" />
            <Text style={s.bottomCtaText}>Place Bid</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  section: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  categoryTag: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 1.5 },
  taskTitle: { fontSize: 22, fontWeight: '800', color: C.text, lineHeight: 30, letterSpacing: -0.3 },
  taskDesc: { fontSize: 15, color: C.textSoft, lineHeight: 24, marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 20, backgroundColor: C.bgSoft, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 11, color: C.textMuted },
  statValue: { fontSize: 16, fontWeight: '800', color: C.text },
  subTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10 },
  fileItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bgSoft, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  fileName: { fontSize: 13, color: C.textSoft, flex: 1 },
  personCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  personName: { fontSize: 15, fontWeight: '700', color: C.text },
  personMeta: { fontSize: 12, color: C.textMuted },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: C.primarySoft, borderWidth: 1, borderColor: C.primary + '30' },
  smallBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },

  // Bid form
  bidForm: { backgroundColor: C.bgSoft, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  formLabel: { fontSize: 12, fontWeight: '600', color: C.textSoft, marginBottom: 4, marginTop: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, height: 46, gap: 8 },
  formInput: { flex: 1, fontSize: 15, color: C.text, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  submitBidBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 12, height: 48, marginTop: 16 },
  submitBidText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Bid cards
  emptyBids: { alignItems: 'center', paddingVertical: 28 },
  bidCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16, marginBottom: 10 },
  bidHeader: { flexDirection: 'row', alignItems: 'center' },
  bidName: { fontSize: 15, fontWeight: '700', color: C.text },
  bidMeta: { fontSize: 12, color: C.textMuted },
  bidAmount: { fontSize: 20, fontWeight: '800', color: C.primary },
  bidDelivery: { fontSize: 11, color: C.accent, fontWeight: '600', marginTop: 2 },
  bidMessage: { fontSize: 14, color: C.textSoft, lineHeight: 22, marginTop: 12, marginBottom: 6 },
  bidTime: { fontSize: 11, color: C.textMuted },
  bidActions: { flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1FAE5' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: C.primarySoft, borderWidth: 1, borderColor: C.primary + '30' },
  actionText: { fontSize: 13, fontWeight: '600' },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 34 : 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border },
  bottomLabel: { fontSize: 11, color: C.textMuted },
  bottomPrice: { fontSize: 22, fontWeight: '800', color: C.primary },
  bottomCta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  bottomCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
