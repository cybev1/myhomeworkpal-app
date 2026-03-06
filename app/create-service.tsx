import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius, APP_CONFIG } from '@/constants/theme';
import { FloatingInput, Button } from '@/components/UI';

export default function CreateServiceScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Ionicons name="close" size={24} color={'#4A5068'} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create a Service</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg }}>
        <FloatingInput label="Service Title" value={title} onChangeText={setTitle} placeholder="e.g., Expert Math Tutoring" icon="briefcase-outline" />
        <FloatingInput label="Description" value={description} onChangeText={setDescription} placeholder="Describe what you offer..." multiline numberOfLines={5} icon="create-outline" />
        <Text style={s.label}>Category</Text>
        <View style={s.catGrid}>
          {APP_CONFIG.categories.map((cat) => (
            <TouchableOpacity key={cat.id} onPress={() => setCategory(cat.id)} style={[s.catChip, category === cat.id && { borderColor: cat.color, backgroundColor: `${cat.color}12` }]}>
              <Text style={[s.catText, category === cat.id && { color: '#1A1D2B' }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <FloatingInput label="Starting Price ($)" value={price} onChangeText={setPrice} placeholder="15" keyboardType="numeric" icon="cash-outline" />
        <FloatingInput label="Delivery Time (days)" value={deliveryDays} onChangeText={setDeliveryDays} placeholder="2" keyboardType="numeric" icon="time-outline" />
        <Button title="Create Service" onPress={() => Alert.alert('Success', 'Service created!', [{ text: 'OK', onPress: () => router.back() }])} fullWidth size="lg" icon="checkmark-circle-outline" style={{ marginTop: Spacing.lg }} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#FFFFFF'Border },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF'Elevated, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: '#1A1D2B' },
  label: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: '#6B7280', marginBottom: Spacing.sm, marginTop: Spacing.sm },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  catChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: '#FFFFFF'Border, backgroundColor: '#FFFFFF'Card },
  catText: { fontSize: Fonts.sizes.sm, color: '#8B91A8', fontWeight: '500' },
});
