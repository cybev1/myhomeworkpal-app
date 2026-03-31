import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { chatAPI } from '@/services/api';
import { useAuthStore } from '@/context/stores';

const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', accent: '#10B981' };

interface ChatMessage { id: string; content: string; senderId: string; type: 'text' | 'file' | 'system'; createdAt: string; }

export default function ChatScreen() {
  const router = useRouter();
  const { id: convId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<any>(null);
  const currentUserId = user?.id || 'me';

  const fetchMessages = async (quiet = false) => {
    if (!convId) return;
    if (!quiet) setLoading(true);
    try {
      const { data } = await chatAPI.messages(convId as string);
      setMessages(data.messages || data || []);
    } catch {} finally { if (!quiet) setLoading(false); }
  };

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(() => fetchMessages(true), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [convId]);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    const text = message.trim();
    setMessage('');
    setSending(true);
    const tempMsg: ChatMessage = { id: `temp_${Date.now()}`, content: text, senderId: currentUserId, type: 'text', createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);
    try { await chatAPI.send(convId as string, { content: text, type: 'text' }); fetchMessages(true); } catch {} finally { setSending(false); }
  };

  const timeStr = (d: string) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === currentUserId;
    if (item.type === 'system') return (<View style={s.systemMsg}><Ionicons name="shield-checkmark" size={14} color={C.accent} /><Text style={s.systemText}>{item.content}</Text></View>);
    return (
      <View style={[s.msgRow, isMine && s.msgRowMine]}>
        {!isMine && <View style={s.msgAv}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>H</Text></View>}
        <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
          <Text style={[s.msgText, isMine && { color: '#fff' }]}>{item.content}</Text>
          <Text style={[s.msgTime, isMine && { color: 'rgba(255,255,255,0.6)' }]}>{timeStr(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <View style={s.headerInfo}>
          <View style={s.headerAv}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>H</Text></View>
          <View><Text style={s.headerName}>Conversation</Text><Text style={{ fontSize: 11, color: C.accent, fontWeight: '500' }}>Online</Text></View>
        </View>
        <TouchableOpacity style={s.backBtn}><Ionicons name="ellipsis-vertical" size={20} color={C.textSoft} /></TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {loading ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View>
        : messages.length === 0 ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}><Ionicons name="chatbubbles-outline" size={48} color={C.textMuted} /><Text style={{ color: C.textMuted, marginTop: 12, textAlign: 'center', fontSize: 15 }}>Start the conversation! Discuss task details, timeline, and expectations.</Text></View>
        : <FlatList ref={flatListRef} data={messages} keyExtractor={(item) => item.id} renderItem={renderMessage} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} />}
        <View style={s.inputBar}>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={26} color={C.textMuted} /></TouchableOpacity>
          <View style={s.inputWrap}><TextInput value={message} onChangeText={setMessage} placeholder="Type a message..." placeholderTextColor={C.textMuted} style={s.input} multiline maxLength={2000} onSubmitEditing={sendMessage} returnKeyType="send" /></View>
          <TouchableOpacity onPress={sendMessage} disabled={!message.trim() || sending}>
            {message.trim() ? <View style={s.sendCircle}><Ionicons name="send" size={16} color="#fff" /></View> : <Ionicons name="mic-outline" size={22} color={C.textMuted} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bgSoft },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAv: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 15, fontWeight: '700', color: C.text },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  msgRowMine: { justifyContent: 'flex-end' },
  msgAv: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '75%', borderRadius: 18, padding: 12, paddingBottom: 6 },
  bubbleMine: { backgroundColor: C.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, color: C.text, lineHeight: 22 },
  msgTime: { fontSize: 10, color: C.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  systemMsg: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, marginBottom: 12 },
  systemText: { fontSize: 12, color: C.textMuted },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, paddingBottom: Platform.OS === 'ios' ? 30 : 8, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bgSoft, gap: 8 },
  inputWrap: { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.border, maxHeight: 120 },
  input: { fontSize: 15, color: C.text, maxHeight: 100 },
  sendCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
});
