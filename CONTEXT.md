# THENVUE (MEMORY) — SYSTEM ARCHITECTURE & CODEBASE CONTEXT

> **Target Audience:** AI Coding Assistants, LLM Agents, and Engineers working on the Thenvue codebase.  
> **Purpose:** Provide an exhaustive, authoritative single source of truth detailing system architecture, data models, AI integrations, API specifications, platform parity, conventions, and engineering workflows.

---

## 1. EXECUTIVE SUMMARY & PRODUCT VISION

**Thenvue** (internally and in code often referenced as **"Memory"**) is a modern, AI-first personal memory journaling and archival system designed for both Desktop/Mobile Web and native iOS/Android devices.

### Core Philosophy
Traditional journals force users into manual tagging, tedious categorization, and static chronological feeds. Thenvue turns personal notes, photos, and voice recordings into a living, interconnected personal archive:
- **Zero Friction Capture:** Multi-modal capture via rich text, camera photos, and voice notes with automatic background audio transcription.
- **Calendar-Anchored Chronology:** Every memory explicitly records a local calendar date (`occurred_on`) and local clock time (`occurred_time`), ensuring memories remain pinned to the actual day they happened regardless of client timezone shifts.
- **Automated AI Understanding:** Asynchronous enrichment via Google Gemini (`gemini-3.6-flash`) generates descriptive titles, mood classifications, memory types, summary overviews, and entity tags (`#topics`, `@people`, `📍places`).
- **Semantic & Vector Retrieval:** High-dimensional vector embeddings (`gemini-embedding-2`, 768 dimensions) stored in PostgreSQL via `pgvector` power natural language semantic search and related memory discovery.
- **"Ask Your Life" Personal AI:** A grounded conversational assistant that searches the user's personal memories and generates synthesis answers with strict citations to source moments.
- **Collaborative Perspectives:** Memories can be shared with other users who can contribute their own photos, voice notes, and perspective entries to the same moment.
- **Historical Rediscovery:** Batch photo import pipeline that parses EXIF metadata and filename patterns to cluster and resurrect past moments under an atomic quota system.

---

## 2. REPOSITORY ARCHITECTURE & DIRECTORY STRUCTURE

The workspace is organized into a primary project workspace containing the Next.js web application and the Expo mobile application:

