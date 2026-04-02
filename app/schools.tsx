import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', gold: '#F59E0B', cyan: '#06B6D4' };

export default function SchoolsDirectory() {
  const router = useRouter();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<string[]>([]);

  useEffect(() => {
    api.get('/schools/states').then(r => setStates(r.data.states || [])).catch(() => {});
    api.get('/schools/countries').then(r => setCountries(r.data.countries || [])).catch(() => {});
    fetchSchools();
  }, []);

  const fetchSchools = async (q?: string, state?: string) => {
    setLoading(true);
    try {
      const { data } = await api.get('/schools', { params: { q: q || search, state: state || stateFilter, country: countryFilter || undefined, limit: 50 } });
      setSchools(data.schools || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchSchools(); }, [search, stateFilter, countryFilter]);

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={[s.headerTitle, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Schools Directory</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Telegram banner */}
      <View style={s.tgBanner}>
        <View style={s.tgIcon}><Ionicons name="paper-plane" size={24} color="#fff" /></View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.tgTitle}>Telegram Integration</Text>
          <Text style={s.tgDesc}>Find your school, join the Telegram group, and use @MyHomeworkPalBot to post tasks directly from Telegram!</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={16} color={C.textMuted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search schools..." placeholderTextColor={C.textMuted} style={s.searchInput} />
        </View>
      </View>

      {/* Country filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 6, marginBottom: 8 }}>
        <TouchableOpacity onPress={() => setCountryFilter('')} style={[s.filterChip, !countryFilter && s.filterActive]}>
          <Text style={[s.filterText, !countryFilter && { color: '#fff' }]}>All Countries</Text>
        </TouchableOpacity>
        {[
          { code: 'US', flag: '🇺🇸' }, { code: 'UK', flag: '🇬🇧' }, { code: 'CA', flag: '🇨🇦' },
          { code: 'AU', flag: '🇦🇺' }, { code: 'NG', flag: '🇳🇬' }, { code: 'GH', flag: '🇬🇭' },
          { code: 'ZA', flag: '🇿🇦' }, { code: 'IN', flag: '🇮🇳' }, { code: 'DE', flag: '🇩🇪' }, { code: 'KE', flag: '🇰🇪' },
        ].map(c => (
          <TouchableOpacity key={c.code} onPress={() => setCountryFilter(countryFilter === c.code ? '' : c.code)} style={[s.filterChip, countryFilter === c.code && s.filterActive]}>
            <Text style={[s.filterText, countryFilter === c.code && { color: '#fff' }]}>{c.flag} {c.code}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* State filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 6, marginBottom: 10 }}>
        <TouchableOpacity onPress={() => setStateFilter('')} style={[s.filterChip, !stateFilter && s.filterActive]}>
          <Text style={[s.filterText, !stateFilter && { color: '#fff' }]}>All States</Text>
        </TouchableOpacity>
        {states.slice(0, 20).map(st => (
          <TouchableOpacity key={st} onPress={() => setStateFilter(stateFilter === st ? '' : st)} style={[s.filterChip, stateFilter === st && s.filterActive]}>
            <Text style={[s.filterText, stateFilter === st && { color: '#fff' }]}>{st}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
        {loading ? <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View> :
         schools.length === 0 ? <View style={{ paddingVertical: 40, alignItems: 'center' }}><Ionicons name="school" size={40} color={C.textMuted} /><Text style={{ color: C.textMuted, marginTop: 8 }}>No schools found</Text></View> :
         schools.map(school => (
          <View key={school.id} style={s.schoolCard}>
            <View style={s.schoolIcon}><Ionicons name="school" size={22} color={C.primary} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.schoolName}>{school.name}</Text>
                {school.verified && <Ionicons name="checkmark-circle" size={14} color={C.accent} />}
              </View>
              <Text style={s.schoolMeta}>{school.shortName} · {school.city}, {school.state}</Text>
              {school.telegramChannel && (
                <TouchableOpacity onPress={() => Linking.openURL(school.telegramChannel.startsWith('http') ? school.telegramChannel : `https://t.me/${school.telegramChannel.replace('@', '')}`)} style={s.tgLink}>
                  <Ionicons name="paper-plane" size={12} color={C.cyan} />
                  <Text style={s.tgLinkText}>{school.telegramChannel}</Text>
                </TouchableOpacity>
              )}
            </View>
            {school.telegramGroup ? (
              <TouchableOpacity onPress={() => Linking.openURL(school.telegramGroup)} style={s.joinBtn}>
                <Text style={s.joinText}>Join</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.joinBtn, { backgroundColor: C.bgSoft, borderColor: C.border }]}>
                <Text style={[s.joinText, { color: C.textMuted }]}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  tgBanner: { flexDirection: 'row', alignItems: 'center', margin: 20, marginBottom: 12, backgroundColor: '#E0F2FE', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  tgIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center' },
  tgTitle: { fontSize: 15, fontWeight: '700', color: '#0C4A6E' },
  tgDesc: { fontSize: 12, color: '#075985', lineHeight: 18, marginTop: 2 },
  searchRow: { paddingHorizontal: 20, marginBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft, borderRadius: 10, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: C.border, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border },
  filterActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  schoolCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  schoolIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  schoolName: { fontSize: 14, fontWeight: '600', color: C.text },
  schoolMeta: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  tgLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tgLinkText: { fontSize: 11, color: C.cyan, fontWeight: '500' },
  joinBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: '#D1FAE5' },
  joinText: { fontSize: 12, fontWeight: '600', color: C.accent },
});
