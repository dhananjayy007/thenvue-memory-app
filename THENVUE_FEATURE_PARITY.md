# THENVUE FEATURE PARITY AUDIT: WEB vs. EXPO MOBILE

**Audit Date:** September 2026  
**Auditor:** Antigravity IDE  
**Scope:** Complete cross-platform inspection of Web (`Next.js / TypeScript / Supabase`) vs Mobile (`Expo / React Native / TypeScript / Supabase`).

---

## EXECUTIVE SUMMARY

Thenvue's core foundation—Supabase PostgreSQL database, Row Level Security (RLS) policies, storage buckets, and Gemini AI integration—is shared across both platforms.

- **Web App:** Highly mature, full-featured desktop & mobile web experience with Server Actions, Gemini Flash multi-modal processing, vector embeddings with pgvector (`match_memories`), PDF optimization, and public SSR share links.
- **Expo App:** A remarkably high degree of parity (~90% of user workflows are implemented natively in Expo), including 5-tab navigation, full capture modal with GPS reverse geocoding, voice recording with waveform aesthetics, full photo attachment to past memories, perspective threads with collaborative permissions, Rediscover import modal with EXIF extraction, and real-time user invitations.
- **Key Discrepancies:** 
  1. Semantic AI search is active on Web but mobile search is currently client-side text filtering.
  2. Mobile `AskScreen` has a field mismatch (`sources` vs `sourceMemories`) that causes source memory cards not to show.
  3. Mobile AI features rely on `EXPO_PUBLIC_API_URL` proxying to the Next.js backend `/api/v1/ai`.
  4. Connected memories on Web use pgvector embeddings + metadata, while mobile uses client-side rule heuristics over loaded memories.
  5. Deep links on mobile currently only handle OAuth auth tokens, not memory share links (`thenvue://share/:id`).

---

## A. COMPLETE FEATURE INVENTORY

1. **Authentication & Session Lifecycle**
   - Email/Password Sign-Up & Sign-In
   - Google OAuth integration with callback routing
   - Password reset flow
   - Persistent session storage & token auto-refresh
   - Sign out & multi-device session handling

2. **Onboarding & First-Run Experience**
   - Multi-step welcome carousel
   - Display name / username setup
   - Philosophy & privacy explanation
   - Initial starter memory capture prompt
   - Tutorial replay from Profile/Settings

3. **Memory Creation (Text & Quick Capture)**
   - Rich multi-line text capture with character counting (up to 12,000 chars)
   - Real-time GPS location detection with reverse geocoding
   - Manual custom place override
   - Custom calendar date & time selection
   - @Mention autocomplete for participants/collaborators

4. **Photo Memories & Attachment**
   - Multi-image selection (camera & photo gallery)
   - Photo upload to Supabase storage (`memory-photos`)
   - Attaching additional photos to *any* memory (past or present)
   - Image preview carousel and full-screen visual modal
   - Single photo deletion within memory

5. **Voice Memories & Audio Journaling**
   - Direct microphone recording (WebM on Web, M4A on Mobile)
   - Live recording duration timer & audio playback preview
   - Custom waveform visual card rendering
   - Native audio player with scrubbing/play/pause

6. **AI Audio Transcription**
   - Gemini Flash multi-modal audio transcription
   - Async background processing with optimistic UI updates
   - Automatic fallback to recorded date placeholder if transcription fails
   - Retry transcription action

7. **AI Enrichment & Auto-Tagging**
   - Gemini auto-tagging: title generation, topics (`#`), people (`@`), mood, memory type, summary
   - Vector embedding generation (768-dim `gemini-embedding-2`)
   - Async background execution without blocking user interaction

8. **AI / Semantic Memory Search**
   - Vector cosine similarity search via pgvector RPC (`match_memories`)
   - Hybrid search (semantic matches + substring fallback on place/topic/people/body)
   - Debounced instant search in UI

9. **Ask Your Life (Memory Q&A Assistant)**
   - Natural language Q&A assistant grounded in personal journal
   - Multi-signal memory retrieval with strict anti-hallucination prompt
   - Source memory citation chips linking directly to memory details
   - Suggested starter questions

10. **Connected Memories (Related Moments Graph)**
    - Automatic recommendation of related moments
    - Connection reasons: shared people, identical place, shared topic, anniversary/temporal pattern, vector similarity
    - One-tap navigation between connected memories

11. **People Directory**
    - Aggregated people list extracted across all memories
    - Memory frequency count per person
    - Real-time name search filtering
    - Tapping a person opens memories filtered to that individual

12. **Places & Geography**
    - Aggregated locations list extracted across all memories
    - Memory frequency count per place
    - Tapping a place opens memories filtered to that location

