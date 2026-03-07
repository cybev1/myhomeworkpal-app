import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { tasksAPI } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5' };
const cats = [
  { id: 'math', label: 'Mathematics', color: '#4F46E5' }, { id: 'cs', label: 'Computer Science', color: '#06B6D4' },
  { id: 'english', label: 'English & Writing', color: '#E67E22' }, { id: 'science', label: 'Science', color: '#10B981' },
  { id: 'business', label: 'Business', color: '#F59E0B' }, { id: 'engineering', label: 'Engineering', color: '#EF4444' },
  { id: 'humanities', label: 'Humanities', color: '#8B5CF6' }, { id: 'other', label: 'Other', color: '#8B91A8' },
];

export default function CreateTaskScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}><Ionicons name="close" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={s.headerTitle}>Post a Task</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <Text style={s.label}>Task Title</Text>
        <View style={s.inputWrap}><TextInput value={title} onChangeText={setTitle} placeholder="e.g., Need help with Calculus II homework" placeholderTextColor={C.textMuted} style={s.input} /></View>

        <Text style={s.label}>Description</Text>
        <View style={[s.inputWrap, { height: 120, alignItems: 'flex-start', paddingTop: 12 }]}>
          <TextInput value={desc} onChangeText={setDesc} placeholder="Describe your task in detail..." placeholderTextColor={C.textMuted} multiline style={[s.input, { height: 100, textAlignVertical: 'top' }]} />
        </View>

        <Text style={s.label}>Category</Text>
        <View style={s.catGrid}>
          {cats.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => setCategory(c.id)} style={[s.catChip, category === c.id && { borderColor: c.color, backgroundColor: `${c.color}10` }]}>
              <View style={[s.catDot, { backgroundColor: c.color }]} />
              <Text style={[s.catText, category === c.id && { color: c.color }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Budget ($)</Text>
        <View style={s.inputWrap}><TextInput value={budget} onChangeText={setBudget} placeholder="25" placeholderTextColor={C.textMuted} keyboardType="numeric" style={s.input} /></View>
        <View style={s.budgetRow}>
          {['15', '25', '50', '100'].map((a) => (
            <TouchableOpacity key={a} onPress={() => setBudget(a)} style={[s.budgetChip, budget === a && s.budgetChipActive]}>
              <Text style={[s.budgetChipText, budget === a && { color: C.primary }]}>${a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Deadline</Text>
        <View style={s.inputWrap}><TextInput value={deadline} onChangeText={setDeadline} placeholder="e.g., 3 days, March 15" placeholderTextColor={C.textMuted} style={s.input} /></View>

        <TouchableOpacity style={s.uploadArea}>
          <Ionicons name="cloud-upload-outline" size={32} color={C.textMuted} />
          <Text style={s.uploadText}>Tap to upload files</Text>
          <Text style={s.uploadHint}>PDF, DOC, images up to 25MB</Text>
        </TouchableOpacity>

        <View style={s.escrowCard}>
          <Ionicons name="shield-checkmark" size={22} color={C.accent} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.escrowTitle}>Secure Escrow Payment</Text>
            <Text style={s.escrowDesc}>Payment held securely until you approve the delivered work</Text>
          </View>
        </View>

        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} disabled={loading} onPress={async () => {
          if (!title || !category || !budget) {
            Alert.alert('Missing Fields', 'Please fill in title, category, and budget');
            return;
          }
          setLoading(true);
          try {
            await tasksAPI.create({
              title,
              description: desc,
              category,
              budget: parseFloat(budget),
              deadline: deadline || undefined,
            });
            Alert.alert('Success', 'Task posted!', [{ text: 'OK', onPress: () => router.back() }]);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to create task');
          } finally {
            setLoading(false);
          }
        }}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Post Task</Text>}
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  label: { fontSize: 13, fontWeight: '600', color: C.textSoft, marginBottom: 6, marginTop: 18 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, height: 50 },
  input: { flex: 1, fontSize: 15, color: C.text, ...(isWeb ? { outlineStyle: 'none' } : {}) },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, gap: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catText: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  budgetRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  budgetChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border },
  budgetChipActive: { backgroundColor: C.primarySoft, borderColor: C.primary },
  budgetChipText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  uploadArea: { borderWidth: 2, borderColor: C.border, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 28, alignItems: 'center', marginTop: 20 },
  uploadText: { fontSize: 14, fontWeight: '600', color: C.textSoft, marginTop: 8 },
  uploadHint: { fontSize: 12, color: C.textMuted, marginTop: 4 },
  escrowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.accentSoft, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 1, borderColor: '#D1FAE5' },
  escrowTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  escrowDesc: { fontSize: 12, color: C.textMuted, marginTop: 2, lineHeight: 16 },
  submitBtn: { backgroundColor: C.primary, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
