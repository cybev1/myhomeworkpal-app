import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const C = { bg: '#FFFFFF', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5' };

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const Section = ({ title, body }: { title: string; body: string }) => (
    <View style={s.section}><Text style={s.sectionTitle}>{title}</Text><Text style={s.body}>{body}</Text></View>
  );
  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={s.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={s.updated}>Last Updated: April 1, 2026</Text>
        <Section title="1. Information We Collect" body="We collect information you provide when creating an account (name, email, password), posting tasks, placing bids, and communicating with other users. We also collect usage data such as device information, IP address, and interaction patterns to improve our services." />
        <Section title="2. How We Use Your Information" body="We use your information to: operate and maintain the platform, facilitate transactions between students and helpers, process payments through our escrow system, send service-related notifications, improve our platform and user experience, and ensure safety and security." />
        <Section title="3. Information Sharing" body="We share your information with: other users as needed to facilitate task completion (e.g., your name and profile with helpers you hire), payment processors to handle transactions, and service providers who help us operate the platform. We never sell your personal information to third parties." />
        <Section title="4. Data Security" body="We implement industry-standard security measures including encryption of data in transit and at rest, secure password hashing, and regular security audits. Payments are processed through secure, PCI-compliant payment processors with escrow protection." />
        <Section title="5. Your Rights" body="You have the right to: access, update, or delete your personal information, opt out of marketing communications, request a copy of your data, and close your account at any time. Contact us at support@myhomeworkpal.com to exercise these rights." />
        <Section title="6. Cookies" body="We use essential cookies to maintain your login session and preferences. We may use analytics cookies to understand how you use our platform. You can manage cookie preferences in your browser settings." />
        <Section title="7. Children's Privacy" body="MyHomeworkPal is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly." />
        <Section title="8. Changes to This Policy" body="We may update this policy from time to time. We will notify you of significant changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the updated policy." />
        <Section title="9. Contact Us" body="If you have questions about this Privacy Policy, please contact us at:\n\nEmail: support@myhomeworkpal.com\nWebsite: https://myhomeworkpal.com" />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F7F8FC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  updated: { fontSize: 12, color: C.textMuted, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 },
  body: { fontSize: 14, color: C.textSoft, lineHeight: 22 },
});
