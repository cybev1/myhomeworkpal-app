import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { tasksAPI } from '@/services/api';

const isWeb = Platform.OS === 'web';

// Cross-platform alert (Alert.alert doesn't work on web)
const showAlert = (title: string, message: string, onOk?: () => void) => {
  if (isWeb) {
    window.alert(title + '\n' + message);
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
  }
};
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
  const [files, setFiles] = useState<{ name: string; uri: string; size?: number }[]>([]);

  const pickFile = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert('Permission needed', 'Please allow access to your photos to upload files.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((a) => ({
          name: a.fileName || `file_${Date.now()}.${a.type === 'image' ? 'jpg' : 'mp4'}`,
          uri: a.uri,
          size: a.fileSize,
        }));
        setFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.log('Pick error:', err);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleSubmit = async () => {
    if (!title) { showAlert('Required', 'Please enter a task title'); return; }
    if (!desc) { showAlert('Required', 'Please describe your task'); return; }
    if (!category) { showAlert('Required', 'Please select a category'); return; }
    if (!budget) { showAlert('Required', 'Please set a budget'); return; }

    setLoading(true);
    try {
      const res = await tasksAPI.create({
        title, description: desc, category,
        budget: parseFloat(budget),
        deadline: deadline || undefined,
      });

      // Upload files if any
      if (files.length > 0 && res.data?.id) {
        for (const file of files) {
          try {
            const formData = new FormData();
            formData.append('file', {
              uri: file.uri,
              name: file.name,
              type: 'application/octet-stream',
            } as any);
            await tasksAPI.uploadFile(res.data.id, formData);
          } catch (e) {
            console.log('File upload error:', e);
          }
        }
      }

      showAlert('Task Posted!', 'Your task is now live. Experts will start bidding soon.', () => router.replace('/(tabs)/explore'));
    } catch (err: any) {
      showAlert('Error', err.response?.data?.detail || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={C.textSoft} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Post a Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Task Title <Text style={{ color: '#EF4444' }}>*</Text></Text>
        <View style={s.inputWrap}>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g., Need help with Calculus II homework" placeholderTextColor={C.textMuted} style={s.input} />
        </View>

        <Text style={s.label}>Description <Text style={{ color: '#EF4444' }}>*</Text></Text>
        <View style={[s.inputWrap, { height: 120, alignItems: 'flex-start', paddingTop: 12 }]}>
          <TextInput value={desc} onChangeText={setDesc} placeholder="Describe your task in detail — the more specific, the better bids you'll get..." placeholderTextColor={C.textMuted} multiline style={[s.input, { height: 100, textAlignVertical: 'top' }]} />
        </View>

        <Text style={s.label}>Category <Text style={{ color: '#EF4444' }}>*</Text></Text>
        <View style={s.catGrid}>
          {cats.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => setCategory(c.id)} style={[s.catChip, category === c.id && { borderColor: c.color, backgroundColor: `${c.color}10` }]}>
              <View style={[s.catDot, { backgroundColor: c.color }]} />
              <Text style={[s.catText, category === c.id && { color: c.color, fontWeight: '600' }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Budget ($) <Text style={{ color: '#EF4444' }}>*</Text></Text>
        <View style={s.inputWrap}>
          <Text style={{ fontSize: 16, color: C.textMuted, marginRight: 4 }}>$</Text>
          <TextInput value={budget} onChangeText={setBudget} placeholder="25" placeholderTextColor={C.textMuted} keyboardType="numeric" style={s.input} />
        </View>
        <View style={s.budgetRow}>
          {['15', '25', '50', '100'].map((a) => (
            <TouchableOpacity key={a} onPress={() => setBudget(a)} style={[s.budgetChip, budget === a && s.budgetChipActive]}>
              <Text style={[s.budgetChipText, budget === a && { color: C.primary }]}>${a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Deadline</Text>
        <View style={s.inputWrap}>
          <Ionicons name="calendar-outline" size={18} color={C.textMuted} style={{ marginRight: 8 }} />
          <TextInput value={deadline} onChangeText={setDeadline} placeholder="e.g., 3 days, March 15, ASAP" placeholderTextColor={C.textMuted} style={s.input} />
        </View>

        {/* File upload */}
        <Text style={s.label}>Attachments</Text>
        <TouchableOpacity style={s.uploadArea} onPress={pickFile} activeOpacity={0.7}>
          <Ionicons name="cloud-upload-outline" size={32} color={C.primary} />
          <Text style={s.uploadText}>Tap to upload files</Text>
          <Text style={s.uploadHint}>Photos of assignments, PDFs, documents — up to 25MB</Text>
        </TouchableOpacity>

        {/* Attached files list */}
        {files.length > 0 && (
          <View style={s.filesList}>
            {files.map((f, i) => (
              <View key={i} style={s.fileItem}>
                <Ionicons name="document-attach-outline" size={20} color={C.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.fileName} numberOfLines={1}>{f.name}</Text>
                  {f.size ? <Text style={s.fileSize}>{formatSize(f.size)}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => removeFile(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={22} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={s.escrowCard}>
          <Ionicons name="shield-checkmark" size={22} color={C.accent} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.escrowTitle}>Secure Escrow Payment</Text>
            <Text style={s.escrowDesc}>Your payment is held safely until you approve the delivered work. 100% money-back guarantee.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#fff" />
              <Text style={s.submitText}>Posting...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="paper-plane" size={18} color="#fff" />
              <Text style={s.submitText}>Post Task</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
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
  input: { flex: 1, fontSize: 15, color: C.text, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, gap: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catText: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  budgetRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  budgetChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border },
  budgetChipActive: { backgroundColor: C.primarySoft, borderColor: C.primary },
  budgetChipText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  uploadArea: { borderWidth: 2, borderColor: C.primary + '40', borderStyle: 'dashed', borderRadius: 16, paddingVertical: 28, alignItems: 'center', marginTop: 4, backgroundColor: C.primarySoft + '40' },
  uploadText: { fontSize: 14, fontWeight: '600', color: C.primary, marginTop: 8 },
  uploadHint: { fontSize: 12, color: C.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  filesList: { marginTop: 12, gap: 8 },
  fileItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border },
  fileName: { fontSize: 13, fontWeight: '600', color: C.text },
  fileSize: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  escrowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.accentSoft, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 1, borderColor: '#D1FAE5' },
  escrowTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  escrowDesc: { fontSize: 12, color: C.textMuted, marginTop: 2, lineHeight: 16 },
  submitBtn: { backgroundColor: C.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
