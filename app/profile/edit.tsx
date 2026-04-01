import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/context/stores';
import { authAPI } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', error: '#EF4444' };
const SKILL_OPTIONS = ['Mathematics', 'Computer Science', 'English & Writing', 'Science', 'Business', 'Engineering', 'Humanities', 'Statistics', 'Python', 'Java', 'Essay Writing', 'Research', 'Data Analysis', 'Graphic Design', 'Accounting', 'Physics', 'Chemistry', 'Economics'];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>((user?.skills as any) || []);
  const [saving, setSaving] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, bio, skills: selectedSkills.join(',') });
      if (isWeb) window.alert('Profile updated!');
      else require('react-native').Alert.alert('Success', 'Profile updated!');
      router.back();
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Failed to update';
      if (isWeb) window.alert(msg); else require('react-native').Alert.alert('Error', msg);
    } finally { setSaving(false); }
  };

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={s.saveBtn}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatar}><Text style={s.avatarText}>{name[0] || 'U'}</Text></View>
          <TouchableOpacity style={s.changePhoto}><Ionicons name="camera-outline" size={16} color={C.primary} /><Text style={s.changePhotoText}>Change Photo</Text></TouchableOpacity>
        </View>

        <Text style={s.label}>Full Name</Text>
        <View style={s.inputWrap}><TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={C.textMuted} style={s.input} /></View>

        <Text style={s.label}>Bio</Text>
        <View style={[s.inputWrap, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
          <TextInput value={bio} onChangeText={setBio} placeholder="Tell students about yourself, your expertise, and experience..." placeholderTextColor={C.textMuted} multiline style={[s.input, { height: 80, textAlignVertical: 'top' }]} />
        </View>
        <Text style={s.charCount}>{bio.length}/500</Text>

        <Text style={s.label}>Skills & Expertise</Text>
        <Text style={s.hint}>Select subjects you can help with</Text>
        <View style={s.skillsGrid}>
          {SKILL_OPTIONS.map(skill => (
            <TouchableOpacity key={skill} onPress={() => toggleSkill(skill)} style={[s.skillChip, selectedSkills.includes(skill) && s.skillChipActive]}>
              {selectedSkills.includes(skill) && <Ionicons name="checkmark" size={14} color={C.primary} />}
              <Text style={[s.skillText, selectedSkills.includes(skill) && s.skillTextActive]}>{skill}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={C.primary} />
          <Text style={s.infoText}>A complete profile with skills and a bio gets 3x more bids and job offers on MyHomeworkPal.</Text>
        </View>

        <TouchableOpacity onPress={handleSave} disabled={saving} style={s.submitBtn}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Save Changes</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  saveBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  changePhoto: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changePhotoText: { color: C.primary, fontSize: 14, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: C.textSoft, marginBottom: 6, marginTop: 16 },
  hint: { fontSize: 12, color: C.textMuted, marginBottom: 10 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, height: 50 },
  input: { flex: 1, fontSize: 15, color: C.text, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  charCount: { fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: 4 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: C.bgSoft, borderWidth: 1.5, borderColor: C.border },
  skillChipActive: { backgroundColor: C.primarySoft, borderColor: C.primary },
  skillText: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  skillTextActive: { color: C.primary, fontWeight: '600' },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.primarySoft, borderRadius: 12, padding: 14, marginTop: 24, borderWidth: 1, borderColor: C.primary + '20' },
  infoText: { flex: 1, fontSize: 13, color: C.textSoft, lineHeight: 18 },
  submitBtn: { backgroundColor: C.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
