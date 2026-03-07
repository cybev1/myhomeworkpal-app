import React, { ReactNode } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ActivityIndicator,
  StyleSheet, ViewStyle, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius, Shadows } from '@/constants/theme';

const isWeb = Platform.OS === 'web';

// ═══════════════════════════════════════
// BUTTON — Clean white-theme CTA
// ═══════════════════════════════════════
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, icon, fullWidth, style,
}) => {
  const heights = { sm: 40, md: 50, lg: 58 };
  const fontSizes = { sm: Fonts.sizes.sm, md: Fonts.sizes.base, lg: Fonts.sizes.md };
  const h = heights[size];

  const vs: Record<string, { bg: string; border: string; text: string }> = {
    primary:   { bg: Colors.primary, border: 'transparent', text: '#FFFFFF' },
    secondary: { bg: Colors.bgSoft, border: Colors.border, text: Colors.text },
    outline:   { bg: 'transparent', border: Colors.primary, text: Colors.primary },
    ghost:     { bg: 'transparent', border: 'transparent', text: Colors.primary },
    danger:    { bg: 'rgba(239,68,68,0.08)', border: Colors.error, text: Colors.error },
  };
  const v = vs[variant] || vs.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.btnBase,
        {
          height: h, borderRadius: h / 2,
          backgroundColor: disabled ? Colors.bgMuted : v.bg,
          borderWidth: variant === 'ghost' || variant === 'primary' ? 0 : 1.5,
          borderColor: v.border,
        },
        variant === 'primary' && !disabled && Shadows.glow,
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.btnInner}>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={disabled ? Colors.textMuted : v.text} style={{ marginRight: 8 }} />}
          <Text style={[styles.btnText, { fontSize: fontSizes[size], color: disabled ? Colors.textMuted : v.text }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════
// FLOATING INPUT
// ═══════════════════════════════════════
interface InputProps {
  label: string; value: string; onChangeText: (text: string) => void;
  placeholder?: string; secureTextEntry?: boolean; keyboardType?: any;
  multiline?: boolean; numberOfLines?: number;
  icon?: keyof typeof Ionicons.glyphMap; error?: string; style?: ViewStyle;
}

export const FloatingInput: React.FC<InputProps> = ({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, multiline, numberOfLines, icon, error, style,
}) => {
  const [focused, setFocused] = React.useState(false);
  const isActive = focused || value.length > 0;

  return (
    <View style={[{ marginBottom: Spacing.base }, style]}>
      <View style={[
        styles.inputContainer,
        focused && styles.inputFocused,
        error && styles.inputError,
        multiline && { height: (numberOfLines || 4) * 24 + 40 },
      ]}>
        {icon && <Ionicons name={icon} size={20} color={focused ? Colors.primary : Colors.textMuted} style={{ marginRight: Spacing.sm }} />}
        <View style={{ flex: 1 }}>
          <Text style={[styles.floatingLabel, isActive && styles.floatingLabelActive]}>{label}</Text>
          <TextInput
            value={value} onChangeText={onChangeText}
            placeholder={isActive ? placeholder : ''} placeholderTextColor={Colors.textMuted}
            secureTextEntry={secureTextEntry} keyboardType={keyboardType}
            multiline={multiline} numberOfLines={numberOfLines}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={[styles.input, isActive && { paddingTop: 14 }, multiline && { textAlignVertical: 'top', height: (numberOfLines || 4) * 24 }]}
          />
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// ═══════════════════════════════════════
// CARD — White professional
// ═══════════════════════════════════════
interface CardProps { children: ReactNode; onPress?: () => void; style?: ViewStyle; variant?: 'default' | 'elevated' | 'glass' | 'gradient'; }

export const Card: React.FC<CardProps> = ({ children, onPress, style, variant = 'default' }) => {
  const cardMap: Record<string, ViewStyle> = {
    default:  { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border },
    elevated: { backgroundColor: '#fff', ...Shadows.md },
    glass:    { backgroundColor: Colors.bgSoft, borderWidth: 1, borderColor: Colors.border },
    gradient: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border },
  };
  const inner = <View style={[styles.card, cardMap[variant], style]}>{children}</View>;
  return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.85}>{inner}</TouchableOpacity> : inner;
};

// ═══════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════
interface AvatarProps { name: string; uri?: string; size?: number; online?: boolean; verified?: boolean; }

export const Avatar: React.FC<AvatarProps> = ({ name, uri, size = 44, online, verified }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View style={{ position: 'relative' }}>
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.primary }]}>
        <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '700' }}>{initials}</Text>
      </View>
      {online && <View style={[styles.onlineDot, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14 }]} />}
      {verified && <View style={[styles.verifiedBadge, { bottom: -2, right: -2 }]}><Ionicons name="checkmark-circle" size={size * 0.36} color={Colors.primary} /></View>}
    </View>
  );
};

