'use client'

import { useState, useEffect, useRef } from 'react'
import { PenTool } from 'lucide-react'

export function LandingFounderStory() {
  const [isVisible, setIsVisible] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const sectionRef = useRef<HTMLDivElement>(null)

  const fullText = "We built Thenvue because we realized how much of our lives we were forgetting. The great conversations, the random ideas, the little moments with friends—they were all slipping away. We tried using notes apps, but they were too messy, and organizing them felt like a chore.\n\nWe wanted a place where we could just drop our thoughts and let technology do the heavy lifting of organizing them. More importantly, we wanted a tool that respected our privacy—where our data belongs to us, not advertisers. That's why we built Thenvue."

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (isVisible && displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1))
      }, 15) // Typing speed (milliseconds per character)
      return () => clearTimeout(timeout)
    }
  }, [isVisible, displayedText])

  const isDoneTyping = displayedText.length === fullText.length;

  return (
    <section className="landing-founder-section" ref={sectionRef} id="about">
      <div className="landing-founder-container">
        <div className="landing-eyebrow-pill">WHY WE BUILT THENVUE</div>
        
        <div className="landing-founder-content">
          <p className="landing-typewriter-text">
            {displayedText || (isVisible ? '' : fullText.slice(0, 1))}
            {!isDoneTyping && (
              <span className="landing-typewriter-pen">
                <PenTool size={22} className="landing-pen-icon" />
              </span>
            )}
          </p>
          <div className={`landing-founder-signature ${isDoneTyping || isVisible ? 'visible' : ''}`}>
            — The Thenvue Team
          </div>
        </div>
      </div>
    </section>
  )
}
