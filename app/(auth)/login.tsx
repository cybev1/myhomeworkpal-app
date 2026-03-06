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
  accent: '#10B981', error: '#EF4444',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleLogin = async () => {
    const e: any = {};
    if (!email) e.email = 'Email is required';
    if (!password) e.password = 'Password is required';
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.detail || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back to home */}
          <TouchableOpacity onPress={() => router.push('/')} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.textSoft} />
            <Text style={s.backText}>Home</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={s.logoSection}>
            <View style={s.logoIcon}>
              <Ionicons name="school" size={24} color="#fff" />
            </View>
            <Text style={[s.logoName, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>MyHomeworkPal</Text>
          </View>

          {/* Form card */}
          <View style={[s.card, isWeb && { maxWidth: 440 }]}>
            <Text style={[s.title, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Welcome back</Text>
            <Text style={s.subtitle}>Sign in to your account to continue</Text>

            {/* Email */}
            <Text style={s.label}>Email address</Text>
            <View style={[s.inputWrap, errors.email && s.inputError]}>
              <Ionicons name="mail-outline" size={18} color={C.textMuted} />
              <TextInput
                value={email} onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }); }}
                placeholder="you@university.edu" placeholderTextColor={C.textMuted}
                keyboardType="email-address" autoCapitalize="none"
                style={s.input}
              />
            </View>
            {errors.email ? <Text style={s.errorText}>{errors.email}</Text> : null}

            {/* Password */}
            <Text style={s.label}>Password</Text>
            <View style={[s.inputWrap, errors.password && s.inputError]}>
              <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} />
              <TextInput
                value={password} onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }); }}
                placeholder="Enter your password" placeholderTextColor={C.textMuted}
                secureTextEntry={!showPw} style={s.input}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : null}

            {/* Forgot */}
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={s.forgotRow}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={s.primaryBtn} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Sign In</Text>}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or continue with</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Socials */}
            <View style={s.socialRow}>
              {[{ icon: 'logo-google', label: 'Google' }, { icon: 'logo-apple', label: 'Apple' }].map((p) => (
                <TouchableOpacity key={p.icon} style={s.socialBtn}>
                  <Ionicons name={p.icon as any} size={20} color={C.text} />
                  <Text style={s.socialText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom link */}
          <View style={s.bottomRow}>
            <Text style={s.bottomText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={s.bottomLink}>Sign Up</Text>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 32, padding: 4 },
  backText: { fontSize: 14, color: C.textSoft, fontWeight: '500' },

  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoName: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },

  card: {
    width: '100%', backgroundColor: C.bg, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, padding: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 24,
  },
  title: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: C.textMuted, marginBottom: 28 },

  label: { fontSize: 13, fontWeight: '600', color: C.textSoft, marginBottom: 6, marginTop: 16 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, height: 50, gap: 10,
  },
  inputError: { borderColor: C.error },
  input: { flex: 1, fontSize: 15, color: C.text, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  errorText: { fontSize: 12, color: C.error, marginTop: 4 },

  forgotRow: { alignSelf: 'flex-end', marginTop: 12, marginBottom: 24 },
  forgotText: { fontSize: 13, color: C.primary, fontWeight: '600' },

  primaryBtn: {
    backgroundColor: C.primary, borderRadius: 12, height: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
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
