// MyHomeworkPal Design System
// Aesthetic: Premium Academic — Dark luxe with electric accents
// Inspired by: Upwork meets Linear meets Stripe

export const Colors = {
  // Core palette
  primary: '#6C5CE7',       // Electric violet
  primaryLight: '#A29BFE',  // Soft violet
  primaryDark: '#5A4BD1',   // Deep violet
  accent: '#00D2FF',        // Cyan spark
  accentGold: '#FFD93D',    // Achievement gold
  success: '#00E676',       // Mint success
  warning: '#FF9100',       // Amber warning
  error: '#FF5252',         // Coral error

  // Neutrals — cool-toned
  dark: '#0A0F1E',          // Deep navy
  darkCard: '#111827',      // Card surface
  darkElevated: '#1A2332',  // Elevated surface
  darkBorder: '#2A3441',    // Subtle borders
  muted: '#64748B',         // Muted text
  subtle: '#94A3B8',        // Subtle elements
  light: '#CBD5E1',         // Light text
  white: '#F8FAFC',         // Off-white
  pureWhite: '#FFFFFF',

  // Semantic
  online: '#00E676',
  offline: '#64748B',
  verified: '#6C5CE7',
  premium: '#FFD93D',

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#6C5CE7', '#A29BFE'],
  gradientAccent: ['#00D2FF', '#6C5CE7'],
  gradientDark: ['#0A0F1E', '#111827'],
  gradientGold: ['#FFD93D', '#FF9100'],
  gradientSuccess: ['#00E676', '#00D2FF'],
  gradientCard: ['rgba(108,92,231,0.08)', 'rgba(0,210,255,0.04)'],
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
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://your-api.railway.app',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://your-api.railway.app',
  STRIPE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY || '',
};

export const APP_CONFIG = {
  name: 'MyHomeworkPal',
  tagline: 'Your Academic Marketplace',
  description: 'Get expert help with any assignment. Trusted by thousands of students worldwide.',
  maxFileSize: 25 * 1024 * 1024, // 25MB
  supportedFileTypes: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.zip'],
  categories: [
    { id: 'math', label: 'Mathematics', icon: 'calculator', color: '#6C5CE7' },
    { id: 'science', label: 'Science', icon: 'flask-outline', color: '#00D2FF' },
    { id: 'english', label: 'English & Writing', icon: 'book-open-variant', color: '#FF9100' },
    { id: 'cs', label: 'Computer Science', icon: 'code-tags', color: '#00E676' },
    { id: 'business', label: 'Business', icon: 'briefcase', color: '#FFD93D' },
    { id: 'engineering', label: 'Engineering', icon: 'cog', color: '#FF5252' },
    { id: 'humanities', label: 'Humanities', icon: 'school', color: '#A29BFE' },
    { id: 'other', label: 'Other', icon: 'dots-horizontal', color: '#94A3B8' },
  ],
};
