import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Eye, EyeOff } from 'lucide-react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '../lib/supabase'
import type { ThemeColors } from '../theme/colors'
import { ThenvueLogo } from '../components/ThenvueLogo'

WebBrowser.maybeCompleteAuthSession()

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </Svg>
  )
}

export function AuthScreen({
  colors,
}: {
  colors: ThemeColors
}) {
  const [isLogin, setIsLogin] = useState(true)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleAuthUrl = async (url: string) => {
    try {
      WebBrowser.dismissAuthSession()
      const hashPart = url.includes('#') ? url.split('#')[1] : ''
      const hashParams = new URLSearchParams(hashPart)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      const queryPart = url.includes('?') ? url.split('?')[1].split('#')[0] : ''
      const queryParams = new URLSearchParams(queryPart)
      const code = queryParams.get('code') || hashParams.get('code')

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        return true
      } else if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeErr) throw exchangeErr
        return true
      }
    } catch (err: any) {
      console.warn('Auth URL handler error:', err)
      setErrorMsg(err?.message || 'Authentication failed from redirect link.')
    } finally {
      setGoogleLoading(false)
    }
    return false
  }

  useEffect(() => {
    AsyncStorage.getItem('@memory_has_opened_login')
      .then((val) => {
        if (!val) {
          setIsFirstVisit(true)
          AsyncStorage.setItem('@memory_has_opened_login', 'true').catch(() => {})
        } else {
          setIsFirstVisit(false)
        }
      })
      .catch(() => {})

    // Listen for deep link redirects
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url && (url.includes('access_token') || url.includes('code='))) {
        handleAuthUrl(url)
      }
    })

    Linking.getInitialURL().then((url) => {
      if (url && (url.includes('access_token') || url.includes('code='))) {
        handleAuthUrl(url)
      }
    })

    return () => {
      sub.remove()
    }
  }, [])

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setErrorMsg(null)

    // Safety watchdog: reset loading after 25s if user cancels or leaves browser open
    const timer = setTimeout(() => {
      setGoogleLoading(false)
    }, 25000)

    try {
      // Creates exp://... in Expo Go or thenvue://... in standalone build
      const redirectUrl = Linking.createURL('auth/callback', {
        scheme: 'thenvue',
      })

      console.log('👉 [Auth] Exact Redirect URL:', redirectUrl)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      })

      if (error) throw error
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase.')

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

      if (result.type === 'success' && result.url) {
        await handleAuthUrl(result.url)
      } else {
        setGoogleLoading(false)
      }
    } catch (err: any) {
      console.warn('Google Sign-In error:', err)
      setErrorMsg(err.message || 'Google Sign-In failed.')
      setGoogleLoading(false)
    } finally {
      clearTimeout(timer)
    }
  }


  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        })
        if (error) setErrorMsg(error.message)
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              display_name: displayName.trim() || email.split('@')[0],
            },
          },
        })
        if (error) setErrorMsg(error.message)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={styles.brandRow}>
          <ThenvueLogo size={48} />
          <Text style={[styles.brandTitle, { color: colors.text }]}>Thenvue</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isLogin ? (isFirstVisit ? 'Welcome' : 'Welcome back') : 'Create your account'}
          </Text>
          <Text style={[styles.subhead, { color: colors.textMuted }]}>
            {isLogin
              ? isFirstVisit
                ? 'Sign in or create your account to start your private memory.'
                : 'Sign in to access your private memories and personal intelligence.'
              : 'Start your private personal intelligence system.'}
          </Text>


          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[styles.googleBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || loading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <View style={styles.googleBtnContent}>
                <GoogleIcon size={18} />
                <Text style={[styles.googleBtnText, { color: colors.text }]}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {!isLogin ? (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted }]}>YOUR NAME</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.cardSecondary, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="What should we call you?"
                placeholderTextColor={colors.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.cardSecondary, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>PASSWORD</Text>
            <View
              style={[
                styles.passwordContainer,
                { backgroundColor: colors.cardSecondary, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.textMuted} />
                ) : (
                  <Eye size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {errorMsg ? (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.accent }]}
            onPress={handleAuth}
            disabled={loading || googleLoading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#211d1a" />
            ) : (
              <Text style={styles.submitText}>{isLogin ? 'Sign In with Email' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => setIsLogin(!isLogin)}
            activeOpacity={0.7}
          >
            <Text style={[styles.switchText, { color: colors.textMuted }]}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={{ color: colors.accent, fontWeight: '600' }}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    alignSelf: 'center',
  },
  brandCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.4,
  },
  card: {
    padding: 20,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 24,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  subhead: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  googleBtn: {
    height: 46,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  eyeBtn: {
    padding: 6,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
  },
  submitBtn: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitText: {
    color: '#211d1a',
    fontSize: 14,
    fontWeight: '600',
  },
  switchBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 12,
  },
})
