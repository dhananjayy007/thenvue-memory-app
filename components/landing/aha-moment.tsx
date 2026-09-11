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
    photoUrl: string
  }[]
}

const DEMO_PRESETS: DemoQuery[] = [
  {
    id: 'lake-house',
    label: 'Weekends at the lake house',
    query: 'What did we do at the lake house last summer?',
    answer:
      'Last July, you spent three days at the lake house with Alex and Jordan. You made coffee on the dock at sunrise, swam in the afternoon, and read on the screened porch while the rain came through.',
    context: {
      people: ['Alex', 'Jordan'],
      places: ['The Lake House'],
      timeframe: 'July 2025',
    },
    memories: [
      {
        id: 'mem-1',
        date: 'July 19, 2025 · 6:30 PM',
        title: 'Sunset over the dock',
        snippet: 'Sat with Alex on the warm cedar boards with our feet in the water. We talked about how fast the year had gone.',
        place: 'The Lake House',
        people: ['Alex'],
        photoUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'mem-2',
        date: 'July 20, 2025 · 8:15 AM',
        title: 'Morning coffee & pine needles',
        snippet: 'Jordan brewed a kettle of pour-over. Total silence except the loons on the far side of the water.',
        place: 'Screened Porch',
        people: ['Jordan'],
        photoUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'lisbon-walks',
    label: 'Coffee & bookshops in Lisbon',
    query: 'Where were the quiet spots I loved in Lisbon?',
    answer:
      'You frequented the corner bookshop in Chiado for quiet morning reading with Maya, and spent rainy afternoons at the neighborhood roastery writing in your notebook.',
    context: {
      people: ['Maya'],
      places: ['Lisbon', 'Corner Bookshop'],
      timeframe: 'October 2025',
    },
    memories: [
      {
        id: 'mem-3',
        date: 'October 14, 2025 · 4:15 PM',
        title: 'Rainy afternoon at the corner bookshop',
        snippet: 'Found a quiet table under the archway. Maya and I read for two hours while the cobblestones outside glistened.',
        place: 'Corner Bookshop, Lisbon',
        people: ['Maya'],
        photoUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'mem-4',
        date: 'October 18, 2025 · 9:30 AM',
        title: 'Morning espresso before the museum',
        snippet: 'Warm pastries and strong coffee by the sunny balcony. Discussed taking a road trip north along the coast.',
        place: 'Alfama Roastery',
        people: ['Maya'],
        photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'old-apartment',
    label: 'Moving out of the college town',
    query: 'When did we pack up the old apartment?',
    answer:
      'You packed up the old apartment with Sam on a warm afternoon in late May. You listened to records on the floor after the furniture was moved out.',
    context: {
      people: ['Sam'],
      places: ['The Old Apartment', 'College Town'],
      timeframe: 'May 2024',
    },
    memories: [
      {
        id: 'mem-5',
        date: 'May 28, 2024 · 3:45 PM',
        title: 'Empty living room records',
        snippet: 'Everything in boxes. Sam plugged the record player into the last wall outlet and we danced on the bare floorboards.',
        place: 'The Old Apartment',
        people: ['Sam'],
        photoUrl: 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
]

export function LandingAhaMoment() {
  const [selectedPreset, setSelectedPreset] = useState<DemoQuery>(DEMO_PRESETS[0])

  return (
    <section id="ask-your-life" className="landing-aha-section">
      <div className="landing-aha-header">
        <span className="landing-quiet-eyebrow">
          Ask Your Life
          {/* Near-zero rose accent: single tiny refined dot on the entire page */}
          <span className="single-rose-accent-dot" aria-hidden="true" />
        </span>
        <h2 className="landing-aha-headline">Ask your past anything.</h2>
        <p className="landing-aha-subhead">
          Search your life by feeling, place, or conversation. Thenvue understands the nuance of how you remember.
        </p>
      </div>

      {/* Preset Filter Chips */}
      <div className="landing-aha-chips-row">
        {DEMO_PRESETS.map((preset) => {
          const isActive = preset.id === selectedPreset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedPreset(preset)}
              className={`aha-chip-button ${isActive ? 'active' : ''}`}
            >
              <span>{preset.label}</span>
            </button>
          )
        })}
      </div>

      {/* Interactive Showcase Frame */}
      <div className="landing-aha-demo-stage">
        {/* Search Bar Visual */}
        <div className="aha-search-bar-mock">
          <div className="search-bar-left">
            <Search size={16} className="search-icon" />
            <span className="search-text-value">&ldquo;{selectedPreset.query}&rdquo;</span>
          </div>
          <span className="search-status-pill">
            <Sparkles size={12} />
            <span>Semantic match</span>
          </span>
        </div>

        {/* AI Grounded Synthesis Box */}
        <div className="aha-ai-answer-card">
          <div className="ai-answer-header">
            <CustomBrainIcon size={16} className="ai-brain-icon" />
            <span className="ai-answer-label">Thenvue AI Reflection</span>
          </div>

          <p className="ai-answer-body">&ldquo;{selectedPreset.answer}&rdquo;</p>

          {/* Context pill tags */}
          <div className="ai-context-pills">
            <span className="context-pill">
              <Calendar size={11} />
              <span>{selectedPreset.context.timeframe}</span>
            </span>
            <span className="context-pill">
              <Users size={11} />
              <span>{selectedPreset.context.people.join(', ')}</span>
            </span>
            <span className="context-pill">
              <MapPin size={11} />
              <span>{selectedPreset.context.places.join(', ')}</span>
            </span>
          </div>
        </div>

        {/* Grounding Memories with Real Photography */}
        <div className="aha-grounding-section">
          <span className="grounding-eyebrow">Matched Memories</span>

          <div className="aha-memories-grid">
            {selectedPreset.memories.map((mem) => (
              <div key={mem.id} className="aha-memory-card">
                <div className="aha-memory-photo-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mem.photoUrl}
                    alt={mem.title}
                    className="aha-memory-photo"
                    loading="lazy"
                  />
                </div>

                <div className="aha-memory-content">
                  <div className="aha-memory-top">
                    <span className="aha-memory-date">{mem.date}</span>
                    <span className="aha-memory-place">
                      <MapPin size={11} /> {mem.place}
                    </span>
                  </div>

                  <h4 className="aha-memory-title">{mem.title}</h4>
                  <p className="aha-memory-snippet">&ldquo;{mem.snippet}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