```
c:\dev\Thenvue\
├── package.json               # Root workspace metadata
├── CONTEXT.md                 # System Context (this document)
└── memory_project/            # Main project directory
    ├── app/                   # Next.js 16 App Router
    │   ├── api/v1/            # REST API endpoints (memories, ai, search)
    │   ├── app/               # Authenticated web dashboard (/app)
    │   ├── auth/              # Auth callback routes
    │   ├── login/             # Login & registration views
    │   ├── memories/          # Memory actions & server functions
    │   ├── share/             # Public SSR memory share pages (/share/[id])
    │   ├── globals.css        # Core Tailwind CSS & design tokens
    │   ├── layout.tsx         # Root layout with fonts & providers
    │   └── proxy.ts           # Next.js 16 session proxy (replaces middleware.ts)
    ├── components/            # Web UI Component Hierarchy
    │   ├── app-shell.tsx      # Main application shell & tab coordinator
    │   ├── memory/            # Memory card, row, capture modal, detail modal
    │   ├── views/             # Main screen views (Home, Timeline, Memories, Ask, Rediscover, People, Places, You)
    │   ├── auth/              # Auth forms & onboarding modal
    │   ├── rediscover/        # Past photo batch import & cluster review modals
    │   ├── notifications/     # Notification drawer & participant invite modals
    │   └── ui/                # Reusable UI primitives (buttons, dialogs, inputs)
    ├── lib/                   # Shared Business Logic & Utilities
    │   ├── ai/                # Centralized Google Gemini AI client & prompts
    │   │   ├── provider.ts    # Single SDK gateway for @google/genai
    │   │   ├── tag-memory.ts  # Structured memory auto-tagging
    │   │   ├── embed-memory.ts# Vector embeddings generation (768-dim)
    │   │   ├── search-memories.ts # Hybrid semantic + metadata search
    │   │   ├── answer-question.ts # Ask Your Life RAG engine
    │   │   └── connected-memories.ts # Related memories graph calculator
    │   ├── supabase/          # Supabase client & server factories
    │   ├── memories.ts        # Memory serialization, formatting, signed URL generation
    │   ├── photo-date-extractor.ts # EXIF extraction & filename heuristic parser
    │   └── pdf-optimizer.ts   # Client-side PDF canvas rendering & compression
    ├── mobile/                # Native Cross-Platform App (Expo & React Native)
    │   ├── App.tsx            # Mobile Root Coordinator & Tab Navigation
    │   ├── app.json           # Expo project configuration, permissions & deep link schemes
    │   ├── eas.json           # EAS build profiles for Android (.apk) & iOS
    │   └── src/
    │       ├── screens/       # Native screens (Home, Timeline, Memories, Ask, People, Places, You, Auth, Onboarding)
    │       ├── components/    # Native components (CaptureModal, MemoryDetailModal, AudioPlayer, RediscoverModal)
    │       ├── lib/           # Mobile Supabase client, AI proxy client, and formatters
    │       └── types/         # Mobile TypeScript domain definitions
    ├── supabase/              # Database Schemas & Migrations
    │   ├── schema.sql         # Base database schema, RLS policies, vector extension
    │   ├── phase9_shared_memories_perspectives.sql # Perspectives & collaborations
    │   ├── phase10_rediscover_past_photos.sql      # Past import & quota pipeline
    │   └── fix_*.sql          # Patches for shared media access, user search, and RPCs
    └── types/                 # Universal TypeScript definitions (`memory.ts`)
```

---

## 3. TECHNOLOGY STACK & KEY DEPENDENCIES

### Web Application
- **Framework:** Next.js 16.3.0 (App Router, Server Actions, Server Components)
- **Runtime:** React 19.0.0, Node.js
- **Styling:** Tailwind CSS v4.3.3, `@tailwindcss/postcss`, PostCSS 8.5
- **UI Primitives:** `@base-ui/react` 1.5.0, `lucide-react` 1.16.0, `clsx`, `tailwind-merge`
- **PDF & Document Processing:** `pdfjs-dist` 6.2.108, `jspdf` 4.2.1
- **Database & Auth Client:** `@supabase/ssr` 0.5.2, `@supabase/supabase-js` 2.47.10

### Mobile Application
- **Framework:** Expo SDK 54 (`expo` ~54.0.0), React Native 0.81.5
- **Audio & Media:** `expo-av` (recording & playback), `expo-camera`, `expo-image-picker`, `expo-image-manipulator`
- **Sensors & System:** `expo-location` (GPS reverse geocoding), `expo-document-picker`, `expo-haptics`, `expo-linking`
- **Icons & Styling:** `lucide-react-native`, `expo-linear-gradient`, `react-native-svg`
- **Local Storage:** `@react-native-async-storage/async-storage` 2.2.0
- **Cloud Builds:** Expo Application Services (EAS Build)

### AI & Machine Learning Backend
- **SDK:** `@google/genai` 2.18.0 (The official Google Gen AI SDK)
- **Tagging & Understanding Model:** `gemini-3.6-flash`
- **Vector Embedding Model:** `gemini-embedding-2` (Output dimensionality configured to `768`)
- **Multimodal Transcription:** Gemini Flash audio input processing for WebM and M4A audio streams

### Database & Storage Infrastructure
- **Provider:** Supabase (PostgreSQL 15+)
- **Extensions:** `vector` (pgvector for cosine distance vector search)
- **Storage Buckets:**
  - `memory-photos` (Private bucket for images, 2MB file limit, signed URLs only)
  - `memory-audio` (Private bucket for voice recordings, 20MB file limit, signed URLs only)
- **Security:** Strict Row Level Security (RLS) on all tables and storage objects with `security invoker` and `security definer` helpers to eliminate recursive policy traps.

