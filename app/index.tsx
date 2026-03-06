import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, Platform, TextInput, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/context/stores';

const { width: SCREEN_W } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_W = 1180;
const wide = isWeb && SCREEN_W > 768;

// ─── PALETTE ───────────────────────────────────────────────
const C = {
  bg: '#FFFFFF',
  bgSoft: '#F7F8FC',
  bgMuted: '#F0F2F8',
  text: '#1A1D2B',
  textSoft: '#4A5068',
  textMuted: '#8B91A8',
  border: '#E4E7F0',
  primary: '#4F46E5',       // Indigo
  primarySoft: '#EEF0FF',
  primaryDark: '#3730A3',
  accent: '#10B981',        // Emerald
  accentSoft: '#ECFDF5',
  gold: '#F59E0B',
  goldSoft: '#FFFBEB',
  coral: '#EF4444',
  cyan: '#06B6D4',
  white: '#FFFFFF',
};

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated) router.replace('/(tabs)');
  }, [isAuthenticated]);

  useEffect(() => {
    if (isWeb) {
      const s = document.createElement('style');
      s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; background: #fff; }
        body { font-family: 'DM Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
        ::selection { background: rgba(79,70,229,0.15); color: #1A1D2B; }
        a { text-decoration: none; color: inherit; }
        .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
      `;
      document.head.appendChild(s);
      return () => { document.head.removeChild(s); };
    }
  }, []);

  return (
    <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>

      {/* ═══ NAVBAR ═══ */}
      <View style={styles.navOuter}>
        <View style={[styles.navInner, { maxWidth: MAX_W }]}>
          <TouchableOpacity style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Ionicons name="school" size={18} color="#fff" />
            </View>
            <Text style={[styles.logoText, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>
              MyHomeworkPal
            </Text>
          </TouchableOpacity>

          {wide && (
            <View style={styles.navLinks}>
              <Text style={styles.navLink}>How It Works</Text>
              <Text style={styles.navLink}>Browse Tasks</Text>
              <Text style={styles.navLink}>Find Experts</Text>
              <Text style={styles.navLink}>Pricing</Text>
            </View>
          )}

          <View style={styles.navActions}>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.navLoginText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.navCta}>
              <Text style={styles.navCtaText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ═══ HERO ═══ */}
      <View style={styles.heroOuter}>
        <View style={[styles.heroInner, { maxWidth: MAX_W, flexDirection: wide ? 'row' : 'column' }]}>
          <View style={[styles.heroLeft, wide && { flex: 1, maxWidth: '55%' }]}>
            {/* Trust badge */}
            <View style={styles.trustPill}>
              <View style={styles.trustDot} />
              <Text style={styles.trustText}>Trusted by 10,000+ students at top universities</Text>
            </View>

            <Text style={[styles.heroTitle, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>
              Get Expert Help{'\n'}With Any{' '}
              <Text style={styles.heroHighlight}>Assignment</Text>
            </Text>

            <Text style={styles.heroSub}>
              Post your homework, receive bids from verified experts in minutes, and pay
              only when you're satisfied. Escrow-protected, quality-guaranteed.
            </Text>

            {/* Search bar */}
            <View style={styles.searchBox}>
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={20} color={C.textMuted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="What do you need help with? e.g. Calculus, Python, Essay..."
                  placeholderTextColor={C.textMuted}
                  style={styles.searchInput}
                />
              </View>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.searchCta}>
                <Text style={styles.searchCtaText}>Find an Expert</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagsRow}>
              <Text style={styles.tagLabel}>Popular:</Text>
              {['Calculus', 'Python', 'Essay Writing', 'Statistics', 'Physics'].map((t) => (
                <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
              ))}
            </View>
          </View>

          {/* Hero right — stat cards on desktop */}
          {wide && (
            <View style={styles.heroRight}>
              {/* Decorative blobs */}
              <View style={[styles.blob, { width: 340, height: 340, top: -20, right: -40, backgroundColor: C.primarySoft, borderRadius: 170 }]} />
              <View style={[styles.blob, { width: 200, height: 200, bottom: 20, right: 80, backgroundColor: C.accentSoft, borderRadius: 100 }]} />
              <View style={[styles.blob, { width: 140, height: 140, top: 80, right: 20, backgroundColor: C.goldSoft, borderRadius: 70 }]} />

              <FloatCard icon="people" value="10,000+" label="Active Students" color={C.primary} top={30} right={60} />
              <FloatCard icon="star" value="4.9/5" label="Average Rating" color={C.gold} top={170} right={10} />
              <FloatCard icon="checkmark-done" value="50K+" label="Tasks Delivered" color={C.accent} top={310} right={80} />
            </View>
          )}
        </View>
      </View>

      {/* ═══ LOGOS / SOCIAL PROOF BAR ═══ */}
      <View style={styles.proofBar}>
        <View style={[styles.proofInner, { maxWidth: MAX_W }]}>
          <Stat value="10K+" label="Students" icon="people-outline" />
          <View style={styles.proofDiv} />
          <Stat value="5K+" label="Verified Experts" icon="shield-checkmark-outline" />
          <View style={styles.proofDiv} />
          <Stat value="50K+" label="Tasks Completed" icon="checkmark-done-outline" />
          <View style={styles.proofDiv} />
          <Stat value="4.9★" label="Satisfaction" icon="heart-outline" />
        </View>
      </View>

      {/* ═══ HOW IT WORKS ═══ */}
      <View style={[styles.section, { backgroundColor: C.bg }]}>
        <View style={[styles.sectionInner, { maxWidth: MAX_W }]}>
          <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>HOW IT WORKS</Text></View>
          <Text style={[styles.sectionTitle, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>
            From posting to payment in 4 simple steps
          </Text>
          <Text style={styles.sectionSub}>No complexity. Just results.</Text>

          <View style={[styles.stepsGrid, wide && { flexDirection: 'row' }]}>
            <Step n={1} icon="create-outline" title="Post Your Task" desc="Describe your assignment, set a budget, and upload files. Takes 2 minutes." color={C.primary} />
            <Step n={2} icon="flash-outline" title="Get Instant Bids" desc="Verified experts compete to help. Compare profiles, ratings, and prices." color={C.cyan} />
            <Step n={3} icon="shield-checkmark-outline" title="Escrow Payment" desc="Funds held securely. Only released when you approve the delivered work." color={C.accent} />
            <Step n={4} icon="happy-outline" title="Get Results" desc="Receive your work, request revisions if needed, and rate your experience." color={C.gold} />
          </View>
        </View>
      </View>

      {/* ═══ CATEGORIES ═══ */}
      <View style={[styles.section, { backgroundColor: C.bgSoft }]}>
        <View style={[styles.sectionInner, { maxWidth: MAX_W }]}>
          <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>SUBJECTS</Text></View>
          <Text style={[styles.sectionTitle, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>
            Every subject, every level
          </Text>
          <Text style={styles.sectionSub}>From freshman courses to PhD dissertations</Text>

          <View style={[styles.catGrid, wide && { flexDirection: 'row', flexWrap: 'wrap' }]}>
            <Cat icon="calculator-outline" title="Mathematics" count="2,400+ experts" color={C.primary} />
            <Cat icon="code-slash-outline" title="Computer Science" count="1,800+ experts" color={C.cyan} />
            <Cat icon="book-outline" title="English & Writing" count="2,100+ experts" color="#E67E22" />
            <Cat icon="flask-outline" title="Science" count="1,500+ experts" color={C.accent} />
            <Cat icon="briefcase-outline" title="Business" count="1,200+ experts" color={C.gold} />
            <Cat icon="construct-outline" title="Engineering" count="900+ experts" color={C.coral} />
            <Cat icon="school-outline" title="Humanities" count="1,100+ experts" color="#8B5CF6" />
            <Cat icon="earth-outline" title="Social Sciences" count="800+ experts" color="#0EA5E9" />
          </View>
        </View>
      </View>

      {/* ═══ WHY US ═══ */}
      <View style={[styles.section, { backgroundColor: C.bg }]}>
        <View style={[styles.sectionInner, { maxWidth: MAX_W }]}>
          <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>WHY US</Text></View>
          <Text style={[styles.sectionTitle, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>
            Built for trust, speed, and quality
          </Text>

          <View style={[styles.whyGrid, wide && { flexDirection: 'row', flexWrap: 'wrap' }]}>
            <Why icon="shield-checkmark" title="Escrow Protection" desc="Your money stays safe until you approve the work. Full refund if unsatisfied." />
            <Why icon="people" title="Verified Experts" desc="Every helper passes identity verification and credential checks before joining." />
            <Why icon="flash" title="5-Minute Matching" desc="Average time to first bid: under 5 minutes. Most tasks completed in 24 hours." />
            <Why icon="chatbubbles" title="Real-Time Chat" desc="Message your expert directly. Share files, clarify requirements, track progress." />
            <Why icon="card" title="Fair & Transparent" desc="Experts compete on price. No hidden fees, no markups. You choose the best offer." />
            <Why icon="ribbon" title="Quality Guaranteed" desc="Free unlimited revisions. Not satisfied? Get a full refund. Zero risk for students." />
          </View>
        </View>
      </View>

      {/* ═══ TESTIMONIALS ═══ */}
      <View style={[styles.section, { backgroundColor: C.bgSoft }]}>
        <View style={[styles.sectionInner, { maxWidth: MAX_W }]}>
          <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>TESTIMONIALS</Text></View>
          <Text style={[styles.sectionTitle, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>
            Hear from students like you
          </Text>

          <View style={[styles.testimGrid, wide && { flexDirection: 'row' }]}>
            <Testimonial
              name="Sarah K." role="CS Major, MIT" rating={5}
              text="I was drowning in my algorithms assignment. Got matched with a Stanford PhD in 3 minutes, and the solution was flawless. Absolute game-changer."
            />
            <Testimonial
              name="James M." role="MBA, Wharton" rating={5}
              text="The escrow system gives me total peace of mind. 15+ assignments completed without a single issue. The quality of helpers here is unmatched."
            />
            <Testimonial
              name="Aisha B." role="Pre-Med, Johns Hopkins" rating={5}
              text="Found a PhD biochemist who helped me ace organic chemistry. The expertise on this platform is leagues above any other service I've tried."
            />
          </View>
        </View>
      </View>

      {/* ═══ CTA ═══ */}
      <View style={styles.ctaOuter}>
        <LinearGradient colors={['#4F46E5', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGrad}>
          <View style={[styles.blob, { width: 500, height: 500, top: -200, right: -150, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 250 }]} />
          <View style={[styles.blob, { width: 300, height: 300, bottom: -100, left: -80, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 150 }]} />

          <View style={[styles.ctaInner, { maxWidth: MAX_W }]}>
            <Text style={[styles.ctaTitle, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>
              Ready to ace your next assignment?
            </Text>
            <Text style={styles.ctaSub}>
              Join 10,000+ students getting expert help. Your first task is on us.
            </Text>
            <View style={styles.ctaBtns}>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.ctaWhiteBtn}>
                <Text style={styles.ctaWhiteBtnText}>Get Started Free</Text>
                <Ionicons name="arrow-forward" size={18} color={C.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.ctaGhostBtn}>
                <Text style={styles.ctaGhostText}>Become an Expert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* ═══ FOOTER ═══ */}
      <View style={styles.footer}>
        <View style={[styles.footerInner, { maxWidth: MAX_W }]}>
          <View style={[styles.footerGrid, wide && { flexDirection: 'row' }]}>
            <View style={[styles.footerCol, wide && { flex: 2 }]}>
              <View style={styles.logoWrap}>
                <View style={styles.logoIcon}><Ionicons name="school" size={16} color="#fff" /></View>
                <Text style={[styles.logoText, { fontSize: 17 }, isWeb && { fontFamily: "'Bricolage Grotesque', sans-serif" }]}>MyHomeworkPal</Text>
              </View>
              <Text style={styles.footerDesc}>The trusted academic marketplace connecting students with verified experts worldwide.</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHead}>Platform</Text>
              <Text style={styles.footerLink}>How It Works</Text>
              <Text style={styles.footerLink}>Browse Tasks</Text>
              <Text style={styles.footerLink}>Find Experts</Text>
              <Text style={styles.footerLink}>Pricing</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHead}>Company</Text>
              <Text style={styles.footerLink}>About Us</Text>
              <Text style={styles.footerLink}>Blog</Text>
              <Text style={styles.footerLink}>Careers</Text>
              <Text style={styles.footerLink}>Contact</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHead}>Legal</Text>
              <Text style={styles.footerLink}>Terms of Service</Text>
              <Text style={styles.footerLink}>Privacy Policy</Text>
              <Text style={styles.footerLink}>Trust & Safety</Text>
            </View>
          </View>
          <View style={styles.footerBot}>
            <Text style={styles.footerCopy}>© 2026 MyHomeworkPal. All rights reserved.</Text>
            <View style={styles.footerSocials}>
              {['logo-twitter', 'logo-instagram', 'logo-linkedin', 'logo-tiktok'].map((ic) => (
                <TouchableOpacity key={ic} style={styles.socialBtn}>
                  <Ionicons name={ic as any} size={18} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ═══ SUB COMPONENTS ═══════════════════════════════════════════

const FloatCard = ({ icon, value, label, color, top, right }: any) => (
  <View style={[styles.floatCard, { top, right }, isWeb && { className: 'hover-lift' } as any]}>
    <View style={[styles.floatIcon, { backgroundColor: `${color}12` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.floatValue}>{value}</Text>
      <Text style={styles.floatLabel}>{label}</Text>
    </View>
  </View>
);

const Stat = ({ value, label, icon }: any) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={18} color={C.primary} style={{ marginRight: 6 }} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Step = ({ n, icon, title, desc, color }: any) => (
  <View style={[styles.stepCard, isWeb && { className: 'hover-lift' } as any]}>
    <View style={styles.stepTop}>
      <View style={[styles.stepIcon, { backgroundColor: `${color}10` }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <View style={[styles.stepNum, { backgroundColor: `${color}10` }]}>
        <Text style={[styles.stepNumText, { color }]}>{n}</Text>
      </View>
    </View>
    <Text style={styles.stepTitle}>{title}</Text>
    <Text style={styles.stepDesc}>{desc}</Text>
  </View>
);

const Cat = ({ icon, title, count, color }: any) => (
  <TouchableOpacity style={[styles.catCard, isWeb && { className: 'hover-lift' } as any]}>
    <View style={[styles.catIcon, { backgroundColor: `${color}10` }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text style={styles.catTitle}>{title}</Text>
    <Text style={styles.catCount}>{count}</Text>
  </TouchableOpacity>
);

const Why = ({ icon, title, desc }: any) => (
  <View style={styles.whyCard}>
    <View style={styles.whyIcon}>
      <Ionicons name={icon} size={22} color={C.primary} />
    </View>
    <Text style={styles.whyTitle}>{title}</Text>
    <Text style={styles.whyDesc}>{desc}</Text>
  </View>
);

const Testimonial = ({ name, role, text, rating }: any) => (
  <View style={[styles.testimCard, isWeb && { className: 'hover-lift' } as any]}>
    <View style={styles.testimStars}>
      {[1,2,3,4,5].map((s) => <Ionicons key={s} name="star" size={16} color={s <= rating ? C.gold : C.border} />)}
    </View>
    <Text style={styles.testimText}>"{text}"</Text>
    <View style={styles.testimAuthor}>
      <View style={styles.testimAvatar}>
        <Text style={styles.testimInit}>{name.split(' ').map((n:string)=>n[0]).join('')}</Text>
      </View>
      <View>
        <Text style={styles.testimName}>{name}</Text>
        <Text style={styles.testimRole}>{role}</Text>
      </View>
    </View>
  </View>
);

// ═══ STYLES ═══════════════════════════════════════════════════
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

  // Nav
  navOuter: {
    position: isWeb ? ('sticky' as any) : 'relative',
    top: 0, zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.92)',
    backdropFilter: isWeb ? ('blur(16px) saturate(180%)' as any) : undefined,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  navInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, alignSelf: 'center', width: '100%' },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 19, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  navLinks: { flexDirection: 'row', gap: 28 },
  navLink: { fontSize: 14, color: C.textSoft, fontWeight: '500' },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  navLoginText: { fontSize: 14, color: C.textSoft, fontWeight: '600' },
  navCta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 50 },
  navCtaText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Hero
  heroOuter: { backgroundColor: C.bg, paddingTop: 60, paddingBottom: 60, paddingHorizontal: 24 },
  heroInner: { alignSelf: 'center', width: '100%', gap: 40 },
  heroLeft: { zIndex: 2 },
  trustPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: C.accentSoft, borderWidth: 1, borderColor: '#D1FAE5',
    borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 24,
  },
  trustDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginRight: 8 },
  trustText: { fontSize: 13, color: '#065F46', fontWeight: '600' },
  heroTitle: { fontSize: isWeb ? 52 : 34, fontWeight: '800', color: C.text, lineHeight: isWeb ? 62 : 42, letterSpacing: -1.5, marginBottom: 20 },
  heroHighlight: { color: C.primary },
  heroSub: { fontSize: isWeb ? 18 : 16, color: C.textSoft, lineHeight: isWeb ? 28 : 24, marginBottom: 32, maxWidth: 500 },

  // Search
  searchBox: {
    backgroundColor: C.bg, borderRadius: 16, borderWidth: 1.5, borderColor: C.border,
    padding: 6, flexDirection: wide ? 'row' : 'column', gap: 6, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20,
  },
  searchRow: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, color: C.text, fontSize: 15, marginLeft: 10, ...(isWeb ? { outlineStyle: 'none' } as any : {}) },
  searchCta: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center' },
  searchCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  tagLabel: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  tag: { backgroundColor: C.bgMuted, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 12, color: C.textSoft, fontWeight: '500' },

  // Hero right
  heroRight: { flex: 1, position: 'relative', minHeight: 420 },
  blob: { position: 'absolute' },
  floatCard: {
    position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24,
  },
  floatIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  floatValue: { fontSize: 18, fontWeight: '800', color: C.text },
  floatLabel: { fontSize: 12, color: C.textMuted },

  // Proof bar
  proofBar: { backgroundColor: C.bgSoft, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, paddingVertical: 20 },
  proofInner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', width: '100%', paddingHorizontal: 24, flexWrap: 'wrap', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: C.text, marginRight: 4 },
  statLabel: { fontSize: 14, color: C.textMuted },
  proofDiv: { width: 1, height: 20, backgroundColor: C.border, marginHorizontal: 16 },

  // Sections
  section: { paddingVertical: 72, paddingHorizontal: 24 },
  sectionInner: { alignSelf: 'center', width: '100%' },
  sectionBadge: { backgroundColor: C.primarySoft, alignSelf: 'flex-start', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16 },
  sectionBadgeText: { fontSize: 11, fontWeight: '800', color: C.primary, letterSpacing: 2 },
  sectionTitle: { fontSize: isWeb ? 36 : 26, fontWeight: '800', color: C.text, letterSpacing: -0.8, marginBottom: 10, lineHeight: isWeb ? 44 : 34 },
  sectionSub: { fontSize: 16, color: C.textMuted, marginBottom: 40, maxWidth: 480 },

  // Steps
  stepsGrid: { gap: 16 },
  stepCard: {
    flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 20, padding: 28, minWidth: isWeb ? 230 : undefined,
  },
  stepTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  stepIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 13, fontWeight: '800' },
  stepTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 8 },
  stepDesc: { fontSize: 14, color: C.textMuted, lineHeight: 22 },

  // Categories
  catGrid: { gap: 12 },
  catCard: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 20,
    width: wide ? '23.5%' : '48%', minWidth: isWeb ? 200 : undefined,
  },
  catIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  catTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  catCount: { fontSize: 13, color: C.textMuted },

  // Why
  whyGrid: { gap: 16 },
  whyCard: {
    flex: 1, backgroundColor: C.bgSoft, borderRadius: 18, padding: 24, minWidth: isWeb ? 320 : undefined,
  },
  whyIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: C.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  whyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 6 },
  whyDesc: { fontSize: 14, color: C.textMuted, lineHeight: 22 },

  // Testimonials
  testimGrid: { gap: 16 },
  testimCard: {
    flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 20, padding: 28, minWidth: isWeb ? 280 : undefined,
  },
  testimStars: { flexDirection: 'row', gap: 2, marginBottom: 16 },
  testimText: { fontSize: 15, color: C.textSoft, lineHeight: 24, marginBottom: 20 },
  testimAuthor: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  testimAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  testimInit: { color: '#fff', fontSize: 14, fontWeight: '700' },
  testimName: { fontSize: 14, fontWeight: '700', color: C.text },
  testimRole: { fontSize: 12, color: C.textMuted },

  // CTA
  ctaOuter: { paddingHorizontal: 24, paddingVertical: 40 },
  ctaGrad: { borderRadius: 24, overflow: 'hidden', position: 'relative' },
  ctaInner: { alignSelf: 'center', width: '100%', paddingVertical: 60, paddingHorizontal: 32, alignItems: 'center', zIndex: 2 },
  ctaTitle: { fontSize: isWeb ? 36 : 26, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.8, marginBottom: 12 },
  ctaSub: { fontSize: 17, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 32, maxWidth: 460 },
  ctaBtns: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  ctaWhiteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50,
  },
  ctaWhiteBtnText: { fontSize: 15, fontWeight: '700', color: C.primary },
  ctaGhostBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  ctaGhostText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Footer
  footer: { backgroundColor: C.bgSoft, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24 },
  footerInner: { alignSelf: 'center', width: '100%' },
  footerGrid: { gap: 36, marginBottom: 40 },
  footerCol: { flex: 1, minWidth: 150 },
  footerDesc: { fontSize: 14, color: C.textMuted, lineHeight: 22, maxWidth: 280, marginTop: 12 },
  footerHead: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14, letterSpacing: 0.5 },
  footerLink: { fontSize: 14, color: C.textMuted, marginBottom: 10 },
  footerBot: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 20, flexWrap: 'wrap', gap: 12,
  },
  footerCopy: { fontSize: 13, color: C.textMuted },
  footerSocials: { flexDirection: 'row', gap: 8 },
  socialBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgMuted, alignItems: 'center', justifyContent: 'center' },
});
