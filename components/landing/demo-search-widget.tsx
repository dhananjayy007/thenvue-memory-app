'use client'

import { useState } from 'react'
import { ArrowRight, Calendar, MapPin, Search,  Users } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'

interface DemoMemory {
  id: string
  date: string
  time: string
  title: string
  text: string
  place: string
  people: string[]
  topics: string[]
  mood?: string
}

const DEMO_PRESETS: Record<
  string,
  {
    query: string
    reflection: string
    memories: DemoMemory[]
  }
> = {
  'august-reflections': {
    query: 'August reflections',
    reflection:
      'In August, you focused heavily on evening fitness routines, launching your new product design system, and weekend coffee conversations with close colleagues.',
    memories: [
      {
        id: '1',
        date: 'August 24, 2026',
        time: '8:15 PM',
        title: 'Launch Architecture Dinner',
        text: 'Met with Aradhya at the lakefront bistro. We aligned on the database schema, final micro-animations, and preview release timelines.',
        place: 'Powai, Mumbai',
        people: ['Aradhya'],
        topics: ['Work', 'Projects'],
      },
      {
        id: '2',
        date: 'August 18, 2026',
        time: '6:45 PM',
        title: 'Sunset Lake Run',
        text: 'Cleared my head with a 7km run around the lake. Great breeze, felt rejuvenated after a long sprint of deep engineering focus.',
        place: 'Powai Lake',
        people: [],
        topics: ['Fitness', 'Health'],
      },
    ],
  },
  'gym-powai': {
    query: 'Gym days in Powai',
    reflection:
      'You logged 4 workout sessions in Powai this month, typically heading for evening walks near Hiranandani right after your training.',
    memories: [
      {
        id: '3',
        date: 'August 23, 2026',
        time: '7:00 PM',
        title: 'Leg Day & Lake Walk',
        text: 'Pushed through high volume squats at the fitness club. Picked up cold brew with Aradhya on the stroll back.',
        place: 'Hiranandani, Powai',
        people: ['Aradhya'],
        topics: ['Fitness', 'Powai'],
      },
      {
        id: '4',
        date: 'August 12, 2026',
        time: '6:30 PM',
        title: 'Upper Body Workout',
        text: 'Consistent bench and pull-up progression today. Energy levels were high throughout the entire session.',
        place: 'Powai Gym',
        people: [],
        topics: ['Fitness'],
      },
    ],
  },
  'coffee-blue-tokai': {
    query: 'Coffee at Blue Tokai',
    reflection:
      'Blue Tokai has been your go-to spot for weekend reading, sketching product ideas, and catching up with friends over iced pour-overs.',
    memories: [
      {
        id: '5',
        date: 'August 15, 2026',
        time: '11:30 AM',
        title: 'Saturday Pour-over & Journaling',
        text: 'Spent two hours at Blue Tokai tasting their new single-origin roast while sketching the Thenvue mobile navigation flow.',
        place: 'Blue Tokai Coffee',
        people: [],
        topics: ['Coffee', 'Design'],
      },
      {
        id: '6',
        date: 'July 28, 2026',
        time: '4:00 PM',
        title: 'Catchup with Rohan',
        text: 'Met Rohan for espresso tonics. Discussed his recent move to Bangalore and remote work setups.',
        place: 'Blue Tokai Coffee',
        people: ['Rohan'],
        topics: ['Friends', 'Life'],
      },
    ],
  },
  'college-memories': {
    query: 'College memories',
    reflection:
      'Your archive highlights your graduation road trip to Goa, late night hackathons in the dorms, and farewell dinners with the batch.',
    memories: [
      {
        id: '7',
        date: 'May 20, 2024',
        time: '11:45 PM',
        title: 'Hackathon Final Presentation',
        text: 'Our team stayed up 36 hours building the real-time audio visualizer. Took home 1st runner up prize!',
        place: 'Campus Auditorium',
        people: ['Vikram', 'Ananya'],
        topics: ['College', 'Milestones'],
      },
      {
        id: '8',
        date: 'June 14, 2024',
        time: '9:00 PM',
        title: 'Hostel Farewell Dinner',
        text: 'Final night in Room 304 before everyone packed for their new jobs. Bittersweet memories with the best group.',
        place: 'Campus Hostel',
        people: ['Batch of 2024'],
        topics: ['Friends', 'College'],
      },
    ],
  },
}

export function LandingDemoSearchWidget() {
  const [activeKey, setActiveKey] = useState<string>('august-reflections')
  const [customInput, setCustomInput] = useState<string>('')

  const currentPreset = DEMO_PRESETS[activeKey] || DEMO_PRESETS['august-reflections']

  const handleChipClick = (key: string) => {
    setActiveKey(key)
    setCustomInput('')
  }

  return (
    <section id="demo" className="landing-section">
      <div className="landing-section-header">
        <div className="landing-section-eyebrow">INTERACTIVE EXPERIENCE</div>
        <h2 className="landing-section-title">Try Searching Your Memories</h2>
        <p className="landing-section-subhead">
          Click any query below to preview how Thenvue retrieves, synthesizes, and reflects on your
          past moments in real-time.
        </p>
      </div>

      <div className="landing-demo-container">
        {/* Search Input Bar */}
        <div className="landing-demo-search-box">
          <CustomBrainIcon size={18} color="var(--accent)" />
          <input
            type="text"
            className="landing-demo-input"
            value={customInput || currentPreset.query}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Type a query or select a topic below..."
          />
          <button type="button" className="landing-demo-search-btn" aria-label="Search">
            <Search size={15} />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="landing-demo-chips">
          <div className="landing-chips-header-row">
            <span className="landing-chips-label">Sample queries:</span>
            <span className="landing-chips-hint">Tap to try →</span>
          </div>
          <div className="landing-chips-list">
            {Object.entries(DEMO_PRESETS).map(([key, data]) => (
              <button
                key={key}
                type="button"
                className={`landing-demo-chip ${activeKey === key && !customInput ? 'active' : ''}`}
                onClick={() => handleChipClick(key)}
              >
                <span>{data.query}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Synthesis Summary Card */}
        <div className="landing-demo-ai-reflection">
          <div className="demo-ai-header">
            <CustomBrainIcon size={14} className="sparkle-tint" />
            <span className="demo-ai-title">Thenvue Memory Reflection</span>
          </div>
          <p className="demo-ai-body">&ldquo;{currentPreset.reflection}&rdquo;</p>
        </div>

        {/* Matching Memory Cards Grid */}
        <div className="landing-demo-results-grid">
          {currentPreset.memories.map((memory) => (
            <div key={memory.id} className="landing-demo-memory-card">
              <div className="demo-card-top">
                <span className="demo-card-date">
                  <Calendar size={11} /> {memory.date} · {memory.time}
                </span>
                <span className="demo-card-topic">{memory.topics[0]}</span>
              </div>
              <h4 className="demo-card-title">{memory.title}</h4>
              <p className="demo-card-text">{memory.text}</p>
              <div className="demo-card-meta">
                <span>
                  <MapPin size={11} /> {memory.place}
                </span>
                {memory.people.length > 0 && (
                  <span>
                    <Users size={11} /> {memory.people.join(', ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
