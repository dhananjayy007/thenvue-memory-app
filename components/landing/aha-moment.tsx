'use client'

import { useState } from 'react'
import { Search, Calendar, MapPin, Users, Sparkles, ArrowRight } from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'

interface DemoQuery {
  id: string
  label: string
  query: string
  answer: string
  context: {
    people: string[]
    places: string[]
    timeframe: string
  }
  memories: {
    id: string
    date: string
    title: string
    snippet: string
    place: string
    people: string[]
    tag: string
  }[]
}

const DEMO_PRESETS: DemoQuery[] = [
  {
    id: 'summer-friends',
    label: 'Friends last summer',
    query: 'What did I do with my friends last summer?',
    answer:
      'Last summer, you spent weekends at Blue Tokai sketching ideas with Maya, caught evening walks around Powai Lake, and hosted a late-night graduation reunion before the team moved to new cities.',
    context: {
      people: ['Maya', 'Liam', 'Elena'],
      places: ['Powai Lake', 'Blue Tokai', 'Hostel Rooftop'],
      timeframe: 'June – August 2026',
    },
    memories: [
      {
        id: 'mem-1',
        date: 'August 24, 2026 · 8:15 PM',
        title: 'Lakefront Dinner & Architecture Talk',
        snippet: 'Met Maya at the bistro near the lake. We talked about building our studio, new project roadmaps, and watching the city lights.',
        place: 'Powai, Mumbai',
        people: ['Maya'],
        tag: 'Projects',
      },
      {
        id: 'mem-2',
        date: 'July 18, 2026 · 6:45 PM',
        title: 'Sunset Walk Around the Lake',
        snippet: 'Joined Liam and Elena for a breezy evening walk. Discussed travel plans and caught the golden sunset over the hills.',
        place: 'Powai Lake',
        people: ['Liam', 'Elena'],
        tag: 'Friends',
      },
      {
        id: 'mem-3',
        date: 'June 14, 2026 · 11:30 PM',
        title: 'Late Night Rooftop Farewell',
        snippet: 'Final hostel rooftop dinner before packing bags. Playing acoustic guitar and reminiscing on four years together.',
        place: 'Campus Rooftop',
        people: ['Maya', 'Liam'],
        tag: 'College',
      },
    ],
  },
  {
    id: 'coffee-maya',
    label: 'Coffee spots with Maya',
    query: 'Where were the coffee spots I loved with Maya?',
    answer:
      'You frequently met Maya at Blue Tokai for pour-overs and design sketching on Saturday mornings, and stopped by the quiet corner roastery in Bandra on rainy afternoons.',
    context: {
      people: ['Maya'],
      places: ['Blue Tokai', 'Subko Bandra'],
      timeframe: 'March – August 2026',
    },
    memories: [
      {
        id: 'mem-4',
        date: 'August 15, 2026 · 11:30 AM',
        title: 'Saturday Pour-overs & Sketching',
        snippet: 'Spent two quiet hours at the corner table tasting Ethiopian single-origin while mapping out app physics.',
        place: 'Blue Tokai Coffee',
        people: ['Maya'],
        tag: 'Coffee',
      },
      {
        id: 'mem-5',
        date: 'April 02, 2026 · 4:20 PM',
        title: 'Rainy Afternoon Espresso',
        snippet: '躲雨 in the old Portuguese quarter with warm sourdough toast and double shot espressos with Maya.',
        place: 'Subko Bandra',
        people: ['Maya'],
        tag: 'Life',
      },
    ],
  },
  {
    id: 'kyoto-trip',
    label: 'Kyoto autumn trip',
    query: 'What do I remember about our trip to Kyoto?',
    answer:
      'In October 2025, you explored early morning tea houses in Gion with Liam, caught rainy temple moss gardens, and listened to vinyl records at a tiny jazz bar.',
    context: {
      people: ['Liam'],
      places: ['Gion, Kyoto', 'Arashiyama', 'Jazz Kissa D-Bop'],
      timeframe: 'October 2025',
    },
    memories: [
      {
        id: 'mem-6',
        date: 'October 12, 2025 · 8:40 AM',
        title: 'Early Morning Cedar Tea House',
        snippet: 'Walked the stone alleys right after sunrise rain. The smell of cedar and incense was everywhere.',
        place: 'Gion, Kyoto',
        people: ['Liam'],
        tag: 'Travel',
      },
      {
        id: 'mem-7',
        date: 'October 14, 2025 · 9:15 PM',
        title: 'Late Night Jazz Kissa',
        snippet: 'Found an unmarked wooden door on the second floor. Bill Evans playing on vintage McIntosh tube amps.',
        place: 'Jazz Kissa D-Bop',
        people: ['Liam'],
        tag: 'Music',
      },
    ],
  },
]

