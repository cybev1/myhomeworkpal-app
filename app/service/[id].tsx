import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { Card, Avatar, StarRating, Button } from '@/components/UI';

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Service Details</Text>
        <TouchableOpacity style={s.shareBtn}>
          <Ionicons name="share-outline" size={22} color={Colors.light} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg }}>
        <View style={s.helperRow}>
          <Avatar name="Dr. Chen" size={60} verified online />
          <View style={{ flex: 1, marginLeft: Spacing.base }}>
            <Text style={s.helperName}>Dr. Chen</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <StarRating rating={4.9} size={16} />
              <Text style={s.meta}>(234 reviews)</Text>
            </View>
          </View>
        </View>
        <Text style={s.title}>Expert Math Tutoring & Problem Solving</Text>
        <Text style={s.desc}>
          PhD math student at Stanford. I specialize in all levels of mathematics from algebra through
          graduate-level analysis. Every solution includes detailed step-by-step explanations.
        </Text>
        <Card variant="glass" style={{ marginTop: Spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="flash" size={20} color={Colors.accent} />
              <Text style={s.statVal}>1 day</Text>
              <Text style={s.statLbl}>Delivery</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="refresh" size={20} color={Colors.warning} />
              <Text style={s.statVal}>2</Text>
              <Text style={s.statLbl}>Revisions</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="star" size={20} color={Colors.accentGold} />
              <Text style={s.statVal}>4.9</Text>
              <Text style={s.statLbl}>Rating</Text>
            </View>
          </View>
        </Card>
        <View style={{ height: 100 }} />
      </ScrollView>
      <View style={s.floatingBar}>
        <View>
          <Text style={s.priceLabel}>Starting at</Text>
          <Text style={s.price}>$15</Text>
        </View>
        <Button title="Order Now" onPress={() => router.push('/payment')} icon="cart-outline" />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.darkBorder },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.darkElevated, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.darkElevated, alignItems: 'center', justifyContent: 'center' },
  helperRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  helperName: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.white },
  meta: { fontSize: Fonts.sizes.xs, color: Colors.muted, marginTop: 2 },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.white, lineHeight: 30, marginBottom: Spacing.md },
  desc: { fontSize: Fonts.sizes.base, color: Colors.subtle, lineHeight: 24 },
  statVal: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.white, marginTop: 4 },
  statLbl: { fontSize: Fonts.sizes.xs, color: Colors.muted },
  floatingBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Platform.OS === 'ios' ? 34 : 16, backgroundColor: Colors.darkCard, borderTopWidth: 1, borderTopColor: Colors.darkBorder },
  priceLabel: { fontSize: Fonts.sizes.xs, color: Colors.muted },
  price: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.primaryLight },
});
