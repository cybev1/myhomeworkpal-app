import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { getErrorMessage } from '../../src/lib/api';

export default function SignUp() {
  const router = useRouter();
  const { signup, isLoading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'helper'>('student');

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Oops! 😅', 'Please fill in all fields');
      return;
    }
    try {
      await signup({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        role,
      });
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Signup Failed 😞', getErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={[styles.bgCircle, styles.bgCircle1]} />
      <View style={[styles.bgCircle, styles.bgCircle2]} />
      <View style={[styles.bgCircle, styles.bgCircle3]} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            <Text style={styles.logoEmoji}>🎓</Text>
          </LinearGradient>
          
          <Text style={styles.title}>Join MyHomeworkPal! 🎉</Text>
          <Text style={styles.subtitle}>
            Start your success story today
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="student@university.edu"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>I am a:</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                onPress={() => setRole('student')}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={role === 'student' ? ['#667eea', '#764ba2'] : ['#F9FAFB', '#F9FAFB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.roleButton, role !== 'student' && styles.roleButtonInactive]}
                >
                  <Text style={styles.roleEmoji}>📚</Text>
                  <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>
                    Student
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('helper')}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={role === 'helper' ? ['#43e97b', '#38f9d7'] : ['#F9FAFB', '#F9FAFB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.roleButton, role !== 'helper' && styles.roleButtonInactive]}
                >
                  <Text style={styles.roleEmoji}>👨‍🏫</Text>
                  <Text style={[styles.roleText, role === 'helper' && styles.roleTextActive]}>
                    Helper
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.button, isLoading && styles.buttonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Create Account</Text>
                  <Text style={styles.buttonArrow}>→</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['rgba(240, 147, 251, 0.1)', 'rgba(245, 87, 108, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.benefitCard}
        >
          <Text style={styles.benefitText}>
            ✨ Free • 🚫 No Credit Card • 🔒 100% Secure
          </Text>
        </LinearGradient>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/sign-in')}
            disabled={isLoading}
          >
            <Text style={styles.footerLink}>Sign In →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  bgCircle: { position: 'absolute', borderRadius: 9999 },
  bgCircle1: {
    width: 300, height: 300,
    backgroundColor: 'rgba(240, 147, 251, 0.08)',
    top: -100, right: -100,
  },
  bgCircle2: {
    width: 200, height: 200,
    backgroundColor: 'rgba(67, 233, 123, 0.08)',
    bottom: 150, left: -50,
  },
  bgCircle3: {
    width: 150, height: 150,
    backgroundColor: 'rgba(79, 172, 254, 0.08)',
    top: 350, right: 30,
  },
  scrollContent: {
    flexGrow: 1, padding: 24,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
  },
  hero: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 90, height: 90, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 20,
    elevation: 12,
  },
  logoEmoji: { fontSize: 45 },
  title: {
    fontSize: 36, fontWeight: '900',
    color: '#1F2937', marginBottom: 12,
    textAlign: 'center', letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17, color: '#6B7280',
    textAlign: 'center', lineHeight: 26,
    paddingHorizontal: 32, fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF', borderRadius: 28,
    padding: 28, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(240, 147, 251, 0.12)',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24,
    elevation: 12,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 15, fontWeight: '700',
    color: '#1F2937', marginBottom: 10,
    letterSpacing: -0.2,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 14,
    borderWidth: 2, borderColor: '#E5E7EB',
    paddingHorizontal: 18, height: 58,
  },
  inputIcon: { fontSize: 22, marginRight: 12 },
  input: {
    flex: 1, fontSize: 16,
    color: '#1F2937', fontWeight: '500',
  },
  roleContainer: {
    flexDirection: 'row', gap: 12,
  },
  roleButton: {
    flex: 1, alignItems: 'center',
    paddingVertical: 20, borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8,
    elevation: 4,
  },
  roleButtonInactive: {
    borderWidth: 2, borderColor: '#E5E7EB',
  },
  roleEmoji: { fontSize: 32, marginBottom: 8 },
  roleText: {
    fontSize: 16, fontWeight: '700',
    color: '#6B7280',
  },
  roleTextActive: { color: '#FFFFFF' },
  button: {
    borderRadius: 14, minHeight: 58,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonContent: {
    flexDirection: 'row', alignItems: 'center',
  },
  buttonText: {
    fontSize: 17, fontWeight: '800',
    color: '#FFFFFF', marginRight: 8,
    letterSpacing: -0.3,
  },
  buttonArrow: {
    fontSize: 22, color: '#FFFFFF',
    fontWeight: 'bold',
  },
  benefitCard: {
    padding: 18, borderRadius: 16,
    marginBottom: 24, alignItems: 'center',
  },
  benefitText: {
    fontSize: 15, color: '#6B7280',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 10,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 15, color: '#6B7280',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 15, color: '#EC4899',
    fontWeight: '800', letterSpacing: -0.2,
  },
});