---

## 4. DATA ARCHITECTURE & DATABASE SCHEMA

### 4.1 Core Tables

#### `public.memories`
The central table for all journal entries and moments.
```sql
CREATE TABLE public.memories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users (id) DEFAULT auth.uid(),
  title            TEXT NOT NULL DEFAULT 'A new memory',
  body             TEXT NOT NULL,
  occurred_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  occurred_on      DATE NOT NULL DEFAULT current_date,        -- Local calendar date
  occurred_time    TIME NOT NULL DEFAULT localtime,           -- Local clock time
  place            TEXT NOT NULL DEFAULT '',
  people           TEXT[] NOT NULL DEFAULT '{}',
  topics           TEXT[] NOT NULL DEFAULT '{}',
  summary          TEXT NOT NULL DEFAULT '',                  -- AI generated overview
  memory_type      TEXT NOT NULL DEFAULT '',                  -- 'note' | 'moment' | 'story' | 'reflection'
  mood             TEXT NOT NULL DEFAULT '',                  -- 'Calm', 'Joyful', 'Reflective', etc.
  embedding        VECTOR(768),                               -- Cosine similarity vector
  source_memory_id UUID REFERENCES public.memories (id),      -- If derived from shared memory
  shared_context   TEXT DEFAULT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ                                -- Soft delete timestamp
);
```

#### `public.media`
Stores all binary assets (photos, audio files, attached documents) linked to memories or collaborative perspectives.
```sql
CREATE TABLE public.media (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id      UUID NOT NULL REFERENCES public.memories (id) ON DELETE CASCADE,
  perspective_id UUID REFERENCES public.memory_perspectives (id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users (id) DEFAULT auth.uid(),
  storage_path   TEXT NOT NULL,
  media_type     TEXT NOT NULL CHECK (media_type IN ('image', 'audio', 'document')),
  file_name      TEXT NOT NULL,
  file_size      BIGINT NOT NULL CHECK (file_size >= 0),
  source_type    TEXT NOT NULL DEFAULT 'memory_capture' 
                 CHECK (source_type IN ('memory_capture', 'past_import', 'shared_perspective')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (memory_id, storage_path)
);
```

#### `public.memory_participants` & `public.memory_perspectives`
Powers collaborative sharing of moments between users.
- `memory_participants`: Tracks invited collaborators, owner invitations, and invite status (`pending`, `accepted`, `declined`, `removed`, `left`).
- `memory_perspectives`: Allows collaborators to submit their own reflection, photos, and voice notes into a shared memory thread.

#### `public.notifications`
In-app notifications for memory invitations (`invitation`) and perspective contributions (`perspective_added`).

#### `public.profiles`
User metadata storing display names and onboarding completion status (`has_completed_onboarding`).

#### `public.memory_import_jobs`, `public.memory_clusters`, `public.imported_assets`
Manages the historical photo import pipeline ("Rediscover Your Past"):
- Atomic quota: Users can have up to 50 active past-import assets enforced server-side via `get_user_past_import_quota(p_user_id)`.
- Metadata extraction records `capturedAt`, GPS latitude/longitude, content hash, and date confidence (`exact`, `inferred`, `unknown`).

### 4.2 Key Stored Procedures & Vector RPC

- **`match_memories(query_embedding vector(768), match_threshold float, match_count int)`**:
  Executes cosine distance search against the active user's memories using pgvector's cosine operator (`<=>`) restricted by `user_id = auth.uid()` and `deleted_at IS NULL`.
- **`attach_photo_to_memory(...)` & `verify_memory_photo_eligibility(...)`**:
  Enforces same-day photo attachment rules using the client's local timezone.
- **`get_or_create_profile()` & `complete_onboarding()`**:
  Authoritative user state management for onboarding modals.

---

## 5. ARTIFICIAL INTELLIGENCE SUBSYSTEMS

All AI integrations are centralized strictly within `lib/ai/provider.ts`. No other module imports `@google/genai` directly.

