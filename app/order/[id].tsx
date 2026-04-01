import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ordersAPI, reviewsAPI } from '@/services/api';
import { useAuthStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5', gold: '#F59E0B', cyan: '#06B6D4', error: '#EF4444' };
const alert = (t: string, m: string, onOk?: () => void) => { if (isWeb) { window.alert(t + '\n' + m); onOk?.(); } else { const { Alert } = require('react-native'); Alert.alert(t, m, onOk ? [{ text: 'OK', onPress: onOk }] : undefined); } };
const confirm = async (msg: string): Promise<boolean> => { if (isWeb) return window.confirm(msg); return new Promise(r => { const { Alert } = require('react-native'); Alert.alert('Confirm', msg, [{ text: 'Cancel', onPress: () => r(false) }, { text: 'Yes', onPress: () => r(true) }]); }); };

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [revisionMsg, setRevisionMsg] = useState('');
  const [showRevision, setShowRevision] = useState(false);

  const fetchOrder = async () => {
    try { const { data } = await ordersAPI.get(id as string); setOrder(data); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchOrder(); }, [id]);

  const isStudent = order?.studentId === user?.id;
  const isHelper = order?.helperId === user?.id;
  const sc = (s: string) => ({ active: C.cyan, delivered: C.gold, completed: C.accent, revision: '#F97316', disputed: C.error, pending: C.textMuted }[s] || C.textMuted);

  const handleDeliver = async () => {
    if (!await confirm('Mark this order as delivered?')) return;
    setActing(true);
    try { await ordersAPI.deliver(id as string, new FormData()); alert('Delivered!', 'The student will review your work.'); fetchOrder(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
    finally { setActing(false); }
  };

  const handleApprove = async () => {
    if (!await confirm('Approve this delivery? Payment will be released to the helper.')) return;
    setActing(true);
    try { await ordersAPI.approve(id as string); alert('Approved!', 'Payment released. Leave a review!', () => setShowReview(true)); fetchOrder(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
    finally { setActing(false); }
  };

  const handleRevision = async () => {
    if (!revisionMsg.trim()) { alert('Required', 'Describe what needs revision'); return; }
    setActing(true);
    try { await ordersAPI.requestRevision(id as string, { message: revisionMsg }); alert('Revision Requested', 'The helper will revise the work.'); setShowRevision(false); fetchOrder(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
    finally { setActing(false); }
  };

  const handleReview = async () => {
    setActing(true);
    try { await reviewsAPI.create(id as string, { rating, comment: reviewText }); alert('Review Submitted!', 'Thank you for your feedback.'); setShowReview(false); fetchOrder(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
    finally { setActing(false); }
  };

  const handleDispute = async () => {
    if (!await confirm('Open a dispute? An admin will review this case.')) return;
    setActing(true);
    try { await ordersAPI.dispute(id as string, { reason: 'Quality issue' }); alert('Dispute Opened', 'An admin will review.'); fetchOrder(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
    finally { setActing(false); }
  };

  if (loading) return <View style={[s.page, s.center]}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (!order) return <View style={[s.page, s.center]}><Text style={{ color: C.textMuted }}>Order not found</Text><TouchableOpacity onPress={() => router.back()}><Text style={{ color: C.primary, marginTop: 12 }}>Go Back</Text></TouchableOpacity></View>;

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={s.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Status banner */}
        <View style={[s.statusBanner, { backgroundColor: `${sc(order.status)}10`, borderColor: `${sc(order.status)}30` }]}>
          <Ionicons name={order.status === 'completed' ? 'checkmark-circle' : order.status === 'delivered' ? 'gift' : 'time'} size={24} color={sc(order.status)} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.statusTitle, { color: sc(order.status) }]}>{(order.status || '').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text>
            <Text style={s.statusDesc}>
              {order.status === 'active' && isHelper ? 'Work on this order and deliver when ready.' : ''}
              {order.status === 'active' && isStudent ? 'The helper is working on your task.' : ''}
              {order.status === 'delivered' && isStudent ? 'Review the delivery and approve or request revision.' : ''}
              {order.status === 'delivered' && isHelper ? 'Waiting for the student to review.' : ''}
              {order.status === 'completed' ? 'This order is complete. Payment has been released.' : ''}
              {order.status === 'revision' && isHelper ? 'The student requested changes. Please revise and redeliver.' : ''}
              {order.status === 'revision' && isStudent ? 'Waiting for the helper to submit a revision.' : ''}
            </Text>
          </View>
        </View>

        {/* Order info */}
        <View style={s.card}>
          <View style={s.row}><Text style={s.label}>Amount</Text><Text style={s.value}>${order.amount}</Text></View>
          <View style={s.divider} />
          <View style={s.row}><Text style={s.label}>Order ID</Text><Text style={[s.value, { fontSize: 12, color: C.textMuted }]}>{order.id?.slice(0, 8)}...</Text></View>
          <View style={s.divider} />
          <View style={s.row}><Text style={s.label}>Deadline</Text><Text style={s.value}>{order.deliveryDeadline ? new Date(order.deliveryDeadline).toLocaleDateString() : 'Flexible'}</Text></View>
          {order.deliveredAt && <><View style={s.divider} /><View style={s.row}><Text style={s.label}>Delivered</Text><Text style={s.value}>{new Date(order.deliveredAt).toLocaleDateString()}</Text></View></>}
          <View style={s.divider} />
          <View style={s.row}><Text style={s.label}>Created</Text><Text style={s.value}>{new Date(order.createdAt).toLocaleDateString()}</Text></View>
        </View>

        {/* Review form */}
        {showReview && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>Leave a Review</Text>
            <View style={s.starsRow}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRating(n)}>
                  <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={32} color={C.gold} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput value={reviewText} onChangeText={setReviewText} placeholder="How was your experience?" placeholderTextColor={C.textMuted} multiline style={s.textarea} />
            <TouchableOpacity onPress={handleReview} disabled={acting} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>{acting ? 'Submitting...' : 'Submit Review'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Revision form */}
        {showRevision && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>Request Revision</Text>
            <TextInput value={revisionMsg} onChangeText={setRevisionMsg} placeholder="Describe what needs to be changed..." placeholderTextColor={C.textMuted} multiline style={s.textarea} />
            <TouchableOpacity onPress={handleRevision} disabled={acting} style={[s.primaryBtn, { backgroundColor: '#F97316' }]}>
              <Text style={s.primaryBtnText}>{acting ? 'Sending...' : 'Send Revision Request'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Escrow info */}
        <View style={[s.card, { backgroundColor: C.accentSoft, borderColor: '#D1FAE5' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="shield-checkmark" size={22} color={C.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>Escrow Protected</Text>
              <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                {order.status === 'completed' ? 'Payment has been released to the helper.' : 'Payment is held securely until you approve the work.'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action bar */}
      {order.status !== 'completed' && order.status !== 'cancelled' && (
        <View style={s.bottomBar}>
          {/* Helper: Deliver */}
          {isHelper && (order.status === 'active' || order.status === 'revision') && (
            <TouchableOpacity onPress={handleDeliver} disabled={acting} style={s.ctaBtn}>
              <Ionicons name="paper-plane" size={18} color="#fff" />
              <Text style={s.ctaBtnText}>Deliver Work</Text>
            </TouchableOpacity>
          )}
          {/* Student: Approve/Revise delivered work */}
          {isStudent && order.status === 'delivered' && (
            <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
              <TouchableOpacity onPress={handleApprove} disabled={acting} style={[s.ctaBtn, { flex: 1, backgroundColor: C.accent }]}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={s.ctaBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowRevision(true)} style={[s.ctaBtn, { flex: 1, backgroundColor: '#F97316' }]}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={s.ctaBtnText}>Revise</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Student: Review after complete */}
          {isStudent && order.status === 'completed' && !showReview && (
            <TouchableOpacity onPress={() => setShowReview(true)} style={[s.ctaBtn, { backgroundColor: C.gold }]}>
              <Ionicons name="star" size={18} color="#fff" />
              <Text style={s.ctaBtnText}>Leave Review</Text>
            </TouchableOpacity>
          )}
          {/* Dispute */}
          {(isStudent || isHelper) && order.status !== 'disputed' && (
            <TouchableOpacity onPress={handleDispute} style={s.ghostBtn}>
              <Text style={s.ghostBtnText}>Open Dispute</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  statusBanner: { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 16 },
  statusTitle: { fontSize: 16, fontWeight: '700' },
  statusDesc: { fontSize: 13, color: C.textMuted, marginTop: 2, lineHeight: 18 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 14, color: C.textMuted },
  value: { fontSize: 16, fontWeight: '700', color: C.text },
  divider: { height: 1, backgroundColor: C.border },
  formCard: { backgroundColor: C.bgSoft, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  starsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16 },
  textarea: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, minHeight: 80, fontSize: 15, color: C.text, textAlignVertical: 'top', marginBottom: 12, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  primaryBtn: { backgroundColor: C.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 34 : 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, alignItems: 'center' },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, flex: 1 },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ghostBtn: { paddingVertical: 14, paddingHorizontal: 16 },
  ghostBtnText: { color: C.error, fontSize: 13, fontWeight: '600' },
});
