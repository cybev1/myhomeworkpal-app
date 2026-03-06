import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', accent: '#10B981' };

export default function MessagesScreen() {
  const router = useRouter();
  const convos = [
    { id: '1', name: 'Dr. Chen', msg: "I've started working on the integration problems!", time: '10m ago', unread: 2 },
    { id: '2', name: 'Alex R.', msg: 'The Python project is ready for review.', time: '1h ago', unread: 0 },
    { id: '3', name: 'Prof. Williams', msg: 'Thank you for the 5-star review!', time: '1d ago', unread: 0 },
  ];
  return (
    <View style={s.page}>
      <View style={s.header}>
        <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Messages</Text>
      </View>
      <ScrollView>
        {convos.map((c) => (
          <TouchableOpacity key={c.id} style={s.row} onPress={() => router.push(`/chat/${c.id}`)}>
            <View style={s.av}><Text style={s.avText}>{c.name.split(' ').map(n=>n[0]).join('')}</Text><View style={s.online} /></View>
            <View style={s.content}>
              <View style={s.top}><Text style={s.name}>{c.name}</Text><Text style={s.time}>{c.time}</Text></View>
              <View style={s.bottom}><Text style={s.msg} numberOfLines={1}>{c.msg}</Text>
                {c.unread > 0 && <View style={s.badge}><Text style={s.badgeText}>{c.unread}</Text></View>}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: C.text },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  av: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  online: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: C.accent, borderWidth: 2, borderColor: C.bg },
  content: { flex: 1, marginLeft: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '600', color: C.text },
  time: { fontSize: 12, color: C.textMuted },
  bottom: { flexDirection: 'row', alignItems: 'center' },
  msg: { flex: 1, fontSize: 13, color: C.textMuted },
  badge: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