13. **Rediscover (Past Photo Import & Clustering)**
    - Batch photo import for historical photos (quota: 50 photos)
    - EXIF metadata extraction (`DateTimeOriginal`, `CreateDate`, GPS coords)
    - Filename pattern date extraction (WhatsApp, iOS, Android, Screenshots)
    - Date confidence classification (`exact`, `inferred`, `unknown`)
    - Photo clustering into memory suggestions (same day + location proximity)
    - Import review modal with manual date/place adjustment before saving

14. **Shared Memories & Collaborative Perspectives**
    - User search by display name / email
    - Inviting participants with pending/accepted status
    - Real-time in-app notification center
    - Adding collaborative perspective entries to a memory with photos & audio
    - Perspective deletion & participant removal / stop sharing

15. **Memory Editing & Deletion**
    - In-place editing of title, body, date, and place
    - Soft deletion (`deleted_at`) with automatic media removal from Supabase storage
    - Confirmation dialogs for destructive actions

16. **Timeline & Reverse-Chronological Feed**
    - Grouping by Month & Year with sticky headers
    - Dual date & time display (`Feb 3, 2026 · 2:22 PM`)
    - Infinite scrolling with cursor-based pagination
    - Filter pills (All, Photos, Places, People)

17. **Tag Highlighting & Filtering**
    - High-contrast highlighted tag pills (`#topics`, `@people`, `📍places`)
    - Horizontal scrollable filter bar
    - One-tap tag filtering from detail view to timeline/memories feed

18. **PDF Document Support**
    - Document attachment support
    - Web: Client-side PDF optimization and page rendering
    - Mobile: Document picker attachment

19. **Theme & Appearance**
    - Dark mode / Light mode toggle
    - Editorial serif typography & warm accent color palette

20. **Public Memory Sharing & Deep Linking**
    - Web: Public read-only memory link page (`/share/[id]`)
    - Mobile: Deep link OAuth receiver

---

## B. WEB vs EXPO PARITY TABLE

