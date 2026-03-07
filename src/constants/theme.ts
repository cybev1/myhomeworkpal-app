// MyHomeworkPal Design System
// Aesthetic: Premium Academic — Dark luxe with electric accents
// Inspired by: Upwork meets Linear meets Stripe

export const Colors = {
  // Core palette — Clean white professional theme
  primary: '#4F46E5',       // Indigo
  primaryLight: '#818CF8',  // Light indigo
  primarySoft: '#EEF0FF',   // Indigo tint
  primaryDark: '#3730A3',   // Deep indigo
  accent: '#10B981',        // Emerald
  accentSoft: '#ECFDF5',    // Emerald tint
  accentGold: '#F59E0B',    // Amber gold
  success: '#10B981',       // Emerald success
  warning: '#F59E0B',       // Amber warning
  error: '#EF4444',         // Red error
  cyan: '#06B6D4',          // Cyan

  // Neutrals — white professional
  bg: '#FFFFFF',             // White background
  bgSoft: '#F7F8FC',        // Soft grey background
  bgMuted: '#F0F2F8',       // Muted background
  text: '#1A1D2B',          // Deep text
  textSoft: '#4A5068',      // Secondary text
  textMuted: '#8B91A8',     // Muted text
  border: '#E4E7F0',        // Light borders
  white: '#FFFFFF',
  pureWhite: '#FFFFFF',

  // Legacy aliases (for components that still reference old names)
  dark: '#1A1D2B',
  darkCard: '#FFFFFF',
  darkElevated: '#F7F8FC',
  darkBorder: '#E4E7F0',
  muted: '#8B91A8',
  subtle: '#6B7280',
  light: '#4A5068',

  // Semantic
  online: '#10B981',
  offline: '#8B91A8',
  verified: '#4F46E5',
  premium: '#F59E0B',

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#4F46E5', '#6366F1'],
  gradientAccent: ['#10B981', '#34D399'],
  gradientDark: ['#F7F8FC', '#FFFFFF'],
  gradientGold: ['#F59E0B', '#FBBF24'],
  gradientSuccess: ['#10B981', '#34D399'],
  gradientCard: ['rgba(79,70,229,0.04)', 'rgba(16,185,129,0.02)'],
};

export const Fonts = {
  // Using system fonts that look premium on mobile
  heading: 'System',      // Will use SF Pro Display / Roboto
  body: 'System',
  mono: 'SpaceMono',

  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
    hero: 56,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },

  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://myhomeworkpal-api-production.up.railway.app/api/v1',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://myhomeworkpal-api-production.up.railway.app',
  STRIPE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY || '',
};

export const APP_CONFIG = {
  name: 'MyHomeworkPal',
  tagline: 'Your Academic Marketplace',
  description: 'Get expert help with any assignment. Trusted by thousands of students worldwide.',
  maxFileSize: 25 * 1024 * 1024, // 25MB
  supportedFileTypes: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.zip'],
  categories: [
    { id: 'math', label: 'Mathematics', icon: 'calculator', color: '#4F46E5' },
    { id: 'science', label: 'Science', icon: 'flask-outline', color: '#10B981' },
    { id: 'english', label: 'English & Writing', icon: 'book-open-variant', color: '#E67E22' },
    { id: 'cs', label: 'Computer Science', icon: 'code-tags', color: '#06B6D4' },
    { id: 'business', label: 'Business', icon: 'briefcase', color: '#F59E0B' },
    { id: 'engineering', label: 'Engineering', icon: 'cog', color: '#EF4444' },
    { id: 'humanities', label: 'Humanities', icon: 'school', color: '#8B5CF6' },
    { id: 'other', label: 'Other', icon: 'dots-horizontal', color: '#8B91A8' },
  ],
};
