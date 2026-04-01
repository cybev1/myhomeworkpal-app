import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usersAPI, reviewsAPI, chatAPI } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5', gold: '#F59E0B' };

export default function PublicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data: u } = await usersAPI.get(id as string);
        setProfile(u);
        try { const { data: r } = await reviewsAPI.forUser(id as string); setReviews(r.reviews || r || []); } catch {}
      } catch {} finally { setLoading(false); }
    })();
  }, [id]);

  const startChat = async () => {
    try { const { data } = await chatAPI.startConversation(id as string); router.push(`/chat/${data.id}`); }
    catch { if (isWeb) window.alert('Could not start conversation'); }
  };

  if (loading) return <View style={[s.page, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (!profile) return <View style={[s.page, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: C.textMuted }}>User not found</Text></View>;

  const skills = profile.skills ? profile.skills.split(',').filter(Boolean) : [];

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.avatar}><Text style={s.avatarText}>{profile.name?.[0] || '?'}</Text></View>
          <Text style={[s.name, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>{profile.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            {profile.verified && <Ionicons name="checkmark-circle" size={16} color={C.primary} />}
            <Text style={s.role}>{profile.role === 'helper' ? 'Verified Expert' : 'Student'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Ionicons name="star" size={18} color={C.gold} />
            <Text style={s.ratingText}>{profile.rating?.toFixed(1) || '—'}</Text>
            <Text style={s.reviewCount}>({profile.totalReviews || 0} reviews)</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}><Text style={s.statValue}>{profile.completedOrders || 0}</Text><Text style={s.statLabel}>Completed</Text></View>
          <View style={s.statBox}><Text style={s.statValue}>{profile.rating?.toFixed(1) || '—'}</Text><Text style={s.statLabel}>Rating</Text></View>
          <View style={s.statBox}><Text style={s.statValue}>{profile.totalReviews || 0}</Text><Text style={s.statLabel}>Reviews</Text></View>
        </View>

        {/* Bio */}
        {profile.bio && (
          <View style={s.section}><Text style={s.sectionTitle}>About</Text><Text style={s.bio}>{profile.bio}</Text></View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Skills</Text>
            <View style={s.skillsRow}>
              {skills.map((sk: string) => (
                <View key={sk} style={s.skillChip}><Text style={s.skillText}>{sk.trim()}</Text></View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <Text style={s.emptyReviews}>No reviews yet</Text>
          ) : reviews.map((r: any, i: number) => (
            <View key={r.id || i} style={s.reviewCard}>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1,2,3,4,5].map(n => <Ionicons key={n} name={n <= r.rating ? 'star' : 'star-outline'} size={14} color={C.gold} />)}
              </View>
              <Text style={s.reviewText}>{r.comment || 'Great experience!'}</Text>
              <Text style={s.reviewMeta}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={{ gap: 10, marginTop: 16 }}>
          <TouchableOpacity onPress={() => router.push('/create-task')} style={s.primaryBtn}>
            <Ionicons name="briefcase-outline" size={18} color="#fff" />
            <Text style={s.primaryBtnText}>Hire {profile.name?.split(' ')[0]}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={startChat} style={s.outlineBtn}>
            <Ionicons name="chatbubble-outline" size={18} color={C.primary} />
            <Text style={s.outlineBtnText}>Message</Text>
          </TouchableOpacity>
        </View>
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
  profileCard: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: C.text },
  role: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
  ratingText: { fontSize: 16, fontWeight: '700', color: C.text },
  reviewCount: { fontSize: 13, color: C.textMuted },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: C.bgSoft, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  statValue: { fontSize: 22, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 12, color: C.textMuted, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  bio: { fontSize: 15, color: C.textSoft, lineHeight: 24 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: C.primarySoft, borderWidth: 1, borderColor: C.primary + '20' },
  skillText: { fontSize: 13, color: C.primary, fontWeight: '500' },
  emptyReviews: { color: C.textMuted, fontSize: 14, fontStyle: 'italic' },
  reviewCard: { backgroundColor: C.bgSoft, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  reviewText: { fontSize: 14, color: C.textSoft, lineHeight: 22, marginTop: 6 },
  reviewMeta: { fontSize: 11, color: C.textMuted, marginTop: 6 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, height: 54 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: C.primary, borderRadius: 14, height: 54 },
  outlineBtnText: { color: C.primary, fontSize: 16, fontWeight: '700' },
});
