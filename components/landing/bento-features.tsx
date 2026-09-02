'use client'

import {
  Calendar,
  CheckCircle2,
  Clock3,
  Globe2,
  Lock,
  MapPin,
  MessageSquareQuote,
  ShieldCheck,
  
  Users,
} from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'

export function LandingBentoFeatures() {
  return (
    <section id="features" className="landing-section">
      <div className="landing-section-header">
        <div className="landing-section-eyebrow">DESIGNED FOR CLARITY</div>
        <h2 className="landing-section-title">An Intelligent Personal Archive</h2>
        <p className="landing-section-subhead">
          Every moment you capture is organized into an interconnected map of your personal history.
        </p>
      </div>

      <div className="landing-bento-grid">
        {/* Card 1: Interactive Timeline (Large 2-col) */}
        <div className="landing-bento-card bento-span-2">
          <div className="landing-bento-header">
            <div className="landing-bento-icon-wrap">
              <Clock3 size={18} />
            </div>
            <div>
              <h3 className="landing-bento-title">Interactive Timeline</h3>
              <p className="landing-bento-sub">
                A clean, vertical chronological stream with monthly groupings and rich media previews.
              </p>
            </div>
          </div>

          <div className="landing-bento-timeline-preview">
            <div className="bento-timeline-item">
              <div className="bento-timeline-marker">
                <span className="bento-marker-dot" />
                <span className="bento-marker-line" />
              </div>
              <div className="bento-timeline-bubble">
                <div className="bento-bubble-header">
                  <span>August 24, 2026 · 8:15 PM</span>
                  <span className="bento-tag">Powai</span>
                </div>
                <p className="bento-bubble-text">
                  Dinner at the lakefront bistro with Aradhya. Finished discussing the architecture roadmap for the upcoming launch.
                </p>
                <div className="bento-bubble-footer">
                  <span>
                    <Users size={11} /> Aradhya
                  </span>
                  <span>
                    <MapPin size={11} /> Mumbai
                  </span>
                </div>
              </div>
            </div>

            <div className="bento-timeline-item">
              <div className="bento-timeline-marker">
                <span className="bento-marker-dot" />
              </div>
              <div className="bento-timeline-bubble secondary">
                <div className="bento-bubble-header">
                  <span>August 23, 2026 · 7:30 AM</span>
                  <span className="bento-tag">Morning</span>
                </div>
                <p className="bento-bubble-text">
                  Completed 5k run around the park. Fresh air, misty morning, and quiet solitude.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: "Ask Your Life" AI Spotlight (Large 2-col or Spotlight) */}
        <div id="ask-ai" className="landing-bento-card bento-span-2 bento-ai-spotlight">
          <div className="landing-bento-header">
            <div className="landing-bento-icon-wrap ai-accent">
              <CustomBrainIcon size={18} color="var(--accent)" />
            </div>
            <div>
              <h3 className="landing-bento-title">&ldquo;Ask Your Life&rdquo; AI</h3>
              <p className="landing-bento-sub">
                Conversational search grounded purely in your personal timeline.
              </p>
            </div>
          </div>

          <div className="landing-bento-ai-demo">
            {/* Input preview */}
            <div className="bento-ai-input-box">
              <CustomBrainIcon size={16} color="var(--accent)" />
              <span className="bento-ai-query-text">
                &ldquo;What did I do in Powai with Aradhya?&rdquo;
              </span>
              <span className="bento-ai-status">Grounded Search</span>
            </div>

            {/* Answer reflection card */}
            <div className="bento-ai-answer-card">
              <div className="bento-ai-answer-header">
                <CustomBrainIcon size={13} className="sparkle-tint" />
                <span>Remembered from 2 memories in August</span>
              </div>
              <p className="bento-ai-answer-body">
                On August 24th, you had dinner with Aradhya at the lakefront bistro in Powai to discuss the launch roadmap. A day earlier on August 23rd, you walked near Hiranandani after your gym workout.
              </p>
              <div className="bento-ai-citations">
                <span className="citation-pill">
                  <Calendar size={10} /> Aug 24: Lakefront Bistro
                </span>
                <span className="citation-pill">
                  <Calendar size={10} /> Aug 23: Powai Walk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: The Shape of Your Life (Personal Stats) */}
        <div className="landing-bento-card">
          <div className="landing-bento-header">
            <div className="landing-bento-icon-wrap">
              <Globe2 size={18} />
            </div>
            <div>
              <h3 className="landing-bento-title">The Shape of Your Life</h3>
              <p className="landing-bento-sub">
                Aggregate insights into your places, people, and habits over time.
              </p>
            </div>
          </div>

          <div className="landing-bento-stats-grid">
            <div className="bento-stat-box">
              <strong className="bento-stat-num">142</strong>
              <span className="bento-stat-label">Memories Preserved</span>
            </div>
            <div className="bento-stat-box">
              <strong className="bento-stat-num">18</strong>
              <span className="bento-stat-label">Places Explored</span>
            </div>
            <div className="bento-stat-box">
              <strong className="bento-stat-num">24</strong>
              <span className="bento-stat-label">People Connected</span>
            </div>
            <div className="bento-stat-box">
              <strong className="bento-stat-num">98%</strong>
              <span className="bento-stat-label">Reflection Consistency</span>
            </div>
          </div>
        </div>

        {/* Card 4: Local & Private by Default */}
        <div id="privacy" className="landing-bento-card">
          <div className="landing-bento-header">
            <div className="landing-bento-icon-wrap">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="landing-bento-title">Private by Design</h3>
              <p className="landing-bento-sub">
                Your memories belong strictly to you. No public feeds, no ads, no trackers.
              </p>
            </div>
          </div>

          <div className="landing-bento-privacy-list">
            <div className="bento-privacy-item">
              <CheckCircle2 size={15} className="privacy-check" />
              <span>Zero ad targeting and zero third-party data selling</span>
            </div>
            <div className="bento-privacy-item">
              <CheckCircle2 size={15} className="privacy-check" />
              <span>Secure isolated user workspaces with Row Level Security</span>
            </div>
            <div className="bento-privacy-item">
              <CheckCircle2 size={15} className="privacy-check" />
              <span>AI inference is private and never used to train public models</span>
            </div>
            <div className="bento-privacy-item">
              <CheckCircle2 size={15} className="privacy-check" />
              <span>Export your memories or delete your data anytime with one click</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
