import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/context/stores';

const isWeb = Platform.OS === 'web';
const C = {
  bg: '#FFFFFF', bgSoft: '#F7F8FC', bgMuted: '#F0F2F8',
  text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8',
  border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF',
  accent: '#10B981', accentSoft: '#ECFDF5', cyan: '#06B6D4', cyanSoft: '#ECFEFF',
  error: '#EF4444',
};

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'helper'>('student');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleRegister = async () => {
    const e: any = {};
    if (!name) e.name = 'Name is required';
    if (!email) e.email = 'Email is required';
    if (!password || password.length < 8) e.password = 'Min 8 characters';
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      await register({ name, email, password, role });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.detail || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.textSoft} />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={s.header}>
            <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Create your account</Text>
            <Text style={s.subtitle}>Join thousands of students and experts</Text>
          </View>

          {/* Card */}
          <View style={[s.card, isWeb && { maxWidth: 480 }]}>

            {/* Role selector */}
            <Text style={s.label}>I want to</Text>
            <View style={s.roleRow}>
              <TouchableOpacity
                onPress={() => setRole('student')}
                style={[s.roleCard, role === 'student' && s.roleActive]}
              >
                <Ionicons name="school-outline" size={24} color={role === 'student' ? C.primary : C.textMuted} />
                <Text style={[s.roleTitle, role === 'student' && { color: C.primary }]}>Get Help</Text>
                <Text style={s.roleDesc}>Post tasks & hire experts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRole('helper')}
                style={[s.roleCard, role === 'helper' && s.roleActiveAlt]}
              >
                <Ionicons name="rocket-outline" size={24} color={role === 'helper' ? C.accent : C.textMuted} />
                <Text style={[s.roleTitle, role === 'helper' && { color: C.accent }]}>Earn Money</Text>
                <Text style={s.roleDesc}>Offer your expertise</Text>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text style={s.label}>Full name</Text>
            <View style={[s.inputWrap, errors.name && s.inputError]}>
              <Ionicons name="person-outline" size={18} color={C.textMuted} />
              <TextInput value={name} onChangeText={(t) => { setName(t); setErrors({ ...errors, name: '' }); }}
                placeholder="John Doe" placeholderTextColor={C.textMuted} style={s.input} />
            </View>
            {errors.name ? <Text style={s.errorText}>{errors.name}</Text> : null}

            {/* Email */}
            <Text style={s.label}>Email address</Text>
            <View style={[s.inputWrap, errors.email && s.inputError]}>
              <Ionicons name="mail-outline" size={18} color={C.textMuted} />
              <TextInput value={email} onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }); }}
                placeholder="you@university.edu" placeholderTextColor={C.textMuted}
                keyboardType="email-address" autoCapitalize="none" style={s.input} />
            </View>
            {errors.email ? <Text style={s.errorText}>{errors.email}</Text> : null}

            {/* Password */}
            <Text style={s.label}>Password</Text>
            <View style={[s.inputWrap, errors.password && s.inputError]}>
              <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} />
              <TextInput value={password} onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }); }}
                placeholder="Min 8 characters" placeholderTextColor={C.textMuted}
                secureTextEntry style={s.input} />
            </View>
            {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : null}

            {/* Submit */}
            <TouchableOpacity onPress={handleRegister} disabled={loading} style={s.primaryBtn} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Create Account</Text>}
            </TouchableOpacity>

            {/* Terms */}
            <Text style={s.terms}>
              By signing up, you agree to our{' '}
              <Text style={s.termsLink}>Terms of Service</Text>{' '}and{' '}
              <Text style={s.termsLink}>Privacy Policy</Text>
            </Text>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or sign up with</Text>
              <View style={s.dividerLine} />
            </View>

            <View style={s.socialRow}>
              {[{ icon: 'logo-google', label: 'Google' }, { icon: 'logo-apple', label: 'Apple' }].map((p) => (
                <TouchableOpacity key={p.icon} style={s.socialBtn}>
                  <Ionicons name={p.icon as any} size={20} color={C.text} />
                  <Text style={s.socialText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.bottomRow}>
            <Text style={s.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={s.bottomLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 24, padding: 4 },
  backText: { fontSize: 14, color: C.textSoft, fontWeight: '500' },

  header: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 15, color: C.textMuted },

  card: {
    width: '100%', backgroundColor: C.bg, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, padding: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 24,
  },

  label: { fontSize: 13, fontWeight: '600', color: C.textSoft, marginBottom: 6, marginTop: 16 },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleCard: {
    flex: 1, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, gap: 4,
  },
  roleActive: { borderColor: C.primary, backgroundColor: C.primarySoft },
  roleActiveAlt: { borderColor: C.accent, backgroundColor: C.accentSoft },
  roleTitle: { fontSize: 14, fontWeight: '700', color: C.textMuted },
  roleDesc: { fontSize: 11, color: C.textMuted, textAlign: 'center' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, height: 50, gap: 10,
  },
  inputError: { borderColor: C.error },
  input: { flex: 1, fontSize: 15, color: C.text, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  errorText: { fontSize: 12, color: C.error, marginTop: 4 },

  primaryBtn: {
    backgroundColor: C.primary, borderRadius: 12, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  terms: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  termsLink: { color: C.primary, fontWeight: '600' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { paddingHorizontal: 12, fontSize: 12, color: C.textMuted },

  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12, height: 48, backgroundColor: C.bg,
  },
  socialText: { fontSize: 14, fontWeight: '600', color: C.text },

  bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  bottomText: { fontSize: 15, color: C.textMuted },
  bottomLink: { fontSize: 15, color: C.primary, fontWeight: '700' },
});
