import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Platform, ActivityIndicator, FlatList, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ordersAPI, reviewsAPI, chatAPI } from '@/services/api';
import { useAuthStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5', gold: '#F59E0B', cyan: '#06B6D4', error: '#EF4444' };
const alert = (t: string, m: string, onOk?: () => void) => { if (isWeb) { window.alert(t + '\n' + m); onOk?.(); } else { const { Alert } = require('react-native'); Alert.alert(t, m, onOk ? [{ text: 'OK', onPress: onOk }] : undefined); } };
const doConfirm = async (msg: string): Promise<boolean> => { if (isWeb) return window.confirm(msg); return new Promise(r => { const { Alert } = require('react-native'); Alert.alert('Confirm', msg, [{ text: 'Cancel', onPress: () => r(false) }, { text: 'Yes', onPress: () => r(true) }]); }); };

export default function OrderWorkspace() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(false);
  const [tab, setTab] = useState<'chat' | 'details' | 'review'>('chat');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [revisionMsg, setRevisionMsg] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<any>(null);

  const isStudent = order?.studentId === user?.id;
  const isHelper = order?.helperId === user?.id;
  const currentUserId = user?.id || '';

  const fetchOrder = async () => {
    try {
      const { data } = await ordersAPI.get(id as string);
      setOrder(data);
      if (data.conversationId) fetchMessages(data.conversationId, true);
    } catch {} finally { setLoading(false); }
  };

  const fetchMessages = async (convId: string, quiet = false) => {
    try {
      const { data } = await chatAPI.messages(convId);
      setMessages(data.messages || data || []);
    } catch {}
  };

  useEffect(() => {
    fetchOrder();
    pollRef.current = setInterval(() => {
      if (order?.conversationId) fetchMessages(order.conversationId, true);
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  useEffect(() => {
    if (order?.conversationId) {
      fetchMessages(order.conversationId, true);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchMessages(order.conversationId, true), 5000);
    }
  }, [order?.conversationId]);

  const sendMessage = async () => {
    if (!message.trim() || !order?.conversationId || sending) return;
    const text = message.trim();
    setMessage('');
    setSending(true);
    setMessages(prev => [...prev, { id: `t_${Date.now()}`, content: text, senderId: currentUserId, type: 'text', createdAt: new Date().toISOString() }]);
    try { await chatAPI.send(order.conversationId, { content: text, type: 'text' }); fetchMessages(order.conversationId, true); }
    catch {} finally { setSending(false); }
  };

  const handleDeliver = async () => {
    if (!await doConfirm('Mark this order as delivered? The student will be notified to review.')) return;
    setActing(true);
    try { await ordersAPI.deliver(id as string, new FormData()); alert('Delivered!', 'The student will review your work.'); fetchOrder(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); } finally { setActing(false); }
  };

  const handleApprove = async () => {
    if (!await doConfirm('Approve delivery? Payment will be released to the helper.')) return;
    setActing(true);
    try { await ordersAPI.approve(id as string); alert('Approved!', 'Payment released. Leave a review!'); setTab('review'); fetchOrder(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); } finally { setActing(false); }
  };

  const handleRevision = async () => {
    if (!revisionMsg.trim()) { alert('Required', 'Describe what needs revision'); return; }
    setActing(true);
    try { await ordersAPI.requestRevision(id as string, { message: revisionMsg }); setRevisionMsg(''); fetchOrder(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); } finally { setActing(false); }
  };

  const handleReview = async () => {
    setActing(true);
    try { await reviewsAPI.create(id as string, { rating, comment: reviewText }); alert('Review Submitted!', 'Thank you!'); fetchOrder(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); } finally { setActing(false); }
  };

  const handleDispute = async () => {
    if (!await doConfirm('Open a dispute? A moderator will review this case.')) return;
    setActing(true);
    try { await ordersAPI.dispute(id as string, { reason: 'Issue with delivery' }); fetchOrder(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); } finally { setActing(false); }
  };

  const sc = (s: string) => ({ active: C.cyan, delivered: C.gold, completed: C.accent, revision: '#F97316', disputed: C.error }[s] || C.textMuted);
  const timeStr = (d: string) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  if (loading) return <View style={[s.page, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (!order) return <View style={[s.page, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: C.textMuted }}>Order not found</Text></View>;

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle} numberOfLines={1}>{order.title || 'Order'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[s.statusDot, { backgroundColor: sc(order.status) }]} />
            <Text style={[s.headerStatus, { color: sc(order.status) }]}>{(order.status || '').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} · ${order.amount}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setTab(tab === 'details' ? 'chat' : 'details')} style={s.backBtn}>
          <Ionicons name={tab === 'details' ? 'chatbubbles' : 'information-circle'} size={20} color={C.textSoft} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity onPress={() => setTab('chat')} style={[s.tab, tab === 'chat' && s.tabActive]}><Ionicons name="chatbubbles-outline" size={16} color={tab === 'chat' ? C.primary : C.textMuted} /><Text style={[s.tabText, tab === 'chat' && s.tabTextActive]}>Chat</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('details')} style={[s.tab, tab === 'details' && s.tabActive]}><Ionicons name="document-outline" size={16} color={tab === 'details' ? C.primary : C.textMuted} /><Text style={[s.tabText, tab === 'details' && s.tabTextActive]}>Details</Text></TouchableOpacity>
        {order.status === 'completed' && <TouchableOpacity onPress={() => setTab('review')} style={[s.tab, tab === 'review' && s.tabActive]}><Ionicons name="star-outline" size={16} color={tab === 'review' ? C.primary : C.textMuted} /><Text style={[s.tabText, tab === 'review' && s.tabTextActive]}>Review</Text></TouchableOpacity>}
      </View>

      {/* ═══ CHAT TAB ═══ */}
      {tab === 'chat' && (
        <>
          {messages.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
              <Ionicons name="chatbubbles-outline" size={48} color={C.textMuted} />
              <Text style={{ color: C.textMuted, marginTop: 12, textAlign: 'center', fontSize: 15 }}>Discuss task details, share files, and coordinate delivery here.</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef} data={messages} keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => {
                if (item.type === 'system') return (
                  <View style={s.sysMsg}><Text style={s.sysMsgText}>{item.content}</Text></View>
                );
                const isMine = item.senderId === currentUserId;
                return (
                  <View style={[s.msgRow, isMine && { justifyContent: 'flex-end' }]}>
                    {!isMine && <View style={s.msgAv}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{(isStudent ? order.helperName : order.studentName)?.[0] || 'H'}</Text></View>}
                    <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
                      <Text style={[s.msgText, isMine && { color: '#fff' }]}>{item.content}</Text>
                      <Text style={[s.msgTime, isMine && { color: 'rgba(255,255,255,0.6)' }]}>{timeStr(item.createdAt)}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Input + actions bar */}
          <View style={s.inputSection}>
            {/* Action buttons above input */}
            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <View style={s.actionBar}>
                {isHelper && (order.status === 'active' || order.status === 'revision') && (
                  <TouchableOpacity onPress={handleDeliver} disabled={acting} style={[s.actionBtn, { backgroundColor: C.accentSoft, borderColor: '#D1FAE5' }]}>
                    <Ionicons name="paper-plane" size={14} color={C.accent} /><Text style={[s.actionBtnText, { color: C.accent }]}>Deliver</Text>
                  </TouchableOpacity>
                )}
                {isStudent && order.status === 'delivered' && (
                  <>
                    <TouchableOpacity onPress={handleApprove} disabled={acting} style={[s.actionBtn, { backgroundColor: C.accentSoft, borderColor: '#D1FAE5' }]}>
                      <Ionicons name="checkmark-circle" size={14} color={C.accent} /><Text style={[s.actionBtnText, { color: C.accent }]}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { const msg = isWeb ? window.prompt('What needs to be changed?') : ''; if (msg) { setRevisionMsg(msg); handleRevision(); } }} style={[s.actionBtn, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
                      <Ionicons name="refresh" size={14} color="#F97316" /><Text style={[s.actionBtnText, { color: '#F97316' }]}>Revise</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity onPress={handleDispute} style={[s.actionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                  <Ionicons name="flag" size={14} color={C.error} /><Text style={[s.actionBtnText, { color: C.error }]}>Dispute</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={s.inputBar}>
              <TouchableOpacity><Ionicons name="attach" size={24} color={C.textMuted} /></TouchableOpacity>
              <View style={s.inputWrap}><TextInput value={message} onChangeText={setMessage} placeholder="Type a message..." placeholderTextColor={C.textMuted} style={s.input} multiline onSubmitEditing={sendMessage} returnKeyType="send" /></View>
              <TouchableOpacity onPress={sendMessage} disabled={!message.trim()}>
                {message.trim() ? <View style={s.sendCircle}><Ionicons name="send" size={16} color="#fff" /></View> : <Ionicons name="mic-outline" size={22} color={C.textMuted} />}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* ═══ DETAILS TAB ═══ */}
      {tab === 'details' && (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={[s.statusBanner, { backgroundColor: `${sc(order.status)}10`, borderColor: `${sc(order.status)}30` }]}>
            <Ionicons name={order.status === 'completed' ? 'checkmark-circle' : 'time'} size={22} color={sc(order.status)} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.statusTitle, { color: sc(order.status) }]}>{(order.status || '').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text>
              <Text style={{ fontSize: 12, color: C.textMuted }}>${order.amount} · Escrow protected</Text>
            </View>
          </View>
          <View style={s.detailCard}>
            <DetailRow label="Student" value={order.studentName || '—'} />
            <DetailRow label="Helper" value={order.helperName || '—'} />
            <DetailRow label="Amount" value={`$${order.amount}`} />
            <DetailRow label="Deadline" value={order.deliveryDeadline ? new Date(order.deliveryDeadline).toLocaleDateString() : 'Flexible'} />
            {order.deliveredAt && <DetailRow label="Delivered" value={new Date(order.deliveredAt).toLocaleDateString()} />}
            {order.completedAt && <DetailRow label="Completed" value={new Date(order.completedAt).toLocaleDateString()} />}
            <DetailRow label="Order ID" value={order.id?.slice(0, 12) + '...'} />
          </View>
          {order.revisionMessage && (
            <View style={[s.detailCard, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#9A3412', marginBottom: 6 }}>Revision Requested</Text>
              <Text style={{ fontSize: 14, color: '#78350F', lineHeight: 22 }}>{order.revisionMessage}</Text>
            </View>
          )}
          <View style={[s.detailCard, { backgroundColor: C.accentSoft, borderColor: '#D1FAE5' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-checkmark" size={20} color={C.accent} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#065F46' }}>Escrow Protected — {order.status === 'completed' ? 'Payment released' : 'Funds held securely'}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ═══ REVIEW TAB ═══ */}
      {tab === 'review' && (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 16 }}>Rate your experience</Text>
          <View style={s.starsRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={36} color={C.gold} />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput value={reviewText} onChangeText={setReviewText} placeholder="How was your experience working with this helper?" placeholderTextColor={C.textMuted} multiline style={s.reviewInput} />
          <TouchableOpacity onPress={handleReview} disabled={acting} style={s.reviewBtn}>
            <Text style={s.reviewBtnText}>{acting ? 'Submitting...' : 'Submit Review'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={s.detailRow}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue}>{value}</Text></View>
);

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bgSoft },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  headerStatus: { fontSize: 12, fontWeight: '600' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: C.bgSoft },
  tabActive: { backgroundColor: C.primarySoft },
  tabText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  tabTextActive: { color: C.primary },

  // Chat
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 8 },
  msgAv: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '75%', borderRadius: 18, padding: 12, paddingBottom: 6 },
  bubbleMine: { backgroundColor: C.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, color: C.text, lineHeight: 22 },
  msgTime: { fontSize: 10, color: C.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  sysMsg: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, marginBottom: 10, backgroundColor: C.bgSoft, borderRadius: 12, marginHorizontal: 20, borderWidth: 1, borderColor: C.border },
  sysMsgText: { fontSize: 13, color: C.textSoft, textAlign: 'center', lineHeight: 20 },

  // Input
  inputSection: { borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bgSoft },
  actionBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 8, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, paddingBottom: Platform.OS === 'ios' ? 28 : 8, gap: 8 },
  inputWrap: { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.border, maxHeight: 120 },
  input: { fontSize: 15, color: C.text, maxHeight: 100, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  sendCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },

  // Details
  statusBanner: { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 16 },
  statusTitle: { fontSize: 15, fontWeight: '700' },
  detailCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  detailLabel: { fontSize: 14, color: C.textMuted },
  detailValue: { fontSize: 14, fontWeight: '600', color: C.text },

  // Review
  starsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 20 },
  reviewInput: { backgroundColor: C.bgSoft, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, minHeight: 100, fontSize: 15, color: C.text, textAlignVertical: 'top', marginBottom: 16, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  reviewBtn: { backgroundColor: C.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  reviewBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
