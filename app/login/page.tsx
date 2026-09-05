import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: 'Sign In — Thenvue',
  description: 'Sign in to your private Thenvue memory space.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
  return <AuthForm />
}
