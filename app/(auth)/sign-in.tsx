import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { getErrorMessage } from '../../src/lib/api';

export default function SignIn() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Oops! 😅', 'Please fill in all fields');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Login Failed 😞', getErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Animated background circles */}
      <View style={[styles.bgCircle, styles.bgCircle1]} />
      <View style={[styles.bgCircle, styles.bgCircle2]} />
      <View style={[styles.bgCircle, styles.bgCircle3]} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          {/* Gradient Logo */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            <Text style={styles.logoEmoji}>📚</Text>
          </LinearGradient>
          
          <Text style={styles.title}>Welcome Back! 👋</Text>
          <Text style={styles.subtitle}>
            Continue your amazing learning journey
          </Text>
        </View>

        {/* Form Card with elevation */}
        <View style={styles.formCard}>
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
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot password? 🤔</Text>
          </TouchableOpacity>

          {/* Gradient Button */}
          <TouchableOpacity 
            onPress={handleLogin} 
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.button, isLoading && styles.buttonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <Text style={styles.buttonArrow}>→</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Social Proof */}
        <View style={styles.socialProof}>
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.socialBadge}
          >
            <Text style={styles.socialEmoji}>🚀</Text>
            <Text style={styles.socialText}>
              Join <Text style={styles.socialHighlight}>10,000+</Text> students excelling
            </Text>
          </LinearGradient>
        </View>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New to MyHomeworkPal?</Text>
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/sign-up')}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.linkGradient}
            >
              <Text style={styles.footerLink}>Create Account →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  bgCircle1: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    top: -100,
    right: -100,
  },
  bgCircle2: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    bottom: 150,
    left: -50,
  },
  bgCircle3: {
    width: 150,
    height: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    top: 350,
    left: 30,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 45,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 32,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.12)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 18,
    height: 58,
  },
  inputIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  button: {
    borderRadius: 14,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 8,
    letterSpacing: -0.3,
  },
  buttonArrow: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  socialProof: {
    alignItems: 'center',
    marginBottom: 28,
  },
  socialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
  },
  socialEmoji: {
    fontSize: 20,
  },
  socialText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  socialHighlight: {
    fontWeight: '900',
    color: '#6366F1',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  linkGradient: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 6,
  },
  footerLink: {
    fontSize: 15,
    color: '#6366F1',
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
