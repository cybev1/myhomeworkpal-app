import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/context/stores';
import { api } from '@/services/api';

const isWeb = Platform.OS === 'web';
const C = { bg: '#FFFFFF', bgSoft: '#F7F8FC', text: '#1A1D2B', textSoft: '#4A5068', textMuted: '#8B91A8', border: '#E4E7F0', primary: '#4F46E5', primarySoft: '#EEF0FF', accent: '#10B981', accentSoft: '#ECFDF5', gold: '#F59E0B', error: '#EF4444', cyan: '#06B6D4' };
const alert = (t: string, m: string) => { if (isWeb) window.alert(t + '\n' + m); else require('react-native').Alert.alert(t, m); };
const doConfirm = (msg: string): boolean => isWeb ? window.confirm(msg) : true;

export default function AdminPanel() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'tasks'>('overview');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, tasksRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/users', { params: { limit: 50, search: search || undefined, role: roleFilter || undefined } }),
        api.get('/admin/tasks', { params: { limit: 50 } }),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.users || []);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.tasks || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search, roleFilter]);

  const promoteUser = async (userId: string, role: string) => {
    if (!doConfirm(`Promote user to ${role}?`)) return;
    try { await api.post(`/admin/users/${userId}/promote`, null, { params: { role } }); alert('Done', `User promoted to ${role}`); fetchData(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
  };

  const verifyUser = async (userId: string) => {
    try { await api.post(`/admin/users/${userId}/verify`); alert('Done', 'User verified'); fetchData(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
  };

  const addFunds = async (userId: string, name: string) => {
    const amount = isWeb ? window.prompt(\`Add funds to \${name}'s wallet. Enter amount ($):\`, '100') : '100';
    if (!amount) return;
    try { await api.post(\`/admin/users/\${userId}/add-funds\`, { amount: parseFloat(amount), reason: 'Admin credit' }); alert('Done', \`$\${amount} added to \${name}'s wallet\`); fetchData(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
  };

  const deductFunds = async (userId: string, name: string) => {
    const amount = isWeb ? window.prompt(\`Deduct from \${name}'s wallet. Enter amount ($):\`, '50') : '50';
    if (!amount) return;
    try { await api.post(\`/admin/users/\${userId}/deduct-funds\`, { amount: parseFloat(amount), reason: 'Admin deduction' }); alert('Done', \`$\${amount} deducted from \${name}'s wallet\`); fetchData(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
  };

  const deleteUser = async (userId: string, name: string) => {
    if (!doConfirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try { await api.delete(`/admin/users/${userId}`); alert('Deleted', `${name} removed`); fetchData(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
  };

  const deleteTask = async (taskId: string) => {
    if (!doConfirm('Delete this task?')) return;
    try { await api.delete(`/admin/tasks/${taskId}`); alert('Deleted', 'Task removed'); fetchData(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
  };

  if (!isAdmin) return (
    <View style={[s.page, s.center]}>
      <Ionicons name="lock-closed" size={48} color={C.textMuted} />
      <Text style={{ fontSize: 18, fontWeight: '700', color: C.text, marginTop: 16 }}>Admin Access Required</Text>
      <Text style={{ color: C.textMuted, marginTop: 4 }}>You don't have permission to view this page.</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={C.textSoft} /></TouchableOpacity>
        <Text style={[s.headerTitle, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>Admin Panel</Text>
        <TouchableOpacity onPress={fetchData} style={s.backBtn}><Ionicons name="refresh" size={20} color={C.textSoft} /></TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['overview', 'users', 'tasks'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
            <Ionicons name={t === 'overview' ? 'stats-chart' : t === 'users' ? 'people' : 'briefcase'} size={16} color={tab === t ? C.primary : C.textMuted} />
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !stats ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          {/* Overview tab */}
          {tab === 'overview' && stats && (
            <>
              <View style={s.statsGrid}>
                <StatCard icon="people" label="Total Users" value={stats.totalUsers} color={C.primary} />
                <StatCard icon="school" label="Students" value={stats.students} color={C.cyan} />
                <StatCard icon="rocket" label="Helpers" value={stats.helpers} color={C.accent} />
                <StatCard icon="briefcase" label="Tasks" value={stats.totalTasks} color={C.gold} />
                <StatCard icon="cart" label="Orders" value={stats.totalOrders} color="#8B5CF6" />
                <StatCard icon="document" label="Open Tasks" value={stats.openTasks} color="#F97316" />
              </View>
            </>
          )}

          {/* Users tab */}
          {tab === 'users' && (
            <>
              <View style={s.searchRow}>
                <View style={s.searchBox}>
                  <Ionicons name="search" size={16} color={C.textMuted} />
                  <TextInput value={search} onChangeText={setSearch} placeholder="Search users..." placeholderTextColor={C.textMuted} style={s.searchInput} />
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['', 'student', 'helper', 'admin', 'superadmin'].map(r => (
                    <TouchableOpacity key={r} onPress={() => setRoleFilter(r)} style={[s.filterChip, roleFilter === r && s.filterChipActive]}>
                      <Text style={[s.filterText, roleFilter === r && { color: '#fff' }]}>{r || 'All'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {users.map(u => (
                <View key={u.id} style={s.userCard}>
                  <View style={s.userTop}>
                    <View style={s.avatar}><Text style={s.avatarText}>{u.name?.[0] || '?'}</Text></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={s.userName}>{u.name}</Text>
                        {u.verified && <Ionicons name="checkmark-circle" size={14} color={C.primary} />}
                      </View>
                      <Text style={s.userEmail}>{u.email}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={[s.roleBadge, { backgroundColor: u.role === 'superadmin' ? '#FEF3C7' : u.role === 'admin' ? C.primarySoft : u.role === 'helper' ? C.accentSoft : C.bgSoft }]}>
                        <Text style={[s.roleText, { color: u.role === 'superadmin' ? '#92400E' : u.role === 'admin' ? C.primary : u.role === 'helper' ? '#059669' : C.textMuted }]}>{u.role}</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: C.accent, marginTop: 4 }}>${(u.balance || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={s.userActions}>
                    {!u.verified && <TouchableOpacity onPress={() => verifyUser(u.id)} style={s.actionChip}><Ionicons name="checkmark" size={14} color={C.accent} /><Text style={[s.actionText, { color: C.accent }]}>Verify</Text></TouchableOpacity>}
                    {u.role === 'student' && <TouchableOpacity onPress={() => promoteUser(u.id, 'helper')} style={s.actionChip}><Ionicons name="arrow-up" size={14} color={C.cyan} /><Text style={[s.actionText, { color: C.cyan }]}>→ Helper</Text></TouchableOpacity>}
                    {u.role !== 'admin' && u.role !== 'superadmin' && <TouchableOpacity onPress={() => promoteUser(u.id, 'admin')} style={s.actionChip}><Ionicons name="shield" size={14} color={C.primary} /><Text style={[s.actionText, { color: C.primary }]}>→ Admin</Text></TouchableOpacity>}
                    <TouchableOpacity onPress={() => deleteUser(u.id, u.name)} style={s.actionChip}><Ionicons name="trash" size={14} color={C.error} /><Text style={[s.actionText, { color: C.error }]}>Delete</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => addFunds(u.id, u.name)} style={s.actionChip}><Ionicons name="add-circle" size={14} color={C.accent} /><Text style={[s.actionText, { color: C.accent }]}>+ Funds</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => deductFunds(u.id, u.name)} style={s.actionChip}><Ionicons name="remove-circle" size={14} color={C.gold} /><Text style={[s.actionText, { color: C.gold }]}>- Funds</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Tasks tab */}
          {tab === 'tasks' && (
            <>
              {tasks.map(t => (
                <View key={t.id} style={s.taskCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.taskTitle} numberOfLines={1}>{t.title}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                      <Text style={s.taskMeta}>{t.category}</Text>
                      <Text style={s.taskMeta}>${t.budget}</Text>
                      <Text style={[s.taskMeta, { color: t.status === 'open' ? C.accent : C.textMuted }]}>{t.status}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => deleteTask(t.id)} style={{ padding: 8 }}><Ionicons name="trash-outline" size={18} color={C.error} /></TouchableOpacity>
                </View>
              ))}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const StatCard = ({ icon, label, value, color }: any) => (
  <View style={[s.statCard, { borderColor: `${color}20` }]}>
    <Ionicons name={icon} size={22} color={color} />
    <Text style={s.statValue}>{value ?? 0}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.bgSoft },
  tabActive: { backgroundColor: C.primarySoft, borderWidth: 1, borderColor: C.primary + '30' },
  tabText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  tabTextActive: { color: C.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', backgroundColor: C.bgSoft, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1 },
  statValue: { fontSize: 28, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 12, color: C.textMuted },
  searchRow: { marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSoft, borderRadius: 10, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: C.border, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  userCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  userTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  userName: { fontSize: 14, fontWeight: '700', color: C.text },
  userEmail: { fontSize: 12, color: C.textMuted },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  roleText: { fontSize: 11, fontWeight: '700' },
  userActions: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.bgSoft, borderWidth: 1, borderColor: C.border },
  actionText: { fontSize: 11, fontWeight: '600' },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  taskMeta: { fontSize: 12, color: C.textMuted },
});