export function LandingAhaMoment() {
  const [selectedKey, setSelectedKey] = useState<string>('summer-friends')
  const [isSearching, setIsSearching] = useState(false)
  const [customQuery, setCustomQuery] = useState('')

  const activePreset = DEMO_PRESETS.find((p) => p.id === selectedKey) || DEMO_PRESETS[0]

  const handleSelectPreset = (key: string) => {
    if (key === selectedKey && !customQuery) return
    setIsSearching(true)
    setSelectedKey(key)
    setCustomQuery('')
    setTimeout(() => {
      setIsSearching(false)
    }, 320)
  }

  return (
    <section id="how-it-works" className="landing-aha-section">
      <div className="landing-aha-header">
        <span className="landing-quiet-eyebrow">Ask Your Life</span>
        <h2 className="landing-aha-headline">
          Instead of searching through your life, ask about it.
        </h2>
        <p className="landing-aha-subhead">
          Ask questions in your own words. Thenvue retrieves your saved memories to build a grounded answer.
        </p>
      </div>

      {/* Main Interactive Demo Unit */}
      <div className="landing-aha-demo-card">
        {/* Search Bar */}
        <div className="landing-aha-search-bar">
          <div className="aha-search-input-wrap">
            <CustomBrainIcon size={18} className="aha-brain-icon" />
            <input
              type="text"
              className="aha-search-input"
              value={customQuery || activePreset.query}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Ask your life anything..."
            />
          </div>
          <button
            type="button"
            className="aha-search-action-btn"
            onClick={() => handleSelectPreset(selectedKey)}
            aria-label="Search past"
          >
            <Search size={15} />
          </button>
        </div>

        {/* Preset Query Chips */}
        <div className="landing-aha-chips-row">
          <span className="aha-chips-label">Try asking:</span>
          <div className="aha-chips-list">
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`aha-chip-button ${selectedKey === preset.id && !customQuery ? 'active' : ''}`}
                onClick={() => handleSelectPreset(preset.id)}
              >
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Searching Transition Indicator */}
        {isSearching ? (
          <div className="aha-searching-state">
            <CustomBrainIcon size={20} className="aha-spinner-icon" />
            <span>Searching your private timeline...</span>
          </div>
        ) : (
          <div className="aha-results-container">
            {/* Context Breadcrumbs / Connected Entity Ribbon */}
            <div className="aha-connected-ribbon">
              <div className="connected-ribbon-item">
                <Users size={12} className="ribbon-icon" />
                <span className="ribbon-label">People:</span>
                <span className="ribbon-val">{activePreset.context.people.join(', ')}</span>
              </div>
              <div className="connected-ribbon-divider" />
              <div className="connected-ribbon-item">
                <MapPin size={12} className="ribbon-icon" />
                <span className="ribbon-label">Places:</span>
                <span className="ribbon-val">{activePreset.context.places.join(' · ')}</span>
              </div>
              <div className="connected-ribbon-divider" />
              <div className="connected-ribbon-item">
                <Calendar size={12} className="ribbon-icon" />
                <span className="ribbon-label">Timeline:</span>
                <span className="ribbon-val">{activePreset.context.timeframe}</span>
              </div>
            </div>

            {/* AI Grounded Synthesis Box */}
            <div className="aha-answer-box">
              <div className="aha-answer-header">
                <Sparkles size={14} className="aha-sparkle-tint" />
                <span>Grounded recollection from {activePreset.memories.length} memories</span>
              </div>
              <p className="aha-answer-text">&ldquo;{activePreset.answer}&rdquo;</p>
            </div>

            {/* Retrieved Memory Timeline Cards */}
            <div className="aha-memories-grid">
              {activePreset.memories.map((mem) => (
                <div key={mem.id} className="aha-memory-card">
                  <div className="aha-card-header">
                    <span className="aha-card-date">
                      <Calendar size={11} /> {mem.date}
                    </span>
                    <span className="aha-card-tag">{mem.tag}</span>
                  </div>
                  <h4 className="aha-card-title">{mem.title}</h4>
                  <p className="aha-card-snippet">{mem.snippet}</p>
                  <div className="aha-card-footer">
                    <span className="aha-card-place">
                      <MapPin size={11} /> {mem.place}
                    </span>
                    {mem.people.length > 0 && (
                      <span className="aha-card-people">
                        <Users size={11} /> {mem.people.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <a href="/ai-memory-search" className="trust-inline-link" style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                Learn how AI memory search works →
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
