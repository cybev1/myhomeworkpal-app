import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius, APP_CONFIG } from '@/constants/theme';
import { FloatingInput, Button, Card } from '@/components/UI';

export default function CreateTaskScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description || !category || !budget) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    // API call would go here
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Your task has been posted!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.light} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={[styles.stepLine, { backgroundColor: title ? Colors.primary : Colors.darkBorder }]} />
          <View style={[styles.stepDot, description ? styles.stepDotActive : {}]} />
          <View style={[styles.stepLine, { backgroundColor: category ? Colors.primary : Colors.darkBorder }]} />
          <View style={[styles.stepDot, budget ? styles.stepDotActive : {}]} />
        </View>

        {/* Title */}
        <FloatingInput
          label="Task Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Need help with Calculus II homework"
          icon="document-text-outline"
        />

        {/* Description */}
        <FloatingInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your task in detail. Include requirements, format, etc."
          multiline
          numberOfLines={5}
          icon="create-outline"
        />

        {/* Category */}
        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.categoryGrid}>
          {APP_CONFIG.categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              style={[styles.catChip, category === cat.id && { borderColor: cat.color, backgroundColor: `${cat.color}12` }]}
            >
              <View style={[styles.catDot, { backgroundColor: cat.color }]} />
              <Text style={[styles.catText, category === cat.id && { color: Colors.white }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Budget */}
        <FloatingInput
          label="Budget ($)"
          value={budget}
          onChangeText={setBudget}
          placeholder="25"
          keyboardType="numeric"
          icon="cash-outline"
        />

        {/* Budget suggestions */}
        <View style={styles.budgetHints}>
          {['15', '25', '50', '100'].map((amt) => (
            <TouchableOpacity
              key={amt}
              onPress={() => setBudget(amt)}
              style={[styles.budgetHint, budget === amt && styles.budgetHintActive]}
            >
              <Text style={[styles.budgetHintText, budget === amt && { color: Colors.white }]}>
                ${amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Deadline */}
        <FloatingInput
          label="Deadline"
          value={deadline}
          onChangeText={setDeadline}
          placeholder="e.g., 3 days, March 15"
          icon="calendar-outline"
        />

        {/* File upload area */}
        <Text style={styles.sectionLabel}>Attachments (optional)</Text>
        <TouchableOpacity style={styles.uploadArea}>
          <Ionicons name="cloud-upload-outline" size={36} color={Colors.muted} />
          <Text style={styles.uploadText}>Tap to upload files</Text>
          <Text style={styles.uploadHint}>PDF, DOC, images up to 25MB</Text>
        </TouchableOpacity>

        {/* Escrow notice */}
        <Card variant="glass" style={styles.escrowCard}>
          <View style={styles.escrowRow}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.escrowTitle}>Secure Escrow Payment</Text>
              <Text style={styles.escrowDesc}>
                Your payment is held securely until you approve the delivered work
              </Text>
            </View>
          </View>
        </Card>

        {/* Submit */}
        <Button
          title="Post Task"
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          size="lg"
          icon="paper-plane-outline"
          style={{ marginTop: Spacing.lg }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.darkElevated, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  form: { padding: Spacing.lg },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl, gap: 0,
  },
  stepDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.darkBorder, borderWidth: 2, borderColor: Colors.darkBorder,
  },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.darkBorder },
  sectionLabel: {
    fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.subtle,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  catChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.darkBorder,
    backgroundColor: Colors.darkCard,
  },
  catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  catText: { fontSize: Fonts.sizes.sm, color: Colors.muted, fontWeight: '500' },
  budgetHints: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  budgetHint: {
    paddingHorizontal: Spacing.base, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.darkCard,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  budgetHintActive: { backgroundColor: 'rgba(108,92,231,0.15)', borderColor: Colors.primary },
  budgetHintText: { fontSize: Fonts.sizes.sm, color: Colors.muted, fontWeight: '600' },
  uploadArea: {
    borderWidth: 2, borderColor: Colors.darkBorder, borderStyle: 'dashed',
    borderRadius: Radius.xl, paddingVertical: Spacing['2xl'],
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  uploadText: { fontSize: Fonts.sizes.base, color: Colors.light, fontWeight: '600', marginTop: Spacing.sm },
  uploadHint: { fontSize: Fonts.sizes.xs, color: Colors.muted, marginTop: 4 },
  escrowCard: { marginBottom: Spacing.sm },
  escrowRow: { flexDirection: 'row', alignItems: 'center' },
  escrowTitle: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.white },
  escrowDesc: { fontSize: Fonts.sizes.xs, color: Colors.muted, lineHeight: 16, marginTop: 2 },
});
