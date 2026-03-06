import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = { bg: '#FFFFFF', border: '#E4E7F0', primary: '#4F46E5', muted: '#8B91A8' };

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: s.tabBar,
      tabBarActiveTintColor: C.primary,
      tabBarInactiveTintColor: C.muted,
      tabBarLabelStyle: s.tabLabel,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={color} />, tabBarBadge: 3, tabBarBadgeStyle: { backgroundColor: C.primary, fontSize: 10 } }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} /> }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: { backgroundColor: C.bg, borderTopColor: C.border, borderTopWidth: 1, height: Platform.OS === 'ios' ? 88 : 64, paddingTop: 6, paddingBottom: Platform.OS === 'ios' ? 28 : 8 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
});
