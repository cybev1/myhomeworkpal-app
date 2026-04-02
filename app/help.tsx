import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', gold: '#F59E0B' };

const FAQS = [
  { q: 'How do I post a task?', a: 'Go to your Dashboard and tap "Post Task". Fill in the title, description, category, budget, and deadline. Posting is free — you only pay when you accept a bid.' },
  { q: 'How does escrow work?', a: 'When you accept a bid, funds move from your wallet to escrow. The helper only receives payment after you approve their work. If there is a dispute, funds stay in escrow until resolved.' },
  { q: 'What is the platform fee?', a: 'MyHomeworkPal charges a commission on completed orders (default 20%). The fee is deducted from the helper payment. Example: $100 order → helper receives $80, platform keeps $20.' },
  { q: 'How do revisions work?', a: 'Each order includes free revisions (default 2). After delivery, you can request changes. Once the revision limit is reached, you must approve or open a dispute.' },
  { q: 'What happens if I do not review a delivery?', a: 'Orders auto-approve after a set number of days (default 3). If you do not approve or request revision within that time, the order completes and payment releases automatically.' },
  { q: 'How do I withdraw my earnings?', a: 'Go to Wallet → Withdraw. Minimum withdrawal is $10. Recently completed orders have a clearance period (default 14 days) before funds become available for withdrawal.' },
  { q: 'How do I become a Pro/Verified helper?', a: 'Go to Account → Upgrade to Pro. Verified Pro helpers get a badge, priority placement in search results, and higher trust from students. The upgrade costs a one-time fee.' },
  { q: 'How do I open a dispute?', a: 'From the order workspace, tap "Dispute". A moderator will review the case within 24-48 hours. Escrow funds are frozen during the dispute.' },
  { q: 'Can I cancel an order?', a: 'Contact the other party via the order chat first. If you cannot resolve it, open a dispute and a moderator will help. Refunds are processed within 3-5 business days.' },
];

export default function HelpCenter() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = FAQS.filter(f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={s.headerTitle}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={18} color={C.textMuted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search help topics..." placeholderTextColor={C.textMuted} style={s.searchInput} />
        </View>

        <View style={s.contactCard}>
          <Text style={s.contactTitle}>Need help?</Text>
          <Text style={s.contactDesc}>Our support team is available 24/7</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:support@myhomeworkpal.com')} style={s.contactBtn}>
              <Ionicons name="mail" size={16} color="#fff" /><Text style={s.contactBtnText}>Email Support</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/messages')} style={[s.contactBtn, { backgroundColor: C.accent }]}>
              <Ionicons name="chatbubble" size={16} color="#fff" /><Text style={s.contactBtnText}>Live Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
        {filtered.map((faq, i) => (
          <TouchableOpacity key={i} onPress={() => setExpanded(expanded === i ? null : i)} style={s.faqCard} activeOpacity={0.7}>
            <View style={s.faqHeader}>
              <Text style={s.faqQ}>{faq.q}</Text>
              <Ionicons name={expanded === i ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMuted} />
            </View>
            {expanded === i && <Text style={s.faqA}>{faq.a}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft, borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: C.border, gap: 8, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 15, color: C.text, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  contactCard: { backgroundColor: C.primarySoft, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.primary + '20', marginBottom: 20 },
  contactTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  contactDesc: { fontSize: 14, color: C.textMuted, marginTop: 4 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  contactBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 12 },
  faqCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 14, fontWeight: '600', color: C.text, flex: 1, marginRight: 8 },
  faqA: { fontSize: 14, color: C.textSoft, lineHeight: 22, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
});
