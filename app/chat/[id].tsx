import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { Avatar } from '@/components/UI';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  type: 'text' | 'file' | 'system';
  createdAt: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const currentUserId = 'me';
  const otherUser = { id: '10', name: 'Dr. Chen', online: true, verified: true };

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', content: 'Hi! I saw your Calculus II task. I\'d love to help!', senderId: '10', type: 'text', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', content: 'Great! Can you handle integration by parts and trig sub?', senderId: 'me', type: 'text', createdAt: new Date(Date.now() - 3500000).toISOString() },
    { id: '3', content: 'Absolutely! That\'s my specialty. I\'ll provide step-by-step solutions with explanations for each technique.', senderId: '10', type: 'text', createdAt: new Date(Date.now() - 3400000).toISOString() },
    { id: '4', content: 'I\'ve started working on the integration problems. Should be done by tonight!', senderId: '10', type: 'text', createdAt: new Date(Date.now() - 600000).toISOString() },
    { id: 'sys1', content: 'Payment of $35 held in escrow', senderId: 'system', type: 'system', createdAt: new Date(Date.now() - 500000).toISOString() },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      content: message.trim(),
      senderId: currentUserId,
      type: 'text',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === currentUserId;
    const isSystem = item.type === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMsg}>
          <Ionicons name="shield-checkmark" size={14} color={'#10B981'} />
          <Text style={styles.systemMsgText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        {!isMine && <Avatar name={otherUser.name} size={32} />}
        <View style={[styles.msgBubble, isMine ? styles.msgBubbleMine : styles.msgBubbleOther]}>
          {isMine ? (
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.msgGradient}
            >
              <Text style={[styles.msgText, { color: '#fff' }]}>{item.content}</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.msgText}>{item.content}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={'#4A5068'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.userInfo}>
          <Avatar name={otherUser.name} size={36} online={otherUser.online} verified={otherUser.verified} />
          <View style={{ marginLeft: Spacing.sm }}>
            <Text style={styles.userName}>{otherUser.name}</Text>
            <Text style={styles.userStatus}>
              {otherUser.online ? 'Online' : 'Last seen recently'}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="call-outline" size={20} color={'#4A5068'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={'#4A5068'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add-circle-outline" size={26} color={'#8B91A8'} />
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor={'#8B91A8'}
              style={styles.input}
              multiline
              maxLength={2000}
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendBtn, message.trim() && styles.sendBtnActive]}
            disabled={!message.trim()}
          >
            {message.trim() ? (
              <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.sendGradient}>
                <Ionicons name="send" size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <Ionicons name="mic-outline" size={22} color={'#8B91A8'} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#E4E7F0',
    backgroundColor: '#F7F8FC',
  },
  backBtn: { padding: 8 },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.sm },
  userName: { fontSize: Fonts.sizes.base, fontWeight: '700', color: '#1A1D2B' },
  userStatus: { fontSize: Fonts.sizes.xs, color: '#10B981', fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: { padding: 8 },
  msgList: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.md, gap: 8 },
  msgRowMine: { justifyContent: 'flex-end' },
  msgBubble: { maxWidth: '75%', borderRadius: Radius.xl, overflow: 'hidden' },
  msgBubbleMine: {},
  msgBubbleOther: {
    backgroundColor: '#F0F2F8', padding: Spacing.md,
    borderWidth: 1, borderColor: '#E4E7F0',
  },
  msgGradient: { padding: Spacing.md, borderRadius: Radius.xl },
  msgText: { fontSize: Fonts.sizes.base, color: '#4A5068', lineHeight: 22 },
  systemMsg: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.sm, marginBottom: Spacing.md,
  },
  systemMsgText: { fontSize: Fonts.sizes.xs, color: '#8B91A8' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.sm,
    borderTopWidth: 1, borderTopColor: '#E4E7F0',
    backgroundColor: '#F7F8FC', gap: 8,
  },
  attachBtn: { paddingBottom: 6 },
  inputWrap: {
    flex: 1, backgroundColor: '#F0F2F8', borderRadius: Radius.xl,
    paddingHorizontal: Spacing.base, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E4E7F0', maxHeight: 120,
  },
  input: { fontSize: Fonts.sizes.base, color: '#1A1D2B', maxHeight: 100 },
  sendBtn: { paddingBottom: 4 },
  sendBtnActive: {},
  sendGradient: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
});
