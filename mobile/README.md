# 📱 Memory Mobile (React Native & Expo)

A beautiful, production-ready cross-platform mobile application for **Memory**, built with **React Native**, **Expo**, **Supabase Auth & Storage**, and **Google Gemini AI**.

---

## ✨ Mobile Features

1. **🔒 Supabase Auth**: Secure email/password login & registration with persistent native storage.
2. **🏠 Home View**:
   - Daily greeting & current date.
   - Quick Actions: **Write**, **Speak (Voice Memory)**, **Camera (Photo Snap)**, **Photos**.
   - Deterministic **Rediscover** card (*"1 year ago today"*, *"Around this time last year"*).
   - Recent memories feed.
3. **📅 Timeline**:
   - Monthly grouped memory feed with timestamps and photo thumbnails.
   - Filter pills: **All**, **Photos**, **Places**, **People**.
4. **🔍 Memories & Semantic Search**:
   - Instant search across all memories matching text, topics, people, and places.
5. **✨ Ask My Life (AI)**:
   - Natural language question answering grounded in your personal memory archive using Gemini AI.
   - Source citations linking to the original memories.
6. **🎙️ Native Voice Recording**:
   - In-app microphone recording (`expo-av`) with live timer, waveform review, and automatic server-side Gemini transcription.
7. **📷 Native Camera & Photos**:
   - Take photos with the device camera or select from photo library (`expo-image-picker`).
8. **🎵 Custom Audio Player**:
   - Native audio playback with play/pause, time scrubber, and duration.
9. **🔗 Connected Memories**:
   - Multi-signal memory connections (*"Shared person"*, *"Same place"*, *"Related topic"*, *"Time pattern"*).
10. **🌓 Luxury Dark & Light Themes**:
    - Tailored palette matching the desktop web app with instant toggle.

---

## 🚀 How to Run on your Phone in 2 Minutes

### 1. Install Dependencies
Open a terminal in the `mobile` folder:
```bash
cd mobile
npm install
```

### 2. Start the Expo Development Server
```bash
npx expo start
```

### 3. Open on your Physical Phone
1. Install **Expo Go** from the App Store (iOS) or Google Play Store (Android).
2. **iOS**: Open your iPhone camera and scan the QR code displayed in the terminal.
3. **Android**: Open the **Expo Go** app and tap **"Scan QR code"**.

The application will load on your phone with live reload enabled!

---

## 📦 Generating a Standalone Android APK

To generate an installable `.apk` file for Android on Windows:

1. In PowerShell, run:
```powershell
$env:EAS_NO_VCS="1"; npx eas-cli build -p android --profile preview
```
2. Log into your Expo account when prompted.
3. EAS will compile the Android `.apk` in the cloud and provide a direct download link and QR code to install it on your phone!
