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
  const { logout } = useAuthStore();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'tasks' | 'settings' | 'ai' | 'schools'>('overview');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTaskId, setAiTaskId] = useState('');
  const [aiStyle, setAiStyle] = useState('student');
  const [aiLevel, setAiLevel] = useState('3');
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [editingSettings, setEditingSettings] = useState<any>({});
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
      try { const sr = await api.get('/admin/settings'); setSettings(sr.data); setEditingSettings(sr.data); } catch {}
      try { const ar = await api.get('/ai/status'); setAiStatus(ar.data); } catch {}
      try { const scr = await api.get('/schools', { params: { limit: 100 } }); setSchoolsList(scr.data.schools || []); } catch {}
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.users || []);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.tasks || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search, roleFilter]);

  const saveSettings = async () => {
    try {
      await api.patch('/admin/settings', {
        platform_fee_percent: parseFloat(editingSettings.platformFeePercent),
        auto_approve_days: parseInt(editingSettings.autoApproveDays),
        clearance_days: parseInt(editingSettings.clearanceDays),
        max_revisions: parseInt(editingSettings.maxRevisions),
        min_deposit: parseFloat(editingSettings.minDeposit || 5),
        min_withdrawal: parseFloat(editingSettings.minWithdrawal || 10),
      });
      alert('Saved!', 'Platform settings updated.');
      fetchData();
    } catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed to save'); }
  };

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
    const amount = isWeb ? window.prompt(`Add funds to ${name}'s wallet. Enter amount ($):`, '100') : '100';
    if (!amount) return;
    try { await api.post(`/admin/users/${userId}/add-funds`, { amount: parseFloat(amount), reason: 'Admin credit' }); alert('Done', `$${amount} added to ${name}'s wallet`); fetchData(); }
    catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
  };

  const deductFunds = async (userId: string, name: string) => {
    const amount = isWeb ? window.prompt(`Deduct from ${name}'s wallet. Enter amount ($):`, '50') : '50';
    if (!amount) return;
    try { await api.post(`/admin/users/${userId}/deduct-funds`, { amount: parseFloat(amount), reason: 'Admin deduction' }); alert('Done', `$${amount} deducted from ${name}'s wallet`); fetchData(); }
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
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity onPress={fetchData} style={s.backBtn}><Ionicons name="refresh" size={20} color={C.textSoft} /></TouchableOpacity>
          <TouchableOpacity onPress={() => { if (isWeb ? window.confirm('Sign out?') : true) { logout(); if (isWeb) window.location.href = '/'; else router.replace('/'); } }} style={s.backBtn}><Ionicons name="log-out-outline" size={20} color={C.error} /></TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[
            { key: 'overview', icon: 'stats-chart', label: 'Overview' },
            { key: 'users', icon: 'people', label: 'Users' },
            { key: 'tasks', icon: 'briefcase', label: 'Tasks' },
            { key: 'ai', icon: 'flash', label: 'AI' },
            { key: 'schools', icon: 'school', label: 'Schools' },
            { key: 'settings', icon: 'settings', label: 'Settings' },
          ].map(t => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key as any)} style={[s.tab, tab === t.key && s.tabActive]}>
              <Ionicons name={t.icon as any} size={16} color={tab === t.key ? C.primary : C.textMuted} />
              <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
          {/* Telegram + Schools quick actions (overview) */}
          {tab === 'overview' && (
            <>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <TouchableOpacity onPress={async () => { try { await api.post('/telegram/setup-webhook'); alert('Done', 'Telegram webhook registered!'); } catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed — add TELEGRAM_BOT_TOKEN to Railway'); } }} style={[s.actionChip, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}>
                  <Ionicons name="paper-plane" size={14} color="#0284C7" /><Text style={[s.actionText, { color: '#0284C7' }]}>Setup Telegram Bot</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => { try { const r = await api.post('/schools/seed'); alert('Done', r.data.message); fetchData(); } catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); } }} style={[s.actionChip, { backgroundColor: C.accentSoft, borderColor: '#D1FAE5' }]}>
                  <Ionicons name="school" size={14} color={C.accent} /><Text style={[s.actionText, { color: C.accent }]}>Seed 50 US Schools</Text>
                </TouchableOpacity>
              </View>
              {aiStatus && (
                <View style={[s.statCard, { width: '100%', marginTop: 10, borderColor: aiStatus.available ? '#D1FAE5' : '#FECACA' }]}>
                  <Ionicons name="flash" size={20} color={aiStatus.available ? C.accent : C.error} />
                  <Text style={s.statLabel}>AI: {aiStatus.deepseek ? 'DeepSeek' : ''}{aiStatus.openai ? ' OpenAI' : ''}{aiStatus.claude ? ' Claude' : ''}{!aiStatus.available ? 'Not configured' : ' ready'}</Text>
                </View>
              )}
            </>
          )}

          {/* AI Tab */}
          {tab === 'ai' && (
            <>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 }}>AI Task Completion</Text>
              <Text style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Generate humanized homework solutions when no helpers are available. Output looks like real student work.</Text>

              <Text style={s.settingLabel}>Task ID (copy from Tasks tab)</Text>
              <TextInput value={aiTaskId} onChangeText={setAiTaskId} placeholder="paste-task-id-here" style={[s.settingInput, { width: '100%', textAlign: 'left', paddingHorizontal: 12, marginBottom: 12 }]} />

              <Text style={s.settingLabel}>Writing Style</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {['student', 'professional', 'casual'].map(st => (
                  <TouchableOpacity key={st} onPress={() => setAiStyle(st)} style={[s.filterChip, aiStyle === st && s.filterChipActive]}>
                    <Text style={[s.filterText, aiStyle === st && { color: '#fff' }]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.settingLabel}>Humanization Level (1-5)</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {['1', '2', '3', '4', '5'].map(l => (
                  <TouchableOpacity key={l} onPress={() => setAiLevel(l)} style={[s.filterChip, aiLevel === l && s.filterChipActive]}>
                    <Text style={[s.filterText, aiLevel === l && { color: '#fff' }]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.settingLabel}>Extra Instructions (optional)</Text>
              <TextInput value={aiInstructions} onChangeText={setAiInstructions} placeholder="e.g. Focus on chapter 5, use APA format..." multiline style={[s.settingInput, { width: '100%', textAlign: 'left', paddingHorizontal: 12, height: 60, marginBottom: 12 }]} />

              <TouchableOpacity onPress={async () => {
                if (!aiTaskId) { alert('Required', 'Enter a task ID'); return; }
                setAiLoading(true); setAiOutput('');
                try {
                  const { data } = await api.post('/ai/complete-task', { task_id: aiTaskId, style: aiStyle, humanize_level: parseInt(aiLevel), instructions: aiInstructions || undefined });
                  setAiOutput(data.output);
                  alert('Generated', data.wordCount + ' words via ' + data.provider);
                } catch (e: any) { alert('Error', e.response?.data?.detail || 'Generation failed'); }
                finally { setAiLoading(false); }
              }} disabled={aiLoading} style={s.saveBtn}>
                {aiLoading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="flash" size={18} color="#fff" /><Text style={s.saveBtnText}>Generate Solution</Text></>}
              </TouchableOpacity>

              {aiOutput ? (
                <View style={[s.settingCard, { marginTop: 12 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>Generated Output</Text>
                    <TouchableOpacity onPress={() => { if (isWeb) { navigator.clipboard.writeText(aiOutput); alert('Copied', 'Output copied to clipboard'); } }}>
                      <Text style={{ fontSize: 12, color: C.primary, fontWeight: '600' }}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 14, color: C.textSoft, lineHeight: 22 }} selectable>{aiOutput}</Text>
                </View>
              ) : null}
            </>
          )}

          {/* Schools Tab */}
          {tab === 'schools' && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: C.text }}>Schools ({schoolsList.length})</Text>
                <TouchableOpacity onPress={async () => { try { const r = await api.post('/schools/seed'); alert('Done', r.data.message); fetchData(); } catch (e: any) { alert('Error', e.response?.data?.detail || 'Already seeded'); } }} style={[s.actionChip, { backgroundColor: C.accentSoft, borderColor: '#D1FAE5' }]}>
                  <Ionicons name="add-circle" size={14} color={C.accent} /><Text style={[s.actionText, { color: C.accent }]}>Seed Schools</Text>
                </TouchableOpacity>
              </View>
              {schoolsList.map((sc: any) => (
                <View key={sc.id} style={s.taskCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.taskTitle}>{sc.name}</Text>
                    <Text style={s.taskMeta}>{sc.shortName} · {sc.city}, {sc.state} {sc.telegramChannel ? '· ' + sc.telegramChannel : ''}</Text>
                  </View>
                  <TouchableOpacity onPress={async () => {
                    const channel = isWeb ? window.prompt('Telegram channel (e.g. @schoolchannel):') : '';
                    if (channel) {
                      try { await api.patch('/schools/' + sc.id, { name: sc.name, telegram_channel: channel }); alert('Updated', 'Channel added'); fetchData(); }
                      catch (e: any) { alert('Error', e.response?.data?.detail || 'Failed'); }
                    }
                  }} style={{ padding: 8 }}><Ionicons name="paper-plane-outline" size={16} color={C.cyan} /></TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Settings tab */}
          {tab === 'settings' && settings && (
            <>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 16 }}>Platform Configuration</Text>

              <View style={s.settingCard}>
                <View style={s.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.settingLabel}>Platform Commission (%)</Text>
                    <Text style={s.settingHint}>Fee deducted from each completed order</Text>
                  </View>
                  <TextInput
                    value={String(editingSettings.platformFeePercent ?? '')}
                    onChangeText={v => setEditingSettings({...editingSettings, platformFeePercent: v})}
                    keyboardType="numeric" style={s.settingInput}
                  />
                </View>

                <View style={s.settingDivider} />

                <View style={s.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.settingLabel}>Auto-Approve (days)</Text>
                    <Text style={s.settingHint}>Days after delivery before auto-completion</Text>
                  </View>
                  <TextInput
                    value={String(editingSettings.autoApproveDays ?? '')}
                    onChangeText={v => setEditingSettings({...editingSettings, autoApproveDays: v})}
                    keyboardType="numeric" style={s.settingInput}
                  />
                </View>

                <View style={s.settingDivider} />

                <View style={s.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.settingLabel}>Clearance Period (days)</Text>
                    <Text style={s.settingHint}>Days before helper can withdraw earned funds</Text>
                  </View>
                  <TextInput
                    value={String(editingSettings.clearanceDays ?? '')}
                    onChangeText={v => setEditingSettings({...editingSettings, clearanceDays: v})}
                    keyboardType="numeric" style={s.settingInput}
                  />
                </View>

                <View style={s.settingDivider} />

                <View style={s.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.settingLabel}>Free Revisions</Text>
                    <Text style={s.settingHint}>Number of free revision requests per order</Text>
                  </View>
                  <TextInput
                    value={String(editingSettings.maxRevisions ?? '')}
                    onChangeText={v => setEditingSettings({...editingSettings, maxRevisions: v})}
                    keyboardType="numeric" style={s.settingInput}
                  />
                </View>
              </View>

              <TouchableOpacity onPress={saveSettings} style={s.saveBtn}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={s.saveBtnText}>Save Settings</Text>
              </TouchableOpacity>

              <View style={s.settingCard}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.textMuted, marginBottom: 8 }}>Current Values</Text>
                <Text style={s.settingCurrent}>Commission: {settings.platformFeePercent}% per order</Text>
                <Text style={s.settingCurrent}>Auto-approve: {settings.autoApproveDays} days after delivery</Text>
                <Text style={s.settingCurrent}>Clearance: {settings.clearanceDays} days before withdrawal</Text>
                <Text style={s.settingCurrent}>Revisions: {settings.maxRevisions} free per order</Text>
              </View>
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
  settingCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  settingHint: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  settingInput: { width: 70, height: 42, backgroundColor: C.bgSoft, borderRadius: 10, borderWidth: 1, borderColor: C.border, textAlign: 'center', fontSize: 16, fontWeight: '700', color: C.primary },
  settingDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 12, height: 48, marginBottom: 16 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  settingCurrent: { fontSize: 13, color: C.textSoft, lineHeight: 22 },
});
