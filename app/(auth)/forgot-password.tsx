import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const isWeb = Platform.OS === 'web';
const C = {
  bg: '#FFFFFF', bgSoft: '#F7F8FC',
  text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8',
  border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF',
  accent: '#10B981', accentSoft: '#ECFDF5',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <View style={s.container}>
      <View style={[s.content, isWeb && { maxWidth: 440 }]}>

        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={C.textSoft} />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        {!sent ? (
          <>
            <View style={s.iconWrap}>
              <Ionicons name="lock-open-outline" size={32} color={C.primary} />
            </View>
            <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Reset your password</Text>
            <Text style={s.subtitle}>Enter your email and we'll send you a link to reset your password</Text>

            <Text style={s.label}>Email address</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={C.textMuted} />
              <TextInput
                value={email} onChangeText={setEmail}
                placeholder="you@university.edu" placeholderTextColor={C.textMuted}
                keyboardType="email-address" autoCapitalize="none" style={s.input}
              />
            </View>

            <TouchableOpacity onPress={() => setSent(true)} style={s.primaryBtn} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Send Reset Link</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.sentBox}>
            <View style={s.sentIcon}>
              <Ionicons name="checkmark-circle" size={56} color={C.accent} />
            </View>
            <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Check your email</Text>
            <Text style={s.subtitle}>We've sent a password reset link to</Text>
            <View style={s.emailPill}>
              <Text style={s.emailPillText}>{email}</Text>
            </View>
            <Text style={s.hintText}>Didn't receive an email? Check your spam folder or try again.</Text>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={s.primaryBtn} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSent(false)} style={s.ghostBtn}>
              <Text style={s.ghostBtnText}>Try a different email</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 48 },
  content: { width: '100%' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 36, padding: 4 },
  backText: { fontSize: 14, color: C.textSoft, fontWeight: '500' },

  iconWrap: {
    width: 64, height: 64, borderRadius: 18, backgroundColor: C.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: C.textMuted, lineHeight: 22, marginBottom: 28 },

  label: { fontSize: 13, fontWeight: '600', color: C.textSoft, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, height: 50, gap: 10, marginBottom: 24,
  },
  input: { flex: 1, fontSize: 15, color: C.text, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },

  primaryBtn: {
    backgroundColor: C.primary, borderRadius: 12, height: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  sentBox: { alignItems: 'center' },
  sentIcon: { marginBottom: 20 },
  emailPill: {
    backgroundColor: C.bgSoft, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8,
    marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },
  emailPillText: { fontSize: 14, fontWeight: '600', color: C.text },
  hintText: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  ghostBtn: { marginTop: 16, padding: 8, alignItems: 'center' },
  ghostBtnText: { fontSize: 14, color: C.primary, fontWeight: '600' },
});