| Feature Area | Web Implementation | Expo / Mobile Implementation | Backend Support | Parity Status | Key Files Involved |
|---|---|---|---|---|---|
| **1. Memory creation** | Implemented | Implemented | Yes | **Full Parity** | `components/memory/capture-modal.tsx`<br>`mobile/src/components/CaptureModal.tsx` |
| **2. Text memories** | Implemented | Implemented | Yes | **Full Parity** | `app/memories/actions.ts`<br>`mobile/src/lib/memories.ts` |
| **3. Photo memories** | Implemented | Implemented | Yes | **Full Parity** | `components/memory/capture-modal.tsx`<br>`mobile/src/components/CaptureModal.tsx` |
| **4. Voice memories** | Implemented | Implemented | Yes | **Full Parity** | `components/memory/capture-modal.tsx`<br>`mobile/src/components/CaptureModal.tsx`<br>`mobile/src/components/AudioPlayer.tsx` |
| **5. Audio transcription** | Implemented | Implemented (via AI proxy) | Yes | **Full Parity** | `app/api/v1/ai/route.ts`<br>`mobile/src/lib/ai.ts` |
| **6. AI enrichment & tagging** | Implemented (Gemini Flash) | Implemented (via AI proxy) | Yes | **Full Parity** | `lib/ai/tag-memory.ts`<br>`app/api/v1/ai/route.ts`<br>`mobile/src/lib/ai.ts` |
| **7. AI / Semantic search** | Implemented (pgvector `match_memories`) | Partial (client-side text filter) | Yes | **Partial** | `lib/ai/search-memories.ts`<br>`mobile/src/screens/MemoriesScreen.tsx` |
| **8. Ask Your Life** | Implemented (Gemini RAG + sources) | Partial (Sources field mismatch) | Yes | **Partial** | `lib/ai/answer-question.ts`<br>`mobile/src/screens/AskScreen.tsx` |
| **9. Connected memories** | Implemented (Embedding + signals) | Implemented (Client rule-based) | Yes | **Behaves Differently** | `lib/ai/connected-memories.ts`<br>`mobile/src/lib/memories.ts` |
| **10. People directory & search** | Implemented | Implemented | Yes | **Full Parity** | `components/views/people.tsx`<br>`mobile/src/screens/PeopleScreen.tsx` |
| **11. Places directory & geography** | Implemented | Implemented | Yes | **Full Parity** | `components/views/places.tsx`<br>`mobile/src/screens/PlacesScreen.tsx` |
| **12. Rediscover prompts** | Implemented | Implemented | Yes | **Full Parity** | `components/views/rediscover.tsx`<br>`mobile/src/components/RediscoverModal.tsx` |
| **13. Past photo batch import** | Implemented (Quota: 50) | Implemented (Quota: 50) | Yes | **Full Parity** | `components/rediscover/rediscover-import-modal.tsx`<br>`mobile/src/components/RediscoverModal.tsx` |
| **14. EXIF & Historical dates** | Implemented | Implemented | Yes | **Full Parity** | `lib/photo-date-extractor.ts`<br>`mobile/src/lib/photo-date-extractor.ts` |
| **15. Date confidence indicators** | Implemented (`exact`/`inferred`/`unknown`) | Implemented (`exact`/`inferred`/`unknown`) | Yes | **Full Parity** | `lib/photo-date-extractor.ts`<br>`mobile/src/lib/photo-date-extractor.ts` |
| **16. Media handling & Audio** | Implemented (WebM, PDF, Images) | Implemented (M4A, PDF, Images) | Yes | **Full Parity** | `lib/memories.ts`<br>`mobile/src/lib/memories.ts` |
| **17. Shared Perspectives** | Implemented | Implemented | Yes | **Full Parity** | `components/memory/perspective-composer-modal.tsx`<br>`mobile/src/components/PerspectiveComposerModal.tsx` |
| **18. Notifications & Invites** | Implemented | Implemented | Yes | **Full Parity** | `components/notifications/notification-center.tsx`<br>`mobile/src/components/NotificationModal.tsx` |
| **19. Onboarding flow** | Implemented | Implemented | Yes | **Full Parity** | `components/auth/onboarding-modal.tsx`<br>`mobile/src/screens/OnboardingScreen.tsx` |
| **20. Authentication** | Implemented (Email + Google OAuth) | Implemented (Email + Google OAuth) | Yes | **Full Parity** | `components/auth/auth-form.tsx`<br>`mobile/src/screens/AuthScreen.tsx` |
| **21. Theme / Preferences** | Implemented (Dark/Light + local storage) | Implemented (Dark/Light in-memory) | N/A | **Full Parity** | `components/app-shell.tsx`<br>`mobile/App.tsx` |
| **22. Memory editing** | Implemented | Implemented | Yes | **Full Parity** | `components/memory/detail-modal.tsx`<br>`mobile/src/components/MemoryDetailModal.tsx` |
| **23. Memory deletion** | Implemented | Implemented | Yes | **Full Parity** | `app/memories/actions.ts`<br>`mobile/src/lib/memories.ts` |
| **24. Search & Tag filtering** | Implemented (Hybrid semantic + tags) | Implemented (Keyword + interactive tags) | Yes | **Full Parity** | `components/views/memories.tsx`<br>`mobile/src/screens/MemoriesScreen.tsx` |
| **25. Timeline & Pagination** | Implemented (Cursor pagination) | Implemented (Cursor pagination) | Yes | **Full Parity** | `components/views/timeline.tsx`<br>`mobile/src/screens/TimelineScreen.tsx` |
| **26. Mention Autocomplete** | Implemented (`@name`) | Implemented (`@name`) | Yes | **Full Parity** | `components/memory/mention-autocomplete.tsx`<br>`mobile/src/components/MentionAutocomplete.tsx` |
| **27. Feature Discovery Tips** | Implemented | Implemented | Yes | **Full Parity** | `components/shared/feature-tip.tsx`<br>`mobile/src/components/FeatureTip.tsx` |
| **28. Public Share Link View** | Implemented (`/share/[id]`) | Missing | Yes | **Missing on Mobile** | `app/share/[id]/page.tsx` |
| **29. PDF Optimization** | Implemented (`lib/pdf-optimizer.ts`) | Missing (Raw upload only) | N/A | **Missing on Mobile** | `lib/pdf-optimizer.ts` |

---

## C. FEATURES MISSING FROM EXPO

1. **Public / In-App Shared Memory View Link Handler (`/share/:id`)**:
   - Web has a dedicated public page (`app/share/[id]/page.tsx`) that displays the shared memory, its photos, and perspectives to external recipients.
   - Mobile deep linking only parses `#access_token` for OAuth. Opening a link like `thenvue://share/123` or `https://thenvue.com/share/123` is not yet intercepted to open the memory modal.

2. **Client-Side PDF Compression & Canvas Rendering**:
   - Web uses `pdf-lib` / `canvas` in `lib/pdf-optimizer.ts` to rasterize/compress PDFs before uploading.
   - Mobile attaches PDF files as raw binaries via `expo-document-picker` without client-side rendering/compression.

