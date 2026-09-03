'use client'

import { useState } from 'react'
import {
  Feather,
  PenLine,
  Camera,
  Mic,
  
  ArrowRight,
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  Compass,
} from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'
import { ThenvueLogo } from '@/components/icons/thenvue-logo'

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: (startCapturing: boolean) => void
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!isOpen) return null

  const slides = [
    {
      id: 'welcome',
      eyebrow: 'PRIVATE INTELLIGENCE',
      title: 'Welcome to Thenvue',
      description: 'A private place to capture the moments of your life.',
      renderVisual: () => (
        <div className="onboarding-visual-card">
          <div className="onboarding-emblem">
            <Feather size={32} />
          </div>
          <div className="onboarding-date-badge">
            <Clock size={12} />
            <span>Today & Every Day</span>
          </div>
          <p className="onboarding-quote">
            &ldquo;Every day is filled with moments worth remembering.&rdquo;
          </p>
        </div>
      ),
    },
    {
      id: 'capture',
      eyebrow: 'MULTI-MODAL CAPTURE',
      title: 'Capture anything',
      description: 'Write a thought, add a photo, or record your voice.',
      renderVisual: () => (
        <div className="onboarding-visual-card">
          <div className="onboarding-pills-list">
            <div className="onboarding-pill-item">
              <div className="onboarding-pill-icon">
                <PenLine size={16} />
              </div>
              <div className="onboarding-pill-text">
                <strong>Write a thought</strong>
                <small>Reflections, stories, quick notes</small>
              </div>
            </div>

            <div className="onboarding-pill-item">
              <div className="onboarding-pill-icon">
                <Camera size={16} />
              </div>
              <div className="onboarding-pill-text">
                <strong>Add photos</strong>
                <small>Capture or attach moments from today</small>
              </div>
            </div>

            <div className="onboarding-pill-item">
              <div className="onboarding-pill-icon">
                <Mic size={16} />
              </div>
              <div className="onboarding-pill-text">
                <strong>Record your voice</strong>
                <small>AI transcribes your words automatically</small>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ask',
      eyebrow: 'PERSONAL AI SEARCH',
      title: 'Ask your life',
      description: 'Ask questions about your past and find moments you thought you\'d forgotten.',
      renderVisual: () => (
        <div className="onboarding-visual-card">
          <div className="onboarding-query-box">
            <CustomBrainIcon size={16} />
            <span>&ldquo;What was that cafe we visited in Kyoto?&rdquo;</span>
          </div>
          <div className="onboarding-answer-box">
            <span className="onboarding-answer-label">FOUND IN YOUR MEMORIES</span>
            <p>
              &ldquo;You had matcha latte at %Arabica near Arashiyama Bamboo Grove with Sarah on April 12.&rdquo;
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'rediscover',
      eyebrow: 'MEANINGFUL CONNECTIONS',
      title: 'Rediscover your story',
      description: 'Import past photos and let Thenvue reconstruct your timeline.',
      renderVisual: () => (
        <div className="onboarding-visual-card">
          <div className="onboarding-tags-row">
            <div className="onboarding-tag">
              <MapPin size={13} />
              <span>Places</span>
            </div>
            <div className="onboarding-tag">
              <Users size={13} />
              <span>People</span>
            </div>
            <div className="onboarding-tag">
              <Compass size={13} />
              <span>Journeys</span>
            </div>
          </div>
          <div className="onboarding-connected-card">
            <span className="onboarding-answer-label">TIME PATTERN</span>
            <strong>&ldquo;Happened on this same day 2 years ago&rdquo;</strong>
          </div>
        </div>
      ),
    },
    {
      id: 'perspectives',
      eyebrow: 'CO-CREATION & PERSPECTIVES',
      title: 'One moment, multiple views',
      description: 'Invite friends who experienced the moment with you to add their photos, voice notes, and perspectives.',
      renderVisual: () => (
        <div className="onboarding-visual-card">
          <div className="onboarding-tags-row">
            <div className="onboarding-tag">
              <Users size={13} />
              <span>Co-create</span>
            </div>
            <div className="onboarding-tag">
              <Mic size={13} />
              <span>Voice notes</span>
            </div>
            <div className="onboarding-tag">
              <Camera size={13} />
              <span>Photos</span>
            </div>
          </div>
          <div className="onboarding-connected-card">
            <span className="onboarding-answer-label">COLLABORATIVE MEMORY</span>
            <strong>&ldquo;3 friends added their perspectives to this moment&rdquo;</strong>
          </div>
        </div>
      ),
    },
    {
      id: 'final',
      eyebrow: 'BEGIN YOUR JOURNEY',
      title: 'Your story starts now.',
      description: 'Capture your first moment and start building your Thenvue archive.',

      renderVisual: () => (
        <div className="onboarding-visual-card">
          <div className="onboarding-first-prompt">
            <PenLine size={20} />
            <span>Your life, remembered for you</span>
          </div>
          <div className="onboarding-security-note">
            <ThenvueLogo size={18} />
            <span>100% private, securely encrypted, and uniquely yours.</span>
          </div>
        </div>
      ),
    },
  ]

  const currentSlide = slides[currentIndex]
  const isFinalSlide = currentIndex === slides.length - 1

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      onComplete(true)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleSkip = () => {
    onComplete(false)
  }

  return (
    <div className="modal-backdrop">
      <div className="onboarding-modal-card">
        {/* Top Header */}
        <div className="onboarding-header">
          {currentIndex > 0 ? (
            <button type="button" className="onboarding-nav-btn" onClick={handleBack} aria-label="Go back">
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div style={{ width: 28 }} />
          )}

          <div className="onboarding-brand">
            <div className="onboarding-brand-circle">
              <Feather size={13} />
            </div>
            <span>Memory</span>
          </div>

          {!isFinalSlide ? (
            <button type="button" className="onboarding-skip-btn" onClick={handleSkip}>
              Skip
            </button>
          ) : (
            <div style={{ width: 42 }} />
          )}
        </div>

        {/* Slide Content */}
        <div className="onboarding-body">
          <div className="onboarding-text-group">
            <span className="onboarding-eyebrow">{currentSlide.eyebrow}</span>
            <h2 className="onboarding-title">{currentSlide.title}</h2>
            <p className="onboarding-desc">{currentSlide.description}</p>
          </div>

          <div className="onboarding-visual-area">
            {currentSlide.renderVisual()}
          </div>
        </div>

        {/* Footer */}
        <div className="onboarding-footer">
          <div className="onboarding-dots">
            {slides.map((_, index) => (
              <span
                key={index}
                className={`onboarding-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>

          <button
            type="button"
            className="onboarding-primary-btn"
            onClick={handleNext}
          >
            <span>{isFinalSlide ? 'Start capturing' : 'Next'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
