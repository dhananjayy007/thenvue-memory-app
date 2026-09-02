'use client'

import React, { useState, useEffect } from 'react'
import { Film, Image as ImageIcon, Plus, Clock, MapPin, Users, Check, AlertCircle } from 'lucide-react'
import type { Memory, PastImportQuota } from '@/types/memory'
import { SectionTitle } from '@/components/shared/section-title'
import { MemoryCard } from '@/components/memory/memory-card'
import { getPastImportQuotaAction, getRediscoveredMemoriesAction } from '@/app/memories/actions'

export function Rediscover({
  onOpen,
  onStartImport,
  quotaRefreshTrigger = 0,
}: {
  onOpen: (m: Memory) => void
  onStartImport: () => void
  quotaRefreshTrigger?: number
}) {
  const [quota, setQuota] = useState<PastImportQuota>({ used: 0, limit: 100, remaining: 100 })
  const [rediscoveredMemories, setRediscoveredMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      getPastImportQuotaAction(),
      getRediscoveredMemoriesAction(),
    ])
      .then(([q, mems]) => {
        if (active) {
          setQuota(q)
          setRediscoveredMemories(mems)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [quotaRefreshTrigger])

  const percentage = Math.min(100, Math.round((quota.used / quota.limit) * 100))

  return (
    <div className="page rediscover-page">
      <div className="page-heading rediscover-heading">
        <div>
          <p className="eyebrow">Past Photo Import</p>
          <h1>Rediscover your past.</h1>
          <p className="subhead">Bring old photos into Thenvue and turn them into memories.</p>
        </div>
        <button
          className="solid-button rediscover-cta-btn"
          onClick={onStartImport}
          disabled={quota.remaining === 0}
        >
          <Plus size={16} />
          <span>{quota.remaining === 0 ? 'Quota Reached (100/100)' : 'Add Photos'}</span>
        </button>
      </div>

      {/* Quota Indicator Box */}
      <div className="rediscover-quota-card">
        <div className="quota-header">
          <div className="quota-title-group">
            <Film size={18} className="quota-sparkle-icon" />
            <div>
              <h3>Past Photos Quota</h3>
              <p className="quota-explanation">
                You can import up to 100 past photos into Thenvue. Normal present-day memories are always unlimited.
              </p>
            </div>
          </div>
          <div className="quota-numbers">
            <span className="quota-count">{quota.used}</span>
            <span className="quota-divider">/</span>
            <span className="quota-total">{quota.limit}</span>
            <small className="quota-label">past photos imported</small>
          </div>
        </div>

        {/* Progress bar */}
        <div className="quota-bar-track">
          <div
            className={`quota-bar-fill ${percentage >= 90 ? 'quota-critical' : percentage >= 70 ? 'quota-warning' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="quota-footer">
          {quota.remaining > 0 ? (
            <span className="quota-remaining-text">
              ✨ <strong>{quota.remaining}</strong> past photo slot{quota.remaining === 1 ? '' : 's'} remaining
            </span>
          ) : (
            <span className="quota-exhausted-text">
              <AlertCircle size={14} /> You've reached your 100 past-photo limit. Deleting an imported past photo will free up slots.
            </span>
          )}
          <span className="quota-active-note">Active quota: deletes restore slots</span>
        </div>
      </div>

      {/* How it works info strip */}
      <div className="rediscover-steps-strip">
        <div className="rediscover-step">
          <span className="step-num">1</span>
          <div>
            <strong>Select Past Photos</strong>
            <p>Pick 1 or multiple old photos from your gallery anytime.</p>
          </div>
        </div>
        <div className="rediscover-step">
          <span className="step-num">2</span>
          <div>
            <strong>Thenvue Finds Moments</strong>
            <p>We automatically cluster dates, places, and detect duplicates.</p>
          </div>
        </div>
        <div className="rediscover-step">
          <span className="step-num">3</span>
          <div>
            <strong>Review & Remember</strong>
            <p>Edit AI suggestions, keep what matters, and add to your life timeline.</p>
          </div>
        </div>
      </div>

      {/* Rediscovered Memories Section */}
      <div className="rediscovered-section">
        <SectionTitle
          label="Rediscovered Memories"
          action={quota.remaining > 0 ? "Add photos" : ""}
          onClick={onStartImport}
        />

        {loading ? (
          <div className="empty-state">
            <p>Loading your rediscovered memories...</p>
          </div>
        ) : rediscoveredMemories.length > 0 ? (
          <div className="memory-grid">
            {rediscoveredMemories.map((m) => (
              <MemoryCard key={m.id} memory={m} onClick={() => onOpen(m)} />
            ))}
          </div>
        ) : (
          <div className="rediscover-empty-container">
            <div className="rediscover-empty-icon">
              <ImageIcon size={32} />
            </div>
            <h3>No past photos imported yet</h3>
            <p>
              Bring moments from your old trips, college days, family gatherings, or childhood back to life.
            </p>
            <button className="outline-button" onClick={onStartImport}>
              <Plus size={15} /> Select Your First Past Photo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
