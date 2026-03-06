import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts, Spacing, Radius, Shadows } from '@/constants/theme';
import { Card, Avatar, Badge, StarRating, Button, FloatingInput, SectionHeader } from '@/components/UI';
import { BidCard } from '@/components/Cards';

const { width } = Dimensions.get('window');

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidDays, setBidDays] = useState('');

  // Mock task data
  const task = {
    id, title: 'Need help with Calculus II integration problems',
    description: 'I have 15 integration problems from my Calculus II class. Need step-by-step solutions with explanations for each technique used (u-substitution, integration by parts, partial fractions, trig substitution). Must show all work clearly.\n\nProblems are from Stewart Calculus 8th edition, Chapter 7.\n\nDeadline is firm — I have an exam next week and need to understand these techniques.',
    category: 'math', budget: 35, deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'open', bidsCount: 7, createdAt: new Date(Date.now() - 3600000).toISOString(),
    student: { id: '1', name: 'Sarah Kim', role: 'student' as const, rating: 4.5, totalReviews: 8, verified: true, createdAt: '' },
    files: ['homework_ch7.pdf'],
  };

  const mockBids = [
    {
      id: '1', amount: 30, message: 'Hi Sarah! I\'m a PhD math student. I can solve all 15 problems with detailed explanations. I\'ll make sure each step is clear for your exam prep.',
      deliveryDays: 1, status: 'pending',
      helper: { id: '10', name: 'Dr. Chen', role: 'helper' as const, rating: 4.9, totalReviews: 234, completedOrders: 198, verified: true, createdAt: '' },
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: '2', amount: 35, message: 'I specialize in Calculus and have helped 100+ students. Will provide video explanations too!',
      deliveryDays: 2, status: 'pending',
      helper: { id: '11', name: 'MathWiz_Alex', role: 'helper' as const, rating: 4.7, totalReviews: 156, completedOrders: 142, verified: false, createdAt: '' },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Sticky header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={Colors.light} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Task info */}
        <View style={styles.taskSection}>
          <View style={styles.metaRow}>
            <Badge label="Open" variant="success" />
            <Text style={styles.categoryTag}>MATHEMATICS</Text>
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDesc}>{task.description}</Text>

          {/* Quick stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Ionicons name="cash-outline" size={18} color={Colors.primaryLight} />
              <Text style={styles.quickStatLabel}>Budget</Text>
              <Text style={styles.quickStatValue}>${task.budget}</Text>
            </View>
            <View style={styles.quickStat}>
              <Ionicons name="time-outline" size={18} color={Colors.accent} />
              <Text style={styles.quickStatLabel}>Deadline</Text>
              <Text style={styles.quickStatValue}>2 days</Text>
            </View>
            <View style={styles.quickStat}>
              <Ionicons name="chatbubbles-outline" size={18} color={Colors.warning} />
              <Text style={styles.quickStatLabel}>Bids</Text>
              <Text style={styles.quickStatValue}>{task.bidsCount}</Text>
            </View>
          </View>

          {/* Files */}
          {task.files && task.files.length > 0 && (
            <View style={styles.filesSection}>
              <Text style={styles.filesTitle}>Attachments</Text>
              {task.files.map((file, idx) => (
                <TouchableOpacity key={idx} style={styles.fileItem}>
                  <Ionicons name="document-outline" size={20} color={Colors.primary} />
                  <Text style={styles.fileName}>{file}</Text>
                  <Ionicons name="download-outline" size={18} color={Colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Student card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posted by</Text>
          <Card variant="glass" style={styles.studentCard}>
            <View style={styles.studentRow}>
              <Avatar name={task.student.name} size={48} verified={task.student.verified} online />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.studentName}>{task.student.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <StarRating rating={task.student.rating || 0} size={14} />
                  <Text style={styles.studentMeta}>({task.student.totalReviews} reviews)</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.msgBtn}>
                <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Bids */}
        <View style={styles.section}>
          <SectionHeader title={`Proposals (${mockBids.length})`} subtitle="From verified helpers" />
          {mockBids.map((bid) => (
            <View key={bid.id} style={{ paddingHorizontal: Spacing.base }}>
              <BidCard bid={bid} isOwner={true} onAccept={() => {}} onReject={() => {}} />
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating bid/action bar */}
      <View style={styles.floatingBar}>
        <LinearGradient
          colors={['transparent', Colors.dark, Colors.dark]}
          style={styles.floatingGradient}
        >
          <View style={styles.floatingContent}>
            <View>
              <Text style={styles.floatingLabel}>Budget</Text>
              <Text style={styles.floatingPrice}>${task.budget}</Text>
            </View>
            <Button
              title="Place Bid"
              onPress={() => setShowBidForm(!showBidForm)}
              icon="paper-plane-outline"
              size="md"
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
    backgroundColor: Colors.dark,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.darkElevated, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  moreBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.darkElevated, alignItems: 'center', justifyContent: 'center',
  },
  taskSection: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  categoryTag: { fontSize: 10, fontWeight: '800', color: Colors.muted, letterSpacing: 1.5 },
  taskTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.white, lineHeight: 30, marginBottom: Spacing.md },
  taskDesc: { fontSize: Fonts.sizes.base, color: Colors.subtle, lineHeight: 24 },
  quickStats: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl,
    backgroundColor: Colors.darkCard, borderRadius: Radius.xl, padding: Spacing.base,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  quickStat: { flex: 1, alignItems: 'center', gap: 4 },
  quickStatLabel: { fontSize: Fonts.sizes.xs, color: Colors.muted },
  quickStatValue: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.white },
  filesSection: { marginTop: Spacing.lg },
  filesTitle: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.subtle, marginBottom: Spacing.sm },
  fileItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.darkCard, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  fileName: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.light },
  section: { marginTop: Spacing.sm },
  sectionTitle: {
    fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.muted,
    letterSpacing: 0.5, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  studentCard: { marginHorizontal: Spacing.base },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  studentName: { fontSize: Fonts.sizes.base, fontWeight: '700', color: Colors.white },
  studentMeta: { fontSize: Fonts.sizes.xs, color: Colors.muted },
  msgBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(108,92,231,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  floatingBar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  floatingGradient: { paddingTop: Spacing['3xl'] },
  floatingContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Platform.OS === 'ios' ? 34 : 16, paddingTop: Spacing.md,
    backgroundColor: Colors.dark, borderTopWidth: 1, borderTopColor: Colors.darkBorder,
  },
  floatingLabel: { fontSize: Fonts.sizes.xs, color: Colors.muted },
  floatingPrice: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.primaryLight },
});
