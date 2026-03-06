import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions, FlatList, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius, APP_CONFIG } from '@/constants/theme';
import { useAuthStore, useTaskStore } from '@/context/stores';
import { Button, Card, SectionHeader, Avatar } from '@/components/UI';
import { TaskCard, ServiceCard } from '@/components/Cards';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchTasks } = useTaskStore();
  const [refreshing, setRefreshing] = useState(false);

  const mockTasks = [
    {
      id: '1', title: 'Need help with Calculus II integration problems',
      description: 'I have 15 integration problems from my Calculus II class. Need step-by-step solutions.',
      category: 'math', budget: 35, deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'open' as const, bidsCount: 7, createdAt: new Date(Date.now() - 3600000).toISOString(),
      student: { id: '1', name: 'Sarah K.', role: 'student' as const, createdAt: '' }, studentId: '1',
    },
    {
      id: '2', title: 'Python data analysis project — Pandas & Matplotlib',
      description: 'Complete data analysis project using Python.',
      category: 'cs', budget: 75, deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: 'open' as const, bidsCount: 12, createdAt: new Date(Date.now() - 7200000).toISOString(),
      student: { id: '2', name: 'James M.', role: 'student' as const, createdAt: '' }, studentId: '2',
    },
  ];

  const mockServices = [
    {
      id: '1', title: 'Expert Math Tutoring & Problem Solving',
      description: 'PhD math student. I solve any level math problems with clear step-by-step explanations.',
      category: 'math', price: 15, deliveryDays: 1,
      helper: { id: '10', name: 'Dr. Chen', role: 'helper' as const, rating: 4.9, totalReviews: 234, createdAt: '' },
    },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {}} tintColor={Colors.primary} />}
      >
        <LinearGradient colors={['#0A0F1E', '#151B2E', '#0A0F1E']} style={styles.hero}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greeting}>{greeting()}</Text>
              <Text style={styles.userName}>{user?.name || 'Student'}</Text>
            </View>
            <View style={styles.topActions}>
              <TouchableOpacity style={styles.notifBtn}>
                <Ionicons name="notifications-outline" size={24} color={Colors.light} />
                <View style={styles.notifDot} />
              </TouchableOpacity>
              <Avatar name={user?.name || 'U'} size={40} online />
            </View>
          </View>

          <Card variant="glass" style={styles.heroCard}>
            <Text style={styles.heroCardTitle}>What do you need help with?</Text>
            <TouchableOpacity style={styles.heroSearch} onPress={() => router.push('/explore')}>
              <Ionicons name="search" size={20} color={Colors.muted} />
              <Text style={styles.heroSearchText}>Search tasks, helpers, subjects...</Text>
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <Button title="Post a Task" onPress={() => router.push('/create-task')} icon="add-circle-outline" size="sm" />
              <Button title="Browse Helpers" onPress={() => router.push('/explore')} variant="secondary" icon="people-outline" size="sm" />
            </View>
          </Card>
        </LinearGradient>

        <SectionHeader title="Latest Tasks" action={{ label: 'See All', onPress: () => router.push('/explore') }} />
        {mockTasks.map((task) => (
          <TaskCard key={task.id} task={task} onPress={() => router.push(`/task/${task.id}`)} />
        ))}

        <SectionHeader title="Top Rated Helpers" action={{ label: 'View All', onPress: () => router.push('/explore') }} />
        <FlatList
          horizontal data={mockServices} keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.base }}
          renderItem={({ item }) => <ServiceCard service={item} onPress={() => router.push(`/service/${item.id}`)} />}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  hero: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: Fonts.sizes.sm, color: Colors.subtle, fontWeight: '500' },
  userName: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  notifBtn: { position: 'relative', padding: 4 },
  notifDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  heroCard: { marginTop: Spacing.sm },
  heroCardTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white, marginBottom: Spacing.md },
  heroSearch: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.darkElevated,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  heroSearchText: { fontSize: Fonts.sizes.sm, color: Colors.muted, marginLeft: Spacing.sm },
  heroActions: { flexDirection: 'row', gap: Spacing.md },
});
