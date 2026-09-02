import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  SafeAreaView,
  Animated,
} from 'react-native'
import {
  Feather,
  Edit3,
  Camera,
  Mic,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  Compass,
} from 'lucide-react-native'
import type { ThemeColors } from '../theme/colors'
import { ThenvueLogo } from '../components/ThenvueLogo'

const { width } = Dimensions.get('window')

export type OnboardingScreenProps = {
  colors: ThemeColors
  onComplete: (startCapturing: boolean) => void
}

type SlideData = {
  id: string
  eyebrow: string
  title: string
  description: string
  renderVisual: (colors: ThemeColors) => React.ReactNode
}

export function OnboardingScreen({ colors, onComplete }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current

  const slides: SlideData[] = [
    {
      id: 'welcome',
      eyebrow: 'PRIVATE INTELLIGENCE',
      title: 'Welcome to Thenvue',
      description: 'A private place to capture the moments of your life.',
      renderVisual: (c) => (
        <View style={[styles.visualCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={{ marginBottom: 16 }}>
            <ThenvueLogo size={64} />
          </View>
          <View style={[styles.mockDateBadge, { backgroundColor: c.pill }]}>
            <Clock size={11} color={c.accent} />
            <Text style={[styles.mockDateText, { color: c.textMuted }]}>Today & Every Day</Text>
          </View>
          <Text style={[styles.mockExcerpt, { color: c.text }]}>
            "Every day is filled with moments worth remembering."
          </Text>
        </View>
      ),
    },
    {
      id: 'capture',
      eyebrow: 'MULTI-MODAL CAPTURE',
      title: 'Capture anything',
      description: 'Write a thought, add a photo, or record your voice.',
      renderVisual: (c) => (
        <View style={[styles.visualCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.capturePillsContainer}>
            <View style={[styles.capturePillRow, { backgroundColor: c.cardSecondary, borderColor: c.border }]}>
              <View style={[styles.pillIcon, { backgroundColor: c.pill }]}>
                <Edit3 size={15} color={c.accent} />
              </View>
              <View style={styles.pillContent}>
                <Text style={[styles.pillTitle, { color: c.text }]}>Write a thought</Text>
                <Text style={[styles.pillSub, { color: c.textMuted }]}>Reflections, stories, quick notes</Text>
              </View>
            </View>

            <View style={[styles.capturePillRow, { backgroundColor: c.cardSecondary, borderColor: c.border }]}>
              <View style={[styles.pillIcon, { backgroundColor: c.pill }]}>
                <Camera size={15} color={c.accent} />
              </View>
              <View style={styles.pillContent}>
                <Text style={[styles.pillTitle, { color: c.text }]}>Add photos</Text>
                <Text style={[styles.pillSub, { color: c.textMuted }]}>Capture or attach moments from today</Text>
              </View>
            </View>

            <View style={[styles.capturePillRow, { backgroundColor: c.cardSecondary, borderColor: c.border }]}>
              <View style={[styles.pillIcon, { backgroundColor: c.pill }]}>
                <Mic size={15} color={c.accent} />
              </View>
              <View style={styles.pillContent}>
                <Text style={[styles.pillTitle, { color: c.text }]}>Record your voice</Text>
                <Text style={[styles.pillSub, { color: c.textMuted }]}>AI transcribes your words automatically</Text>
              </View>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: 'ask',
      eyebrow: 'PERSONAL AI SEARCH',
      title: 'Ask your life',
      description: 'Ask questions about your past and find moments you thought you\'d forgotten.',
      renderVisual: (c) => (
        <View style={[styles.visualCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.queryBox, { backgroundColor: c.cardSecondary, borderColor: c.border }]}>
            <Sparkles size={14} color={c.accent} />
            <Text style={[styles.queryText, { color: c.text }]}>
              "What was that cafe we visited in Kyoto?"
            </Text>
          </View>
          <View style={[styles.answerBox, { backgroundColor: c.pill }]}>
            <Text style={[styles.answerLabel, { color: c.accent }]}>FOUND IN YOUR MEMORIES</Text>
            <Text style={[styles.answerText, { color: c.text }]}>
              "You had matcha latte at %Arabica near Arashiyama Bamboo Grove with Sarah on April 12."
            </Text>
          </View>
        </View>
      ),
    },
    {
      id: 'rediscover',
      eyebrow: 'MEANINGFUL CONNECTIONS',
      title: 'Rediscover your story',
      description: 'Memory brings moments back when it\'s time to remember them.',
      renderVisual: (c) => (
        <View style={[styles.visualCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.tagsMockRow}>
            <View style={[styles.mockTag, { backgroundColor: c.pill, borderColor: c.border }]}>
              <MapPin size={12} color={c.accent} />
              <Text style={[styles.mockTagText, { color: c.text }]}>Places</Text>
            </View>
            <View style={[styles.mockTag, { backgroundColor: c.pill, borderColor: c.border }]}>
              <Users size={12} color={c.accent} />
              <Text style={[styles.mockTagText, { color: c.text }]}>People</Text>
            </View>
            <View style={[styles.mockTag, { backgroundColor: c.pill, borderColor: c.border }]}>
              <Compass size={12} color={c.accent} />
              <Text style={[styles.mockTagText, { color: c.text }]}>Journeys</Text>
            </View>
          </View>
          <View style={[styles.connectedPreview, { backgroundColor: c.cardSecondary, borderColor: c.border }]}>
            <Text style={[styles.connectedReason, { color: c.accent }]}>TIME PATTERN</Text>
            <Text style={[styles.connectedTitle, { color: c.text }]}>
              "Happened on this same day 2 years ago"
            </Text>
          </View>
        </View>
      ),
    },
    {
      id: 'final',
      eyebrow: 'BEGIN YOUR JOURNEY',
      title: 'Your story starts now.',
      description: 'Capture your first moment and start building your memory.',
      renderVisual: (c) => (
        <View style={[styles.visualCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.firstCapturePrompt, { backgroundColor: c.cardSecondary, borderColor: c.border }]}>
            <Edit3 size={18} color={c.accent} />
            <Text style={[styles.firstCaptureText, { color: c.textMuted }]}>
              Your life, remembered for you
            </Text>

          </View>
          <View style={[styles.benefitRow]}>
            <Sparkles size={14} color={c.accent} />
            <Text style={[styles.benefitText, { color: c.textMuted }]}>
              100% private, securely encrypted, and uniquely yours.
            </Text>
          </View>
        </View>
      ),
    },
  ]

  const animateToSlide = (nextIndex: number) => {
    const isForward = nextIndex > currentIndex
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: isForward ? -20 : 20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex(nextIndex)
      slideAnim.setValue(isForward ? 20 : -20)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    })
  }

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      animateToSlide(currentIndex + 1)
    } else {
      // Completed via final slide button
      onComplete(true)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      animateToSlide(currentIndex - 1)
    }
  }

  const handleSkip = () => {
    onComplete(false)
  }

  const currentSlide = slides[currentIndex]
  const isFinalSlide = currentIndex === slides.length - 1

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar with Back and Skip */}
      <View style={styles.topBar}>
        {currentIndex > 0 ? (
          <TouchableOpacity
            style={styles.navBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.navBtnPlaceholder} />
        )}

        {/* Brand Logo in Center */}
        <View style={styles.brandCenter}>
          <View style={[styles.brandMiniCircle, { borderColor: colors.accent }]}>
            <Feather size={12} color={colors.accent} />
          </View>
          <Text style={[styles.brandMiniText, { color: colors.text }]}>Memory</Text>
        </View>

        {!isFinalSlide ? (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleSkip}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navBtnPlaceholder} />
        )}
      </View>

      {/* Main Slide Content */}
      <Animated.View
        style={[
          styles.slideContent,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header Text */}
        <View style={styles.headingSection}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>{currentSlide.eyebrow}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{currentSlide.title}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {currentSlide.description}
          </Text>
        </View>

        {/* Visual Illustration Area */}
        <View style={styles.visualContainer}>
          {currentSlide.renderVisual(colors)}
        </View>
      </Animated.View>

      {/* Bottom Footer with Progress Indicator and Actions */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {/* Progress Step Indicators */}
        <View style={styles.indicatorsRow}>
          {slides.map((_, index) => {
            const isActive = index === currentIndex
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? colors.accent : colors.border,
                    width: isActive ? 22 : 6,
                  },
                ]}
              />
            )
          })}
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.accent },
          ]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            {isFinalSlide ? 'Start capturing' : 'Next'}
          </Text>
          <ArrowRight size={16} color="#211d1a" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 10,
    height: Platform.OS === 'android' ? 80 : 54,
  },
  navBtn: {
    padding: 6,
  },
  navBtnPlaceholder: {
    width: 32,
  },
  brandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandMiniCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMiniText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.2,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  headingSection: {
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '400',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  visualCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
    alignItems: 'center',
  },
  brandEmblem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mockDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  mockDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mockExcerpt: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  capturePillsContainer: {
    width: '100%',
    gap: 10,
  },
  capturePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  pillIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContent: {
    flex: 1,
  },
  pillTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillSub: {
    fontSize: 11,
    marginTop: 2,
  },
  queryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    marginBottom: 12,
  },
  queryText: {
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  answerBox: {
    padding: 14,
    borderRadius: 12,
    width: '100%',
  },
  answerLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  answerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  tagsMockRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  mockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mockTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  connectedPreview: {
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  connectedReason: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  connectedTitle: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  firstCapturePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    marginBottom: 14,
  },
  firstCaptureText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    flex: 1,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  benefitText: {
    fontSize: 11,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  indicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  primaryButtonText: {
    color: '#211d1a',
    fontSize: 14,
    fontWeight: '600',
  },
})
