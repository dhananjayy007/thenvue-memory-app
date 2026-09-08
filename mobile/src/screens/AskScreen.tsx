import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { Send, ArrowRight, RotateCcw, MessageSquare } from 'lucide-react-native'
import { CustomBrainIcon } from '../components/CustomBrainIcon'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { askMyLife, type ConversationTurn } from '../lib/ai'

export type ChatTurn = {
  id: string
  question: string
  answer: string
  sources: Memory[]
}

export function AskScreen({
  memories = [],
  colors,
  onSelectMemory,
}: {
  memories?: Memory[]
  colors: ThemeColors
  onSelectMemory: (m: Memory) => void
}) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)

  const suggestedQuestions = [
    'What did I do last week?',
    'Who have I spent the most time with?',
    'What were my favorite places visited?',
    'What was I doing around this time last year?',
  ]

  const handleAsk = async (textToAsk: string) => {
    const q = textToAsk.trim()
    if (!q || loading) return

    setQuery('')
    setActiveQuestion(q)
    setLoading(true)

    // Build history for multi-turn grounding
    const history: ConversationTurn[] = turns.map((t) => ({
      question: t.question,
      answer: t.answer,
    }))

    try {
      const res = await askMyLife(q, memories || [], history)
      const newTurn: ChatTurn = {
        id: `turn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        question: q,
        answer: res.answer,
        sources: res.sources || (res as any).sourceMemories || [],
      }
      setTurns((prev) => [...prev, newTurn])
    } catch (err) {
      console.error('Ask error:', err)
      const errorTurn: ChatTurn = {
        id: `turn_err_${Date.now()}`,
        question: q,
        answer: "I couldn't retrieve memories for that question right now. Please try asking again.",
        sources: [],
      }
      setTurns((prev) => [...prev, errorTurn])
    } finally {
      setLoading(false)
      setActiveQuestion(null)
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  const handleReset = () => {
    setTurns([])
    setQuery('')
    setActiveQuestion(null)
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Eyebrow & Title */}
      <View style={styles.heading}>
        <View style={styles.headingTopRow}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>A QUIET MEMORY ASSISTANT</Text>
          {turns.length > 0 && (
            <TouchableOpacity
              onPress={handleReset}
              style={[styles.resetBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <RotateCcw size={11} color={colors.textMuted} />
              <Text style={[styles.resetBtnText, { color: colors.textMuted }]}>New conversation</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Ask your life</Text>
        <Text style={[styles.subhead, { color: colors.textMuted }]}>
          Search your life through questions, grounded in your saved memories.
        </Text>
      </View>

      {/* Ask Input Box */}
      <View style={[styles.askBox, { borderColor: colors.accent, backgroundColor: colors.card }]}>
        <CustomBrainIcon size={18} color={colors.accent} />
        <TextInput
          style={[styles.askInput, { color: colors.text }]}
          placeholder={turns.length > 0 ? 'Ask a follow-up question...' : 'What do you want to remember?'}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleAsk(query)}
          returnKeyType="search"
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.accent }]}
          onPress={() => handleAsk(query)}
          disabled={loading || !query.trim()}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#211d1a" />
          ) : (
            <Send size={14} color="#211d1a" />
          )}
        </TouchableOpacity>
      </View>

      {/* Try Asking Section (when no conversation yet) */}
      {turns.length === 0 && !loading && (
        <View style={styles.trySection}>
          <Text style={[styles.tryLabel, { color: colors.textMuted }]}>TRY ASKING</Text>
          <View style={[styles.tryUnderline, { backgroundColor: colors.border }]} />

          <View style={styles.suggestedList}>
            {suggestedQuestions.map((q) => (
              <TouchableOpacity
                key={q}
                style={[
                  styles.suggestedBtn,
                  { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                ]}
                onPress={() => handleAsk(q)}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestedText, { color: colors.text }]}>{q}</Text>
                <ArrowRight size={12} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Render Conversation Turns */}
      {turns.length > 0 && (
        <View style={styles.conversationContainer}>
          {turns.map((turn, index) => {
            const isLatest = index === turns.length - 1
            const turnSources = turn.sources || []

            return (
              <View
                key={turn.id}
                style={[
                  styles.turnCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isLatest ? colors.accent : colors.border,
                  },
                ]}
              >
                {/* Turn Question Header */}
                <View style={styles.turnQuestionRow}>
                  <MessageSquare size={13} color={colors.accent} style={{ marginTop: 2 }} />
                  <Text style={[styles.turnQuestionText, { color: colors.text }]}>
                    &ldquo;{turn.question}&rdquo;
                  </Text>
                </View>

                {/* Turn AI Answer */}
                <View style={[styles.turnAnswerBox, { borderTopColor: colors.border }]}>
                  <View style={styles.answerHeader}>
                    <CustomBrainIcon size={13} color={colors.accent} />
                    <Text style={[styles.answerLabel, { color: colors.accent }]}>
                      {isLatest ? 'LATEST ANSWER' : `RESPONSE ${index + 1}`}
                    </Text>
                  </View>

                  <Text style={[styles.answerText, { color: colors.text }]}>{turn.answer}</Text>

                  {/* Supporting Memory Citations */}
                  {turnSources.length > 0 && (
                    <View style={styles.citationsContainer}>
                      <Text style={[styles.citationsTitle, { color: colors.textMuted }]}>
                        SUPPORTING MEMORIES ({turnSources.length})
                      </Text>
                      {turnSources.map((m: any) => {
                        const fullMem = (memories || []).find((x) => x.id === m.id) || m
                        return (
                          <TouchableOpacity
                            key={m.id}
                            style={[styles.citationRow, { borderBottomColor: colors.border }]}
                            onPress={() => onSelectMemory(fullMem)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.citationDate, { color: colors.textMuted }]}>
                              {m.date}
                            </Text>
                            <Text style={[styles.citationTitle, { color: colors.text }]} numberOfLines={1}>
                              {m.text || m.title}
                            </Text>
                            <ArrowRight size={12} color={colors.accent} />
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* Active Question Loading State */}
      {loading && activeQuestion && (
        <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.turnQuestionRow}>
            <MessageSquare size={13} color={colors.accent} style={{ marginTop: 2 }} />
            <Text style={[styles.turnQuestionText, { color: colors.text }]}>
              &ldquo;{activeQuestion}&rdquo;
            </Text>
          </View>
          <View style={styles.loadingIndicatorRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Reflecting on your memories...
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 130,
  },
  heading: {
    marginBottom: 20,
  },
  headingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  resetBtnText: {
    fontSize: 10,
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -1,
  },
  subhead: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  askBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  askInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    padding: 0,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trySection: {
    marginTop: 28,
  },
  tryLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  tryUnderline: {
    width: 60,
    height: 2,
    marginTop: 6,
    marginBottom: 16,
  },
  suggestedList: {
    gap: 8,
  },
  suggestedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestedText: {
    fontSize: 12,
    flex: 1,
  },
  conversationContainer: {
    marginTop: 24,
    gap: 20,
  },
  turnCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  turnQuestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  turnQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 20,
  },
  turnAnswerBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  answerLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  answerText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  citationsContainer: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  citationsTitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  citationDate: {
    width: 76,
    fontSize: 10,
  },
  citationTitle: {
    flex: 1,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  loadingCard: {
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  loadingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  loadingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
})