### 5.1 Tagging & Structured Enrichment (`lib/ai/tag-memory.ts`)
When a user captures a memory, text is analyzed to infer:
1. **Title:** High-fidelity 4–7 word summary headline.
2. **Place:** Real-world location name if referenced in text.
3. **People:** Array of names detected or tagged with `@`.
4. **Topics:** Array of categorized thematic tags (`#nature`, `#work`, `#family`).
5. **Mood:** Dominant emotional state (`Joyful`, `Calm`, `Melancholic`, `Nostalgic`, `Excited`, `Grateful`).
6. **Memory Type:** Classifies entry as `note`, `moment`, `story`, or `reflection`.
7. **Summary:** 1–2 sentence essence of the memory.

*Rule:* If the user manually specifies place, people, or topics in the capture UI, the manual user input is preserved and overrides AI predictions.

### 5.2 Vector Embeddings (`lib/ai/embed-memory.ts`)
- Model: `gemini-embedding-2` configured with `outputDimensionality: 768`.
- Embedded content combines the title, body, place, people, topics, and AI summary into a unified context representation.
- Stored directly in `memories.embedding` and indexed with HNSW (`vector_cosine_ops`).

### 5.3 Semantic Search Engine (`lib/ai/search-memories.ts`)
Hybrid retrieval combining:
1. Vector similarity search via `match_memories` RPC (threshold 0.20–0.40).
2. Substring & metadata matching over text, tags, places, and participants.
3. Debounced query handling for instantaneous results.

### 5.4 "Ask Your Life" Conversational RAG (`lib/ai/answer-question.ts`)
Enables users to query their memory history in natural language (e.g., *"What did I do last summer in Kyoto?"* or *"When was the last time I felt completely peaceful?"*).
- **Retrieval Pipeline:** Fetches candidate memories using vector similarity + keyword scoring + temporal filters (`lib/ai/retrieval.ts`).
- **Grounding & Anti-Hallucination:** Gemini is prompted with strict grounding rules: it may only answer using retrieved memories, must acknowledge gaps if unrecorded, and outputs direct citation links (`sources`).

### 5.5 Multi-modal Voice Transcription (`lib/ai/provider.ts -> transcribeAudio`)
- Voice recordings captured in the browser (`audio/webm`) or mobile (`audio/m4a`) are submitted as base64 audio payloads directly to Gemini Flash.
- Gemini returns exact verbatim transcripts without conversational chatter or filler labels.

---

## 6. CLIENT CAPTURE & MEDIA SUBSYSTEM

### 6.1 Calendar Anchoring Mechanism
To prevent timezone conversion bugs common in standard `timestamptz` date pickers:
- Capture modals extract the client's local calendar date (`YYYY-MM-DD`) and clock time (`HH:MM`).
- Saved into database columns `occurred_on` (DATE) and `occurred_time` (TIME).
- Display formatting always renders the recorded calendar date regardless of the client machine's current timezone.

### 6.2 Storage & Media URLs
- **Zero Public Buckets:** Storage buckets are private. Files are stored at `<user-id>/<uuid>.<ext>`.
- **Signed URL Generation:** Server actions (`app/memories/actions.ts`) generate short-lived signed URLs (1 hour validity) when reading memories.
- Clients store storage paths, never hardcoded URLs.

### 6.3 Voice Memo Aesthetics
- Audio recording provides real-time duration timing.
- Interactive playback uses custom waveform visualizers with scrubbing, play/pause, and duration indicators.

---

## 7. WEB vs EXPO MOBILE PARITY & ARCHITECTURE

The web and mobile applications share the same Supabase database and authentication.

### Direct Supabase vs AI Proxy Pattern
- **Direct Supabase Operations:** Both Web and Mobile authenticate with Supabase and perform CRUD queries directly against PostgreSQL respecting RLS.
- **Mobile AI Proxying:** Because the mobile client runs in a React Native client sandbox, it does not embed server secrets (`GEMINI_API_KEY`). Instead, Mobile calls the Next.js backend proxy:
  ```
  POST /api/v1/ai
  Authorization: Bearer <supabase_access_token>
  Body: { action: 'tag' | 'embed' | 'ask' | 'transcribe', ...payload }
  ```