// ═══════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════
interface BadgeProps { label: string; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium'; size?: 'sm' | 'md'; }

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', size = 'sm' }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    default: { bg: Colors.bgMuted, text: Colors.textMuted },
    success: { bg: 'rgba(16,185,129,0.1)', text: '#059669' },
    warning: { bg: 'rgba(245,158,11,0.1)', text: '#D97706' },
    error:   { bg: 'rgba(239,68,68,0.1)', text: Colors.error },
    info:    { bg: 'rgba(6,182,212,0.1)', text: '#0891B2' },
    premium: { bg: 'rgba(245,158,11,0.1)', text: '#D97706' },
  };
  const c = colors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, paddingVertical: size === 'sm' ? 3 : 6 }]}>
      <Text style={[styles.badgeText, { color: c.text, fontSize: size === 'sm' ? 11 : 13 }]}>{label}</Text>
    </View>
  );
};

// ═══════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════
interface SectionProps { title: string; subtitle?: string; action?: { label: string; onPress: () => void }; }

export const SectionHeader: React.FC<SectionProps> = ({ title, subtitle, action }) => (
  <View style={styles.sectionHeader}>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {action && (
      <TouchableOpacity onPress={action.onPress} style={styles.sectionAction}>
        <Text style={styles.sectionActionText}>{action.label}</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
      </TouchableOpacity>
    )}
  </View>
);

// ═══════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════
interface EmptyProps { icon: keyof typeof Ionicons.glyphMap; title: string; message: string; action?: { label: string; onPress: () => void }; }

export const EmptyState: React.FC<EmptyProps> = ({ icon, title, message, action }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}><Ionicons name={icon} size={48} color={Colors.textMuted} /></View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
    {action && <Button title={action.label} onPress={action.onPress} variant="primary" size="sm" style={{ marginTop: Spacing.lg }} />}
  </View>
);

// ═══════════════════════════════════════
// STAR RATING
// ═══════════════════════════════════════
export const StarRating: React.FC<{ rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void }> = ({
  rating, size = 18, interactive, onChange,
}) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} disabled={!interactive} onPress={() => onChange?.(star)}>
        <Ionicons
          name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={size} color={star <= rating ? Colors.accentGold : Colors.border}
        />
      </TouchableOpacity>
    ))}
  </View>
);

// ═══════════════════════════════════════
const styles = StyleSheet.create({
  btnBase: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', letterSpacing: 0.3 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSoft,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base, height: 58,
  },
  inputFocused: { borderColor: Colors.primary, backgroundColor: 'rgba(79,70,229,0.03)' },
  inputError: { borderColor: Colors.error },
  floatingLabel: { position: 'absolute', top: 18, left: 0, fontSize: Fonts.sizes.base, color: Colors.textMuted },
  floatingLabelActive: { top: 4, fontSize: Fonts.sizes.xs, color: Colors.primary },
  input: { flex: 1, color: Colors.text, fontSize: Fonts.sizes.base, paddingTop: 0, paddingBottom: 0, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  errorText: { color: Colors.error, fontSize: Fonts.sizes.xs, marginTop: 4, marginLeft: Spacing.base },
  card: { borderRadius: Radius.xl, padding: Spacing.base, overflow: 'hidden' },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.online, borderWidth: 2, borderColor: '#fff' },
  verifiedBadge: { position: 'absolute', backgroundColor: '#fff', borderRadius: 99 },
  badge: { paddingHorizontal: Spacing.sm, borderRadius: Radius.full, alignSelf: 'flex-start' },
  badgeText: { fontWeight: '600', letterSpacing: 0.3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.text, letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['5xl'], paddingHorizontal: Spacing['2xl'] },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.bgSoft, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  emptyTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyMessage: { fontSize: Fonts.sizes.base, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
