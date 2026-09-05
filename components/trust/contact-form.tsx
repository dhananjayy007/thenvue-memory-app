'use client'

import { useState } from 'react'
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('General question')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic Client-Side Validation
    if (!name.trim()) {
      setErrorMessage('Please enter your name.')
      setStatus('error')
      return
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.')
      setStatus('error')
      return
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage('Please write a message with at least 10 characters.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const subject = encodeURIComponent(`[Thenvue] ${topic} - ${name}`)
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`)
      const mailtoUrl = `mailto:thenvue@gmail.com?subject=${subject}&body=${body}`

      // Trigger mailto client
      window.location.href = mailtoUrl
      setStatus('success')
    } catch {
      setErrorMessage('Please email us directly at thenvue@gmail.com.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    const subject = encodeURIComponent(`[Thenvue] ${topic} - ${name}`)
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`)
    const mailtoUrl = `mailto:thenvue@gmail.com?subject=${subject}&body=${body}`

    return (
      <div className="contact-success-card">
        <div className="success-icon-wrap">
          <CheckCircle2 size={32} />
        </div>
        <h3>Ready to send.</h3>
        <p>
          Your email app should open to deliver your message to <strong>thenvue@gmail.com</strong>.
        </p>
        <p style={{ fontSize: 13, color: '#9e9e98', marginTop: 8 }}>
          If your email app didn&apos;t open automatically, you can <a href={mailtoUrl} className="trust-inline-link">click here to open email</a> or write to us directly at <strong>thenvue@gmail.com</strong>.
        </p>
        <button
          type="button"
          className="contact-reset-btn"
          style={{ marginTop: 16 }}
          onClick={() => {
            setName('')
            setEmail('')
            setMessage('')
            setStatus('idle')
          }}
        >
          Send another note
        </button>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {status === 'error' && (
        <div className="contact-error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="contact-form-grid">
        <div className="contact-field">
          <label htmlFor="contact-name">Your Name</label>
          <input
            id="contact-name"
            type="text"
            required
            placeholder="Maya Lin"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === 'loading'}
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-email">Email Address</label>
          <input
            id="contact-email"
            type="email"
            required
            placeholder="maya@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
          />
        </div>
      </div>

      <div className="contact-field">
        <label htmlFor="contact-topic">What is this regarding?</label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={status === 'loading'}
        >
          <option value="General question">General question</option>
          <option value="Technical support">Technical support</option>
          <option value="Bug report">Bug report</option>
          <option value="Feedback & ideas">Feedback & ideas</option>
          <option value="Privacy & data">Privacy & data request</option>
          <option value="Account & deletion">Account & deletion</option>
          <option value="Partnership">Partnership</option>
          <option value="Press / media">Press / media</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="contact-field">
        <label htmlFor="contact-message">Your Message</label>
        <textarea
          id="contact-message"
          rows={5}
          required
          placeholder="Tell us what's on your mind..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={status === 'loading'}
        />
      </div>

      <button
        type="submit"
        className="contact-submit-btn"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <>
            <Loader2 size={16} className="contact-spinner" />
            <span>Sending message...</span>
          </>
        ) : (
          <>
            <span>Send message</span>
            <Send size={15} />
          </>
        )}
      </button>
    </form>
  )
}
