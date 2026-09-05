import React, { useState } from 'react'
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
import { Send, ArrowRight } from 'lucide-react-native'
import { CustomBrainIcon } from '../components/CustomBrainIcon'
import type { Memory } from '../types/memory'
import type { ThemeColors } from '../theme/colors'
import { askMyLife } from '../lib/ai'


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
  const [result, setResult] = useState<{
    answer: string
    sourceMemories?: any[]
  } | null>(null)

  const suggestedQuestions = [
    'What did I do last week?',
    'Who have I spent the most time with?',
    'What were my favorite places visited?',
    'What was I doing around this time last year?',
  ]

  const handleAsk = async (textToAsk: string) => {
    const q = textToAsk.trim()
    if (!q || loading) return

    setLoading(true)
    setResult(null)
    try {
      const res = await askMyLife(q, memories || [])
      setResult({
        answer: res.answer,
        sourceMemories: res.sourceMemories || [],
      })
    } catch (err) {
      console.error('Ask error:', err)
      setResult({
        answer: "I couldn't retrieve memories for that question. Please try asking again.",
        sourceMemories: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const sources = result?.sourceMemories || []

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Eyebrow & Title */}
      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>A QUIET MEMORY ASSISTANT</Text>
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
          placeholder="What do you want to remember?"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleAsk(query)}
          returnKeyType="search"
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

      {/* Try Asking Section */}
      {!result && (
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
                onPress={() => {
                  setQuery(q)
                  handleAsk(q)
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestedText, { color: colors.text }]}>{q}</Text>
                <ArrowRight size={12} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Answer Block */}
      {result && (
        <View style={[styles.answerSection, { borderTopColor: colors.border }]}>
          <View style={styles.answerHeader}>
            <CustomBrainIcon size={14} color={colors.accent} />
            <Text style={[styles.answerLabel, { color: colors.accent }]}>ANSWER</Text>
          </View>

          <Text style={[styles.answerText, { color: colors.text }]}>{result.answer}</Text>

          {sources.length > 0 && (
            <View style={styles.citationsContainer}>
              <Text style={[styles.citationsTitle, { color: colors.textMuted }]}>
                SUPPORTING MEMORIES
              </Text>
              {sources.map((m: any) => {
                const fullMem = (memories || []).find((x) => x.id === m.id) || m
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.citationRow, { borderBottomColor: colors.border }]}
                    onPress={() => onSelectMemory(fullMem)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.citationDate, { color: colors.textMuted }]}>{m.date}</Text>
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
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
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
  answerSection: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  answerLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  answerText: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  citationsContainer: {
    marginTop: 24,
  },
  citationsTitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
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
})
