import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  const firstName = user?.full_name.split(' ')[0] || 'User';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient Avatar */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarLarge}
          >
            <Text style={styles.avatarLargeText}>{initial}</Text>
          </LinearGradient>
          
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.roleBadge}
          >
            <Text style={styles.roleBadgeText}>
              {user?.role === 'student' ? '📚 Student' : '👨‍🏫 Helper'}
            </Text>
          </LinearGradient>
        </View>

        {/* Achievement Cards */}
        <View style={styles.achievementsGrid}>
          <LinearGradient
            colors={['#fa709a', '#fee140']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.achievementCard}
          >
            <Text style={styles.achievementEmoji}>🏆</Text>
            <Text style={styles.achievementNumber}>0</Text>
            <Text style={styles.achievementLabel}>Tasks</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#a8edea', '#fed6e3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.achievementCard}
          >
            <Text style={styles.achievementEmoji}>💎</Text>
            <Text style={styles.achievementNumber}>1</Text>
            <Text style={styles.achievementLabel}>Level</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#ffecd2', '#fcb69f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.achievementCard}
          >
            <Text style={styles.achievementEmoji}>⭐</Text>
            <Text style={styles.achievementNumber}>5.0</Text>
            <Text style={styles.achievementLabel}>Rating</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#ff9a9e', '#fecfef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.achievementCard}
          >
            <Text style={styles.achievementEmoji}>🔥</Text>
            <Text style={styles.achievementNumber}>0</Text>
            <Text style={styles.achievementLabel}>Streak</Text>
          </LinearGradient>
        </View>

        {/* Account Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📧 Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👤 Role</Text>
            <Text style={styles.infoValue}>
              {user?.role === 'student' ? 'Student' : 'Helper'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>✅ Status</Text>
            <Text style={[styles.infoValue, styles.statusActive]}>Active</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Progress This Month</Text>
            <Text style={styles.progressPercent}>0%</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBar, { width: '0%' }]}
            />
          </View>
          
          <Text style={styles.progressText}>Complete your first task to start tracking progress! 🎯</Text>
        </View>

        {/* Recent Achievements */}
        <View style={styles.achievementsListCard}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          
          <View style={styles.achievementItem}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.achievementIcon}
            >
              <Text style={styles.achievementIconEmoji}>🌟</Text>
            </LinearGradient>
            <View style={styles.achievementItemText}>
              <Text style={styles.achievementItemTitle}>Welcome!</Text>
              <Text style={styles.achievementItemDesc}>Account created successfully</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient
            colors={['#ff6b6b', '#ee5a6f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Logout</Text>
            <Text style={styles.logoutEmoji}>👋</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>MyHomeworkPal v2.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  scrollContent: {
    padding: 24, paddingTop: 60, paddingBottom: 40,
  },
  header: {
    alignItems: 'center', marginBottom: 32,
  },
  avatarLarge: {
    width: 100, height: 100, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 20,
    elevation: 12,
  },
  avatarLargeText: {
    fontSize: 48, fontWeight: '900', color: '#FFFFFF',
  },
  name: {
    fontSize: 28, fontWeight: '900', color: '#1F2937',
    marginBottom: 4, letterSpacing: -0.5,
  },
  email: {
    fontSize: 15, color: '#6B7280',
    marginBottom: 16, fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 4,
  },
  roleBadgeText: {
    fontSize: 14, fontWeight: '800',
    color: '#FFFFFF', letterSpacing: -0.2,
  },
  achievementsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, marginBottom: 24,
  },
  achievementCard: {
    flex: 1, minWidth: '47%',
    padding: 20, borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 12,
    elevation: 6,
  },
  achievementEmoji: { fontSize: 36, marginBottom: 8 },
  achievementNumber: {
    fontSize: 28, fontWeight: '900',
    color: '#1F2937', marginBottom: 4,
  },
  achievementLabel: {
    fontSize: 13, fontWeight: '600',
    color: '#4B5563',
  },
  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24,
    padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.12)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: '800',
    color: '#1F2937', marginBottom: 16,
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 15, color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15, fontWeight: '700',
    color: '#1F2937',
  },
  statusActive: { color: '#10B981' },
  progressCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24,
    padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.12)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 12,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  progressPercent: {
    fontSize: 24, fontWeight: '900',
    color: '#6366F1',
  },
  progressBarContainer: {
    height: 12, backgroundColor: '#F3F4F6',
    borderRadius: 6, marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%', borderRadius: 6,
  },
  progressText: {
    fontSize: 14, color: '#6B7280',
    textAlign: 'center', fontWeight: '500',
  },
  achievementsListCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24,
    padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.12)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 12,
    elevation: 4,
  },
  achievementItem: {
    flexDirection: 'row', alignItems: 'center',
  },
  achievementIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  achievementIconEmoji: { fontSize: 24 },
  achievementItemText: { flex: 1 },
  achievementItemTitle: {
    fontSize: 16, fontWeight: '800',
    color: '#1F2937', marginBottom: 2,
  },
  achievementItemDesc: {
    fontSize: 14, color: '#6B7280',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 18,
    borderRadius: 16, marginBottom: 24,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12,
    elevation: 6,
  },
  logoutText: {
    fontSize: 17, fontWeight: '800',
    color: '#FFFFFF', marginRight: 8,
  },
  logoutEmoji: { fontSize: 20 },
  footer: { alignItems: 'center', paddingVertical: 20 },
  footerText: {
    fontSize: 13, color: '#9CA3AF',
    fontWeight: '500',
  },
});
