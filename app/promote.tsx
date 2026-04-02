import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/context/stores';
import { api } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5', gold: '#F59E0B', cyan: '#06B6D4' };
const FRONTEND = 'https://myhomeworkpal.com';

export default function PromoteScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'share' | 'schools' | 'telegram'>('share');
  const [schools, setSchools] = useState<any[]>([]);
  const [searchSchool, setSearchSchool] = useState('');
  const [customMsg, setCustomMsg] = useState('');

  useEffect(() => {
    api.get('/schools', { params: { limit: 50, q: searchSchool || undefined } }).then(r => setSchools(r.data.schools || [])).catch(() => {});
  }, [searchSchool]);

  const profileUrl = `${FRONTEND}/profile/${user?.id}`;
  const referralMsg = customMsg || `Need help with homework? I'm a verified expert on MyHomeworkPal. Post your task and I'll help you ace it! ${profileUrl}`;

  const shareOn = (platform: string) => {
    const encoded = encodeURIComponent(referralMsg);
    const urls: any = {
      twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
      whatsapp: `https://wa.me/?text=${encoded}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(referralMsg.replace(profileUrl, ''))}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encoded}&u=${encodeURIComponent(profileUrl)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent('Homework Help Expert')}&summary=${encoded}`,
      copy: '',
    };
    if (platform === 'copy') {
      if (isWeb) { navigator.clipboard.writeText(referralMsg); window.alert('Copied to clipboard!'); }
    } else {
      if (isWeb) window.open(urls[platform], '_blank');
      else Linking.openURL(urls[platform]);
    }
  };

  const suggestSchool = async () => {
    const name = isWeb ? window.prompt('School name:') : '';
    if (!name) return;
    const city = isWeb ? window.prompt('City:') : '';
    const state = isWeb ? window.prompt('State/Region:') : '';
    const country = isWeb ? window.prompt('Country code (US, UK, NG, GH, etc):') : 'US';
    try {
      await api.post('/schools/suggest', { name, city, state, country: country || 'US' });
      if (isWeb) window.alert('School suggested! Admin will verify.');
      setSearchSchool('');
    } catch (e: any) {
      if (isWeb) window.alert(e.response?.data?.detail || 'Failed');
    }
  };

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={[s.headerTitle, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Promote Services</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity onPress={() => setTab('share')} style={[s.tab, tab === 'share' && s.tabActive]}><Ionicons name="share-social" size={16} color={tab === 'share' ? C.primary : C.textMuted} /><Text style={[s.tabText, tab === 'share' && s.tabTextActive]}>Share</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('schools')} style={[s.tab, tab === 'schools' && s.tabActive]}><Ionicons name="school" size={16} color={tab === 'schools' ? C.primary : C.textMuted} /><Text style={[s.tabText, tab === 'schools' && s.tabTextActive]}>Schools</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('telegram')} style={[s.tab, tab === 'telegram' && s.tabActive]}><Ionicons name="paper-plane" size={16} color={tab === 'telegram' ? C.primary : C.textMuted} /><Text style={[s.tabText, tab === 'telegram' && s.tabTextActive]}>Telegram</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* ═══ SHARE TAB ═══ */}
        {tab === 'share' && (
          <>
            {/* Profile card preview */}
            <View style={s.previewCard}>
              <View style={s.previewAvatar}><Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>{user?.name?.[0] || 'H'}</Text></View>
              <Text style={s.previewName}>{user?.name}</Text>
              <Text style={s.previewRole}>Verified Expert on MyHomeworkPal</Text>
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                <Ionicons name="star" size={14} color={C.gold} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>{user?.rating?.toFixed(1) || '5.0'} rating</Text>
              </View>
              <Text style={s.previewUrl}>{profileUrl}</Text>
            </View>

            {/* Custom message */}
            <Text style={s.label}>Your promotion message</Text>
            <TextInput value={customMsg} onChangeText={setCustomMsg} placeholder={referralMsg} placeholderTextColor={C.textMuted} multiline style={s.textarea} />
            <Text style={{ fontSize: 11, color: C.textMuted, marginBottom: 16 }}>Your profile link is auto-included. Customize the message above.</Text>

            {/* Share buttons */}
            <Text style={s.label}>Share on</Text>
            <View style={s.shareGrid}>
              <ShareBtn icon="logo-whatsapp" label="WhatsApp" color="#25D366" onPress={() => shareOn('whatsapp')} />
              <ShareBtn icon="paper-plane" label="Telegram" color="#0EA5E9" onPress={() => shareOn('telegram')} />
              <ShareBtn icon="logo-twitter" label="Twitter/X" color="#1DA1F2" onPress={() => shareOn('twitter')} />
              <ShareBtn icon="logo-facebook" label="Facebook" color="#1877F2" onPress={() => shareOn('facebook')} />
              <ShareBtn icon="logo-linkedin" label="LinkedIn" color="#0A66C2" onPress={() => shareOn('linkedin')} />
              <ShareBtn icon="copy" label="Copy Link" color={C.textSoft} onPress={() => shareOn('copy')} />
            </View>

            <View style={s.tipCard}>
              <Ionicons name="bulb" size={20} color={C.gold} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.tipTitle}>Pro tips for getting students</Text>
                <Text style={s.tipText}>1. Share in school Telegram groups and WhatsApp chats{'\n'}2. Post on Twitter/X with hashtags like #HomeworkHelp{'\n'}3. Add your MHP link to your social media bios{'\n'}4. Ask satisfied students to leave reviews</Text>
              </View>
            </View>
          </>
        )}

        {/* ═══ SCHOOLS TAB ═══ */}
        {tab === 'schools' && (
          <>
            <Text style={{ fontSize: 14, color: C.textMuted, marginBottom: 12 }}>Find schools with Telegram channels to promote your services in their student communities.</Text>

            <View style={s.searchBox}>
              <Ionicons name="search" size={16} color={C.textMuted} />
              <TextInput value={searchSchool} onChangeText={setSearchSchool} placeholder="Search schools..." placeholderTextColor={C.textMuted} style={s.searchInput} />
            </View>

            {schools.map(sc => (
              <View key={sc.id} style={s.schoolCard}>
                <View style={s.schoolIcon}><Ionicons name="school" size={20} color={C.primary} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.schoolName}>{sc.name}</Text>
                  <Text style={s.schoolMeta}>{sc.shortName} · {sc.city}, {sc.state} · {sc.country}</Text>
                </View>
                {sc.telegramChannel ? (
                  <TouchableOpacity onPress={() => {
                    const url = sc.telegramChannel.startsWith('http') ? sc.telegramChannel : `https://t.me/${sc.telegramChannel.replace('@', '')}`;
                    if (isWeb) window.open(url, '_blank'); else Linking.openURL(url);
                  }} style={s.joinBtn}>
                    <Ionicons name="paper-plane" size={12} color="#fff" />
                    <Text style={s.joinText}>Join</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[s.joinBtn, { backgroundColor: C.bgSoft }]}><Text style={[s.joinText, { color: C.textMuted }]}>No TG</Text></View>
                )}
              </View>
            ))}

            <TouchableOpacity onPress={suggestSchool} style={s.addSchoolBtn}>
              <Ionicons name="add-circle" size={18} color={C.primary} />
              <Text style={s.addSchoolText}>Can't find your school? Add it</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ═══ TELEGRAM TAB ═══ */}
        {tab === 'telegram' && (
          <>
            <View style={s.tgHero}>
              <View style={s.tgHeroIcon}><Ionicons name="paper-plane" size={32} color="#fff" /></View>
              <Text style={s.tgHeroTitle}>Telegram Integration</Text>
              <Text style={s.tgHeroDesc}>Students can post tasks and manage orders directly from Telegram. Join school channels to reach them!</Text>
            </View>

            <Text style={s.label}>How to grow via Telegram</Text>
            <View style={s.stepCard}><View style={s.stepNum}><Text style={s.stepNumText}>1</Text></View><View style={{ flex: 1 }}><Text style={s.stepTitle}>Join school Telegram groups</Text><Text style={s.stepDesc}>Browse the Schools tab and join groups where students hang out</Text></View></View>
            <View style={s.stepCard}><View style={s.stepNum}><Text style={s.stepNumText}>2</Text></View><View style={{ flex: 1 }}><Text style={s.stepTitle}>Share your expertise</Text><Text style={s.stepDesc}>Help with quick questions in the group to build trust, then share your MHP profile</Text></View></View>
            <View style={s.stepCard}><View style={s.stepNum}><Text style={s.stepNumText}>3</Text></View><View style={{ flex: 1 }}><Text style={s.stepTitle}>Tell students about the bot</Text><Text style={s.stepDesc}>Students can use @MyHomeworkPalBot to post tasks directly — you'll see them in Explore</Text></View></View>
            <View style={s.stepCard}><View style={s.stepNum}><Text style={s.stepNumText}>4</Text></View><View style={{ flex: 1 }}><Text style={s.stepTitle}>Link your Telegram</Text><Text style={s.stepDesc}>Get notified on Telegram when students accept your bids</Text></View></View>

            <TouchableOpacity onPress={() => { if (isWeb) window.open('https://t.me/MyHomeworkPalBot', '_blank'); }} style={s.tgCta}>
              <Ionicons name="paper-plane" size={18} color="#fff" />
              <Text style={s.tgCtaText}>Open @MyHomeworkPalBot</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { if (isWeb) window.open(`https://t.me/MyHomeworkPalBot?start=link_${user?.id}`, '_blank'); }} style={[s.tgCta, { backgroundColor: C.accent }]}>
              <Ionicons name="link" size={18} color="#fff" />
              <Text style={s.tgCtaText}>Link My Telegram Account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const ShareBtn = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={ss.btn}>
    <View style={[ss.iconWrap, { backgroundColor: `${color}15` }]}><Ionicons name={icon} size={22} color={color} /></View>
    <Text style={ss.label}>{label}</Text>
  </TouchableOpacity>
);
const ss = StyleSheet.create({
  btn: { width: '30%', alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  label: { fontSize: 11, fontWeight: '600', color: C.textSoft },
});

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 10, backgroundColor: C.bgSoft, borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  tabTextActive: { color: C.primary },
  label: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },
  previewCard: { alignItems: 'center', backgroundColor: C.primarySoft, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: C.primary + '20', marginBottom: 20 },
  previewAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  previewName: { fontSize: 18, fontWeight: '700', color: C.text },
  previewRole: { fontSize: 13, color: C.textMuted },
  previewUrl: { fontSize: 11, color: C.primary, marginTop: 8 },
  textarea: { backgroundColor: C.bgSoft, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, minHeight: 80, fontSize: 14, color: C.text, textAlignVertical: 'top', marginBottom: 4, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 20 },
  tipCard: { flexDirection: 'row', backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FDE68A' },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  tipText: { fontSize: 12, color: '#A16207', lineHeight: 20, marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft, borderRadius: 10, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: C.border, gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  schoolCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  schoolIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  schoolName: { fontSize: 13, fontWeight: '600', color: C.text },
  schoolMeta: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#0EA5E9' },
  joinText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  addSchoolBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', marginTop: 8 },
  addSchoolText: { fontSize: 13, fontWeight: '600', color: C.primary },
  tgHero: { alignItems: 'center', backgroundColor: '#E0F2FE', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#BAE6FD', marginBottom: 20 },
  tgHeroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tgHeroTitle: { fontSize: 20, fontWeight: '800', color: '#0C4A6E' },
  tgHeroDesc: { fontSize: 13, color: '#075985', textAlign: 'center', marginTop: 4, lineHeight: 20 },
  stepCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 8, gap: 12 },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  stepDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  tgCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0EA5E9', borderRadius: 14, height: 50, marginBottom: 10 },
  tgCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
