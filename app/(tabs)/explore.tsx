import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, FlatList, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius, APP_CONFIG } from '@/constants/theme';
import { Card, Badge, Button, SectionHeader, EmptyState } from '@/components/UI';
import { TaskCard, ServiceCard } from '@/components/Cards';

const { width } = Dimensions.get('window');

type TabType = 'tasks' | 'helpers' | 'services';

export default function ExploreScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');

  // Mock data
  const mockTasks = [
    {
      id: '1', title: 'Statistics homework — hypothesis testing',
      description: 'Need help with 10 hypothesis testing problems. Must show work and explain conclusions.',
      category: 'math', budget: 40, deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'open' as const, bidsCount: 5, createdAt: new Date(Date.now() - 1800000).toISOString(),
      student: { id: '1', name: 'Taylor S.', role: 'student' as const, createdAt: '' }, studentId: '1',
    },
    {
      id: '2', title: 'React Native mobile app UI implementation',
      description: 'Need a developer to implement 5 screens from Figma designs. Must use TypeScript and follow best practices.',
      category: 'cs', budget: 120, deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
      status: 'open' as const, bidsCount: 18, createdAt: new Date(Date.now() - 3600000).toISOString(),
      student: { id: '2', name: 'Chris P.', role: 'student' as const, createdAt: '' }, studentId: '2',
    },
    {
      id: '3', title: 'Business case study analysis — 3000 words',
      description: 'Analyze the Netflix business model using Porter\'s Five Forces and SWOT. APA format required.',
      category: 'business', budget: 65, deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
      status: 'open' as const, bidsCount: 8, createdAt: new Date(Date.now() - 7200000).toISOString(),
      student: { id: '3', name: 'Maria L.', role: 'student' as const, createdAt: '' }, studentId: '3',
    },
    {
      id: '4', title: 'Organic Chemistry lab report',
      description: 'Write lab report for aldol condensation experiment. Include all calculations, error analysis, and conclusion.',
      category: 'science', budget: 55, deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
      status: 'open' as const, bidsCount: 3, createdAt: new Date(Date.now() - 600000).toISOString(),
      student: { id: '4', name: 'David K.', role: 'student' as const, createdAt: '' }, studentId: '4',
    },
  ];

  const mockServices = [
    {
      id: '1', title: 'Expert Math Tutoring & Solutions',
      description: 'PhD math student. Algebra through graduate-level analysis.',
      category: 'math', price: 15, deliveryDays: 1,
      helper: { id: '10', name: 'Dr. Chen', role: 'helper' as const, rating: 4.9, totalReviews: 234, createdAt: '' },
    },
    {
      id: '2', title: 'Full-Stack Development Assignments',
      description: 'Software engineer. Python, Java, C++, JavaScript, SQL.',
      category: 'cs', price: 25, deliveryDays: 2,
      helper: { id: '11', name: 'Alex R.', role: 'helper' as const, rating: 4.8, totalReviews: 189, createdAt: '' },
    },
    {
      id: '3', title: 'Academic Writing & Research Papers',
      description: 'Published author with MA. APA, MLA, Chicago, Harvard.',
      category: 'english', price: 20, deliveryDays: 2,
      helper: { id: '12', name: 'Prof. Williams', role: 'helper' as const, rating: 5.0, totalReviews: 312, createdAt: '' },
    },
  ];

  const filteredTasks = selectedCategory
    ? mockTasks.filter((t) => t.category === selectedCategory)
    : mockTasks;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={22} color={Colors.light} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tasks, helpers, subjects..."
            placeholderTextColor={Colors.muted}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(['tasks', 'helpers', 'services'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {activeTab === tab && (
              <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.tabIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory(null)}
          style={[styles.chip, !selectedCategory && styles.chipActive]}
        >
          <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {APP_CONFIG.categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
            style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {activeTab === 'tasks' && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>{filteredTasks.length} tasks found</Text>
              <TouchableOpacity style={styles.sortBtn}>
                <Ionicons name="swap-vertical" size={16} color={Colors.primary} />
                <Text style={styles.sortText}>Newest</Text>
              </TouchableOpacity>
            </View>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => router.push(`/task/${task.id}`)}
              />
            ))}
          </>
        )}

        {activeTab === 'services' && (
          <View style={{ paddingHorizontal: Spacing.base }}>
            {mockServices.map((service) => (
              <View key={service.id} style={{ marginBottom: Spacing.md }}>
                <ServiceCard
                  service={service}
                  onPress={() => router.push(`/service/${service.id}`)}
                />
              </View>
            ))}
          </View>
        )}

        {activeTab === 'helpers' && (
          <EmptyState
            icon="people-outline"
            title="Top Helpers"
            message="Browse verified experts in every subject area"
            action={{ label: 'Coming Soon', onPress: () => {} }}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Fonts.sizes['2xl'],
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  filterBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.darkElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  searchContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCard,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: Fonts.sizes.base,
    marginLeft: Spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.xl,
  },
  tab: { paddingVertical: Spacing.sm, position: 'relative' },
  tabActive: {},
  tabText: { fontSize: Fonts.sizes.base, fontWeight: '600', color: Colors.muted },
  tabTextActive: { color: Colors.white },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  chipRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    marginRight: Spacing.sm,
  },
  chipActive: {
    backgroundColor: 'rgba(108,92,231,0.15)',
    borderColor: Colors.primary,
  },
  chipText: { fontSize: Fonts.sizes.sm, color: Colors.muted, fontWeight: '500' },
  chipTextActive: { color: Colors.primaryLight },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  resultsCount: { fontSize: Fonts.sizes.sm, color: Colors.muted },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
});
