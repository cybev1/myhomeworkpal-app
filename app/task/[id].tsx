import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { Card, Avatar, Badge, StarRating, Button, SectionHeader } from '@/components/UI';
import { BidCard } from '@/components/Cards';
import { tasksAPI, bidsAPI } from '@/services/api';

const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5' };

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [task, setTask] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await tasksAPI.get(id as string);
        setTask(data);
        try {
          const bidsRes = await bidsAPI.list(id as string);
          setBids(bidsRes.data.bids || bidsRes.data || []);
        } catch {}
      } catch (e) {
        console.log('Task fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={C.textMuted} />
        <Text style={{ fontSize: 17, color: C.text, fontWeight: '600', marginTop: 12 }}>Task not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: C.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const studentName = task.student?.name || task.student?.full_name || 'Student';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.textSoft} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={C.textSoft} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.taskSection}>
          <View style={styles.metaRow}>
            <Badge label={(task.status || 'open').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} variant="success" />
            <Text style={styles.categoryTag}>{(task.category || '').toUpperCase()}</Text>
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDesc}>{task.description}</Text>

          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Ionicons name="cash-outline" size={18} color={C.primary} />
              <Text style={styles.quickStatLabel}>Budget</Text>
              <Text style={styles.quickStatValue}>${task.budget}</Text>
            </View>
            <View style={styles.quickStat}>
              <Ionicons name="time-outline" size={18} color="#06B6D4" />
              <Text style={styles.quickStatLabel}>Deadline</Text>
              <Text style={styles.quickStatValue}>{task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}</Text>
            </View>
            <View style={styles.quickStat}>
              <Ionicons name="chatbubbles-outline" size={18} color="#F59E0B" />
              <Text style={styles.quickStatLabel}>Bids</Text>
              <Text style={styles.quickStatValue}>{task.bidsCount || task.bids_count || bids.length}</Text>
            </View>
          </View>

          {task.files && task.files.length > 0 && (
            <View style={styles.filesSection}>
              <Text style={styles.filesTitle}>Attachments</Text>
              {task.files.map((file: string, idx: number) => (
                <TouchableOpacity key={idx} style={styles.fileItem}>
                  <Ionicons name="document-outline" size={20} color={C.primary} />
                  <Text style={styles.fileName}>{file}</Text>
                  <Ionicons name="download-outline" size={18} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {task.student && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posted by</Text>
            <Card variant="glass" style={styles.studentCard}>
              <View style={styles.studentRow}>
                <Avatar name={studentName} size={48} verified={task.student.verified} online />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.studentName}>{studentName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <StarRating rating={task.student.rating || 0} size={14} />
                    <Text style={styles.studentMeta}>({task.student.totalReviews || task.student.total_reviews || 0} reviews)</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.msgBtn}>
                  <Ionicons name="chatbubble-outline" size={18} color={C.primary} />
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}

        {bids.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={`Proposals (${bids.length})`} subtitle="From verified helpers" />
            {bids.map((bid: any) => (
              <View key={bid.id || bid._id} style={{ paddingHorizontal: Spacing.base }}>
                <BidCard bid={bid} isOwner={true} onAccept={() => {}} onReject={() => {}} />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.floatingBar}>
        <LinearGradient colors={['transparent', '#FFFFFF', '#FFFFFF']} style={styles.floatingGradient}>
          <View style={styles.floatingContent}>
            <View>
              <Text style={styles.floatingLabel}>Budget</Text>
              <Text style={styles.floatingPrice}>${task.budget}</Text>
            </View>
            <Button title="Place Bid" onPress={() => {}} icon="paper-plane-outline" size="md" />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#E4E7F0', backgroundColor: '#FFFFFF',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F2F8', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: '#1A1D2B' },
  moreBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F2F8', alignItems: 'center', justifyContent: 'center' },
  taskSection: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  categoryTag: { fontSize: 10, fontWeight: '800', color: '#8B91A8', letterSpacing: 1.5 },
  taskTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: '#1A1D2B', lineHeight: 30, marginBottom: Spacing.md },
  taskDesc: { fontSize: Fonts.sizes.base, color: '#6B7280', lineHeight: 24 },
  quickStats: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl,
    backgroundColor: '#F7F8FC', borderRadius: Radius.xl, padding: Spacing.base,
    borderWidth: 1, borderColor: '#E4E7F0',
  },
  quickStat: { flex: 1, alignItems: 'center', gap: 4 },
  quickStatLabel: { fontSize: Fonts.sizes.xs, color: '#8B91A8' },
  quickStatValue: { fontSize: Fonts.sizes.md, fontWeight: '800', color: '#1A1D2B' },
  filesSection: { marginTop: Spacing.lg },
  filesTitle: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: '#6B7280', marginBottom: Spacing.sm },
  fileItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#F7F8FC', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: '#E4E7F0',
  },
  fileName: { flex: 1, fontSize: Fonts.sizes.sm, color: '#4A5068' },
  section: { marginTop: Spacing.sm },
  sectionTitle: {
    fontSize: Fonts.sizes.sm, fontWeight: '700', color: '#8B91A8',
    letterSpacing: 0.5, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  studentCard: { marginHorizontal: Spacing.base },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  studentName: { fontSize: Fonts.sizes.base, fontWeight: '700', color: '#1A1D2B' },
  studentMeta: { fontSize: Fonts.sizes.xs, color: '#8B91A8' },
  msgBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(79,70,229,0.08)', alignItems: 'center', justifyContent: 'center' },
  floatingBar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  floatingGradient: { paddingTop: Spacing['3xl'] },
  floatingContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Platform.OS === 'ios' ? 34 : 16, paddingTop: Spacing.md,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E4E7F0',
  },
  floatingLabel: { fontSize: Fonts.sizes.xs, color: '#8B91A8' },
  floatingPrice: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: '#6366F1' },
});
