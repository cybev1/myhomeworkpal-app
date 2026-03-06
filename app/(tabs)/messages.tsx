import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { ConversationItem } from '@/components/Cards';
import { EmptyState } from '@/components/UI';

export default function MessagesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const mockConversations = [
    {
      id: '1',
      participant: { id: '10', name: 'Dr. Chen', role: 'helper' as const, createdAt: '', verified: true },
      lastMessage: { content: 'I\'ve started working on the integration problems. Should be done by tonight!', createdAt: new Date(Date.now() - 600000).toISOString() },
      unreadCount: 2,
      updatedAt: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: '2',
      participant: { id: '11', name: 'Alex R.', role: 'helper' as const, createdAt: '' },
      lastMessage: { content: 'The Python project is ready for review. Check the attached files.', createdAt: new Date(Date.now() - 3600000).toISOString() },
      unreadCount: 0,
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      participant: { id: '12', name: 'Prof. Williams', role: 'helper' as const, createdAt: '' },
      lastMessage: { content: 'Thank you for the 5-star review! Happy to help anytime.', createdAt: new Date(Date.now() - 86400000).toISOString() },
      unreadCount: 0,
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '4',
      participant: { id: '5', name: 'Support Team', role: 'admin' as const, createdAt: '' },
      lastMessage: { content: 'Welcome to MyHomeworkPal! Let us know if you need anything.', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      unreadCount: 1,
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];

  const filtered = searchQuery
    ? mockConversations.filter((c) =>
        c.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockConversations;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.composeBtn}>
          <Ionicons name="create-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.muted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Online helpers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.onlineRow}>
        {mockConversations.map((conv) => (
          <TouchableOpacity key={conv.id} style={styles.onlineItem}>
            <View style={styles.onlineAvatar}>
              <Text style={styles.onlineInitials}>
                {conv.participant.name.split(' ').map(n => n[0]).join('')}
              </Text>
              <View style={styles.onlineDot} />
            </View>
            <Text style={styles.onlineName} numberOfLines={1}>
              {conv.participant.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Conversations */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations"
            message="Start chatting with helpers when you post a task"
          />
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              onPress={() => router.push(`/chat/${conv.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: Fonts.sizes['2xl'], fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  composeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(108,92,231,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCard,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: Fonts.sizes.sm,
    marginLeft: Spacing.sm,
  },
  onlineRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBorder,
  },
  onlineItem: { alignItems: 'center', width: 60 },
  onlineAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineInitials: { color: '#fff', fontSize: 16, fontWeight: '700' },
  onlineDot: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 14, height: 14,
    borderRadius: 7,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  onlineName: { fontSize: 11, color: Colors.subtle, marginTop: 4, fontWeight: '500' },
});