- **Semantic Search Endpoint:**
  ```
  GET /api/v1/memories/search?q=<query>&limit=20&threshold=0.2
  Authorization: Bearer <supabase_access_token>
  ```

### Mobile Deep Linking
Configured in `app.json` for custom scheme `thenvue://` and universal links for `https://thenvue.com/share/*` and OAuth callback `thenvue://google-auth`.

---

## 8. ENVIRONMENT CONFIGURATION

### Web Application (`memory_project/.env.local`)
| Variable | Description | Example / Format |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Anon Key | `sb_publishable_...` |
| `GEMINI_API_KEY` | Google Gemini API Secret Key | `AIzaSy...` |
| `GEMINI_TAG_MODEL` | Model for tagging & Q&A | `gemini-3.6-flash` |
| `GEMINI_EMBEDDING_MODEL` | Model for vector embeddings | `gemini-embedding-2` |
| `ANDROID_SHA256_FINGERPRINT` | Digital Asset Links fingerprint | `88:3E:...` |

### Mobile Application (`memory_project/mobile/.env` & `eas.json`)
| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Anon Key |
| `EXPO_PUBLIC_API_URL` | Base URL of Next.js deployment (e.g. `https://thenvue.com` or LAN IP `http://192.168.1.36:3000` for local dev) |

---

## 9. COMMANDS & DEVELOPMENT WORKFLOWS

### Running the Web Application
```powershell
cd c:\dev\Thenvue\memory_project
npm run dev
# Server boots at http://localhost:3000
```

### Typechecking Web Application
```powershell
cd c:\dev\Thenvue\memory_project
npm run typecheck
```

### Running the Mobile Application (Expo)
```powershell
cd c:\dev\Thenvue\memory_project\mobile
npx expo start
# Scan QR code with Expo Go on iOS / Android
```

### Building Standalone Android APK (EAS Cloud Build)
```powershell
cd c:\dev\Thenvue\memory_project\mobile
$env:EAS_NO_VCS="1"; npx eas-cli build -p android --profile preview
```

---

## 10. CRITICAL ENGINEERING RULES & CONVENTIONS FOR AI AGENTS

1. **Next.js 16 Proxy Convention:**
   - Next.js 16 uses `proxy.ts` (not `middleware.ts`) to handle session refresh and route protection. Do NOT rename `proxy.ts` to `middleware.ts`.
2. **Centralized AI Access:**
   - Never import `@google/genai` in component files or generic API routes. Always add or invoke methods from `lib/ai/provider.ts` and its helper modules.
3. **Preserve Calendar Date Truth:**
   - Always persist `occurred_on` (`YYYY-MM-DD`) and `occurred_time` (`HH:MM`). Never convert user capture dates to UTC and back; keep the local calendar date intact.
4. **Private Storage URLs:**
   - Never save signed URLs directly to database columns. Store storage paths (`<user-id>/<filename>`) in `media.storage_path`. Generate signed URLs on retrieval.
5. **RLS Recursion Guard:**
   - When modifying policies on `memories`, `memory_participants`, or `memory_perspectives`, use `security definer` functions (such as `is_memory_participant` or `is_memory_owner`) to prevent PostgreSQL infinite recursive policy loops.
6. **Mobile Field Mappings:**
   - `askMyLife` response returns `{ query, answer, sources }`. Ensure mobile components consume `sources` (or check fallback `sourceMemories`) to prevent missing citation cards.
7. **Character Limits:**
   - Maximum memory length is 12,000 characters (enforced via `MAX_MEMORY_CHARS` in `lib/memories.ts`).
8. **Dark/Light Theme Styling:**
   - Maintain the editorial, warm, luxury dark and light theme tokens defined in `globals.css` and mobile `theme/colors.ts`. Avoid default unstyled browser elements.
