import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { Avatar, Badge, StarRating, Card, Button } from '@/components/UI';

export default function ProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={'#4A5068'} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, alignItems: 'center' }}>
        <Avatar name="Dr. Chen" size={80} verified online />
        <Text style={s.name}>Dr. Chen</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <StarRating rating={4.9} size={18} />
          <Text style={s.meta}>4.9 (234 reviews)</Text>
        </View>
        <Badge label="Verified Helper" variant="info" size="md" />
        <Text style={s.bio}>PhD math student at Stanford. Specializing in calculus, linear algebra, and statistics. 198 completed orders with 99% satisfaction rate.</Text>
        <Card variant="glass" style={s.statsCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.statVal}>198</Text>
              <Text style={s.statLbl}>Completed</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.statVal}>4.9</Text>
              <Text style={s.statLbl}>Rating</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.statVal}>1 day</Text>
              <Text style={s.statLbl}>Avg Delivery</Text>
            </View>
          </View>
        </Card>
        <Button title="Hire Dr. Chen" onPress={() => router.push('/create-task')} fullWidth icon="briefcase-outline" style={{ marginTop: Spacing.lg }} />
        <Button title="Message" onPress={() => router.push('/chat/10')} variant="outline" fullWidth icon="chatbubble-outline" style={{ marginTop: Spacing.md }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F2F8', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: '#1A1D2B' },
  name: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: '#1A1D2B', marginTop: Spacing.md },
  meta: { fontSize: Fonts.sizes.sm, color: '#8B91A8' },
  bio: { fontSize: Fonts.sizes.base, color: '#6B7280', lineHeight: 24, textAlign: 'center', marginTop: Spacing.lg, marginBottom: Spacing.lg },
  statsCard: { width: '100%', marginTop: Spacing.md },
  statVal: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: '#1A1D2B' },
  statLbl: { fontSize: Fonts.sizes.xs, color: '#8B91A8', marginTop: 2 },
});
