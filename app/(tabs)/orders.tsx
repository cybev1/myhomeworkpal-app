import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', gold: '#F59E0B', cyan: '#06B6D4' };

export default function OrdersScreen() {
  const router = useRouter();
  const orders = [
    { id: '1', title: 'Calculus II integration problems', budget: 35, status: 'In Progress', helper: 'Dr. Chen', color: C.cyan },
    { id: '2', title: 'Python data analysis project', budget: 75, status: 'Delivered', helper: 'Alex R.', color: C.gold },
    { id: '3', title: 'Renaissance art essay', budget: 50, status: 'Completed', helper: 'Prof. Williams', color: C.accent },
  ];
  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>My Orders</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/create-task')}><Ionicons name="add" size={22} color="#fff" /></TouchableOpacity>
      </View>
      {orders.map((o) => (
        <TouchableOpacity key={o.id} style={s.card} onPress={() => router.push(`/task/${o.id}`)}>
          <View style={s.cardTop}>
            <View style={[s.statusBadge, { backgroundColor: `${o.color}12` }]}><View style={[s.statusDot, { backgroundColor: o.color }]} /><Text style={[s.statusText, { color: o.color }]}>{o.status}</Text></View>
            <Text style={s.budget}>${o.budget}</Text>
          </View>
          <Text style={s.cardTitle}>{o.title}</Text>
          <View style={s.cardBot}>
            <View style={s.helperRow}><View style={s.helperAv}><Text style={s.helperIn}>{o.helper[0]}</Text></View><Text style={s.helperName}>{o.helper}</Text></View>
          </View>
        </TouchableOpacity>
      ))}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: C.text },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: 20, marginBottom: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 18 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  budget: { fontSize: 20, fontWeight: '800', color: C.primary },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text, lineHeight: 22, marginBottom: 10 },
  cardBot: { flexDirection: 'row', alignItems: 'center' },
  helperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  helperAv: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  helperIn: { color: '#fff', fontSize: 12, fontWeight: '700' },
  helperName: { fontSize: 13, color: C.textSoft, fontWeight: '500' },
});
