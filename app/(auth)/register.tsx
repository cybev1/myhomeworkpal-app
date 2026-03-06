import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { FloatingInput, Button } from '@/components/UI';
import { useAuthStore } from '@/context/stores';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'helper'>('student');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, role });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0F1E', '#111827', '#0A0F1E']} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, { top: -120, left: -60, backgroundColor: Colors.accent }]} />
      <View style={[styles.orb, { bottom: -80, right: -40, backgroundColor: Colors.primary }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Back button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.light} />
          </TouchableOpacity>

          <View style={styles.brandSection}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Join thousands of students and helpers</Text>
          </View>

          <View style={styles.formCard}>
            {/* Role selector */}
            <Text style={styles.roleLabel}>I want to</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                onPress={() => setRole('student')}
                style={[styles.roleCard, role === 'student' && styles.roleCardActive]}
              >
                <LinearGradient
                  colors={role === 'student' ? ['rgba(108,92,231,0.15)', 'rgba(108,92,231,0.05)'] : [Colors.darkCard, Colors.darkCard]}
                  style={styles.roleCardInner}
                >
                  <Ionicons name="school-outline" size={28} color={role === 'student' ? Colors.primary : Colors.muted} />
                  <Text style={[styles.roleText, role === 'student' && { color: Colors.white }]}>Get Help</Text>
                  <Text style={styles.roleDesc}>Post tasks & hire experts</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('helper')}
                style={[styles.roleCard, role === 'helper' && styles.roleCardActive]}
              >
                <LinearGradient
                  colors={role === 'helper' ? ['rgba(0,210,255,0.15)', 'rgba(0,210,255,0.05)'] : [Colors.darkCard, Colors.darkCard]}
                  style={styles.roleCardInner}
                >
                  <Ionicons name="rocket-outline" size={28} color={role === 'helper' ? Colors.accent : Colors.muted} />
                  <Text style={[styles.roleText, role === 'helper' && { color: Colors.white }]}>Earn Money</Text>
                  <Text style={styles.roleDesc}>Offer your expertise</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <FloatingInput label="Full Name" value={name} onChangeText={setName} placeholder="John Doe" icon="person-outline" />
            <FloatingInput label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" icon="mail-outline" />
            <FloatingInput label="Password" value={password} onChangeText={setPassword} placeholder="Min 8 characters" secureTextEntry icon="lock-closed-outline" />

            <Button title="Create Account" onPress={handleRegister} loading={loading} fullWidth size="lg" style={{ marginTop: Spacing.base }} />

            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.06 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingVertical: Spacing['2xl'] },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.darkElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.darkBorder, marginBottom: Spacing.lg,
  },
  brandSection: { marginBottom: Spacing.xl },
  formTitle: { fontSize: Fonts.sizes['2xl'], fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  formSubtitle: { fontSize: Fonts.sizes.base, color: Colors.muted, marginTop: 4 },
  formCard: {
    backgroundColor: 'rgba(17,24,39,0.8)', borderRadius: Radius['2xl'],
    padding: Spacing.xl, borderWidth: 1, borderColor: 'rgba(108,92,231,0.12)',
  },
  roleLabel: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.subtle, marginBottom: Spacing.sm },
  roleRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  roleCard: { flex: 1, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.darkBorder },
  roleCardActive: { borderColor: Colors.primary },
  roleCardInner: { padding: Spacing.base, alignItems: 'center', gap: 4 },
  roleText: { fontSize: Fonts.sizes.base, fontWeight: '700', color: Colors.muted },
  roleDesc: { fontSize: Fonts.sizes.xs, color: Colors.muted, textAlign: 'center' },
  termsText: { fontSize: Fonts.sizes.xs, color: Colors.muted, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 18 },
  termsLink: { color: Colors.primary, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  loginText: { fontSize: Fonts.sizes.base, color: Colors.muted },
  loginLink: { fontSize: Fonts.sizes.base, color: Colors.primary, fontWeight: '700' },
});
