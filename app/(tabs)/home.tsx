import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.full_name.split(' ')[0] || 'Student';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName}! 👋</Text>
            <Text style={styles.subGreeting}>Ready to ace your studies?</Text>
          </View>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {/* Active Tasks Card */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Active Tasks</Text>
          </LinearGradient>

          {/* Completed Card */}
          <LinearGradient
            colors={['#43e97b', '#38f9d7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </LinearGradient>

          {/* Rating Card */}
          <LinearGradient
            colors={['#fa709a', '#fee140']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNumber}>5.0</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </LinearGradient>

          {/* Streak Card */}
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity activeOpacity={0.8}>
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionCard}
          >
            <View style={styles.actionContent}>
              <View>
                <Text style={styles.actionTitle}>📝 Submit New Task</Text>
                <Text style={styles.actionSubtitle}>Get help with homework in minutes</Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8}>
          <LinearGradient
            colors={['#a8edea', '#fed6e3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.actionCard, { marginTop: 12 }]}
          >
            <View style={styles.actionContent}>
              <View>
                <Text style={styles.actionTitle}>🔍 Browse Helpers</Text>
                <Text style={styles.actionSubtitle}>Find the perfect tutor for you</Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Motivational Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteEmoji}>💡</Text>
          <Text style={styles.quoteText}>
            "Every expert was once a beginner. Keep learning!"
          </Text>
        </View>

        {/* Activity Feed */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        <View style={styles.activityCard}>
          <View style={styles.activityEmpty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>
              Submit your first task to get started!
            </Text>
          </View>
        </View>

        {/* Community Stats */}
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.communityCard}
        >
          <Text style={styles.communityEmoji}>🌟</Text>
          <Text style={styles.communityText}>
            Join <Text style={styles.communityHighlight}>10,000+</Text> students achieving their goals
          </Text>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  actionCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  actionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  actionArrow: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1F2937',
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.12)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  quoteEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.12)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  activityEmpty: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
  },
  communityEmoji: {
    fontSize: 28,
  },
  communityText: {
    flex: 1,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  communityHighlight: {
    fontWeight: '900',
    color: '#6366F1',
    fontSize: 16,
  },
});