3. **Multi-Turn Conversation Memory in Ask Your Life**:
   - Web `lib/ai/answer-question.ts` accepts `ConversationTurn[]` history to enable multi-turn contextual dialog.
   - Mobile `AskScreen` currently operates as a single-turn Q&A without conversation history.

---

## D. FEATURES THAT EXIST BUT BEHAVE DIFFERENTLY

1. **Ask Your Life Response Sources Bug on Mobile**:
   - Backend endpoint (`POST /api/v1/ai`, `action: 'ask'`) calls `answerQuestion(...)` which returns `{ answer: string, sources: Memory[], query: string }`.
   - In `mobile/src/screens/AskScreen.tsx`, line 52:
     ```ts
     setResult({
       answer: res.answer,
       sourceMemories: res.sourceMemories || [],
     })
     ```
     Because the API returns `sources` instead of `sourceMemories`, `AskScreen` evaluates `sourceMemories` as empty and does not display the citation memory cards under the answer.

2. **AI / Semantic Memory Search vs Client Substring Search**:
   - **Web:** Typing in search bar debounces 250ms and calls `searchMemoriesAction` which computes the Gemini embedding of the search query and queries Supabase's pgvector index (`match_memories`), finding memories with semantic similarity even if the exact keyword is not present.
   - **Expo:** Search in `MemoriesScreen` and `TimelineScreen` filters strictly using JavaScript string `.includes()` on the memories already loaded into client memory.

3. **Connected Memories Computation**:
   - **Web:** Calls `findConnectedMemories` server-side, combining vector cosine distance with metadata matching across the user's entire database.
   - **Expo:** Calls `getConnectedMemories` locally in `mobile/src/lib/memories.ts`, comparing the target memory against the loaded memory array using rule-based heuristics (shared people, place, topic, same day in past years).

4. **Audio Format**:
   - **Web:** Records via `MediaRecorder` using `audio/webm`.
   - **Expo:** Records via `expo-av` using `audio/m4a`. (The Gemini backend transcription route handles both formats seamlessly).

5. **Theme Persistence**:
   - **Web:** Writes to `localStorage.setItem('memory_theme', 'dark' | 'light')`.
   - **Expo:** Stores theme in React state in `App.tsx` (defaults to dark; does not persist to `AsyncStorage` across cold restarts).

---

## E. FEATURES THAT NEED VERIFICATION

1. **`EXPO_PUBLIC_API_URL` in Production Mobile Builds**:
   - Mobile `mobile/src/lib/ai.ts` sets `const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'`.
   - In standalone iOS/Android EAS builds, if `EXPO_PUBLIC_API_URL` is not defined in `eas.json` or `.env`, all AI features (tagging, transcription, Ask My Life) will attempt to reach `localhost:3000` and fall back to silent mock/client placeholders.
   - *Verification Needed:* Ensure `EXPO_PUBLIC_API_URL` is set to the production Next.js deployment URL in `eas.json`.

2. **Google OAuth Redirect Scheme in Standalone App**:
   - On Web, Google OAuth redirects to `/auth/callback`.
   - On Mobile, `supabase.auth.signInWithOAuth` uses `thenvue://google-auth`.
   - *Verification Needed:* Ensure `thenvue` custom scheme is registered in Google Cloud Console OAuth redirect URIs for production mobile releases.

---

## F. RECOMMENDED ORDER TO BRING EXPO TO 100% PARITY

### Phase 1: Immediate Parity Fixes (Zero Schema Changes)
1. **Fix `AskScreen` Sources Rendering:**
   Update `mobile/src/screens/AskScreen.tsx` to read `res.sources || res.sourceMemories || []` so grounded memory citations appear immediately beneath AI answers.
2. **Hook up Semantic Search in Mobile `MemoriesScreen`:**
   Add debounced call to `/api/v1/memories/search?q=...` so Expo users benefit from vector embedding search just like the Web app.
3. **Persist Theme in `AsyncStorage`:**
   Save dark/light theme toggle in `AsyncStorage` on mobile so preferences survive app restarts.

### Phase 2: Configuration & Production Readiness
4. **Set Production `EXPO_PUBLIC_API_URL`:**
   Add `EXPO_PUBLIC_API_URL` pointing to the live Next.js domain in `mobile/.env` and `mobile/eas.json`.
5. **Multi-Turn History in `AskScreen`:**
   Store conversation turns in state so mobile users can ask follow-up questions about their memories.

### Phase 3: Advanced Mobile Polish
6. **Universal / Deep Link Share Routing:**
   Extend `Linking` listener in `mobile/App.tsx` to intercept `thenvue://share/:id` or shared memory URLs and open the memory directly in `MemoryDetailModal`.

---
*End of Audit Report.*
