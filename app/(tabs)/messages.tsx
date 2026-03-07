import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { chatAPI } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', accent: '#10B981' };

export default function MessagesScreen() {
  const router = useRouter();
  const [convos, setConvos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConvos = async () => {
    try {
      const { data } = await chatAPI.conversations();
      setConvos(data.conversations || data || []);
    } catch (e) {
      console.log('Chat fetch error:', e);
      setConvos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConvos(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConvos();
    setRefreshing(false);
  };

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Messages</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {loading ? (
          <View style={s.loadWrap}><ActivityIndicator size="large" color={C.primary} /></View>
        ) : convos.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={40} color={C.textMuted} />
            <Text style={s.emptyTitle}>No conversations yet</Text>
            <Text style={s.emptyDesc}>Messages with experts will appear here once you start chatting</Text>
          </View>
        ) : (
          convos.map((c: any) => {
            const name = c.participant?.name || c.participant?.full_name || c.name || 'User';
            const msg = c.lastMessage?.content || c.last_message?.content || c.msg || '';
            const unread = c.unreadCount || c.unread_count || 0;
            return (
              <TouchableOpacity key={c.id || c._id} style={s.row} onPress={() => router.push(`/chat/${c.id || c._id}`)}>
                <View style={s.av}>
                  <Text style={s.avText}>{name.split(' ').map((n: string) => n[0]).join('')}</Text>
                  <View style={s.online} />
                </View>
                <View style={s.content}>
                  <View style={s.top}><Text style={s.name}>{name}</Text></View>
                  <View style={s.bottom}>
                    <Text style={s.msg} numberOfLines={1}>{msg}</Text>
                    {unread > 0 && <View style={s.badge}><Text style={s.badgeText}>{unread}</Text></View>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },

  loadWrap: { paddingVertical: 60, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 12 },
  emptyDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', marginTop: 4, paddingHorizontal: 40 },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  av: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  online: { position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: C.accent, borderWidth: 2.5, borderColor: '#fff' },
  content: { flex: 1, marginLeft: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', color: C.text },
  bottom: { flexDirection: 'row', alignItems: 'center' },
  msg: { flex: 1, fontSize: 14, color: C.textMuted },
  badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
