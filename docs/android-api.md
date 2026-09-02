# Android integration

The Android app should authenticate with Supabase, then send its access token in
`Authorization: Bearer <access-token>` when calling the API below. The same row
level-security policies protect browser and Android requests.

## List memories

`GET /api/v1/memories`

Returns `{ "memories": Memory[] }` for the authenticated user.

## Create a memory

`POST /api/v1/memories`

```json
{
  "text": "Watched the rain from the train home.",
  "capturedAt": { "date": "2026-08-24", "time": "19:42" },
  "place": "Mumbai",
  "people": ["Aditi"],
  "topics": ["small joys", "commute"],
  "mood": "Calm",
  "imagePaths": []
}
```

`place`, `people`, `topics`, and `mood` are all optional. Any field you omit
(or send empty) is filled in automatically by AI analysis of `text` --
`summary` and `memory_type` are always AI-generated and can't be set by the
client. If you do send a value for `place`/`people`/`topics`/`mood`, it's
used as-is and the AI's guess for that field is discarded.

`capturedAt` is deliberately a local calendar date and clock time, rather than
an inferred server time. This keeps a memory on the day it was captured across
devices and time zones. Photos are uploaded to the authenticated user’s folder
in the private `memory-photos` Supabase bucket before their paths (for example,
`<user-id>/<uuid>.jpg`) are submitted. API response image URLs are signed and
short-lived; store paths locally, not response URLs.
