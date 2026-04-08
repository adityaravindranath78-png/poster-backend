# Poster & Status Maker App

## What This Is
A hybrid of Crafto (120M+ downloads, auto-personalize status maker) and Poster Maker by Technozer (10M+ downloads, full canvas editor). Two modes in one app:
- **Quick Mode:** Browse template → auto-fill name/photo/logo/phone → share in 5 seconds
- **Edit Mode:** Same template opens in drag-and-drop canvas editor for full customization

## Tech Stack
- **App:** React Native (TypeScript) + Zustand + React Navigation
- **Canvas:** fabric.js in WebView (MVP), react-native-skia migration later
- **Auth:** AWS Cognito (phone OTP + Google)
- **API:** Node.js/Express on EC2
- **DB:** DynamoDB
- **Storage:** S3 + CloudFront
- **Image/Video Processing:** Lambda + Sharp + FFmpeg
- **Payments:** Razorpay + Google Play Billing
- **Push:** FCM via SNS
- **Admin:** Next.js web app

## Key Architecture
Templates are JSON schemas with layered structure (not flat images). Each template defines background, text layers, placeholder tokens (user_photo, user_name, phone, logo), and stickers. Quick Mode fills placeholders automatically. Edit Mode loads same JSON into fabric.js as editable layers.

See `PROJECT_BRIEF.md` for full template JSON schema, DynamoDB schema, architecture diagrams, feature breakdown, timeline, and pricing.

## Project Structure
```
poster-app/
  PROJECT_BRIEF.md        # Full project brief, research, architecture
  CLAUDE.md               # This file (living doc — updated as we build)
  app/                    # React Native app (RN 0.84.1, TypeScript)
  backend/                # Express API (TypeScript)
  admin/                  # Next.js admin panel
  infra/                  # AWS setup/teardown/seed scripts
  templates/              # 8 seed template JSONs
```

## Current Status

### Done
- [x] RN scaffold + navigation (auth stack, main tabs, home stack, profile stack)
- [x] Firebase Auth setup (Phone OTP + Google sign-in) — both providers enabled
- [x] Firebase config files placed (`google-services.json`, `GoogleService-Info.plist`)
- [x] Web client ID wired into `App.tsx`
- [x] Zustand stores (auth, user, template, editor, subscription)
- [x] Services layer (api with JWT interceptor, auth, templates, user, storage, subscription)
- [x] All screens (Login, OTP, Home, Category, TemplatePreview, Editor, Profile, Subscription, Settings)
- [x] Components (TemplateCard, WatermarkOverlay, LoadingState, ErrorState, PaywallModal, ProfileForm)
- [x] Template engine (auto-fill placeholders with user profile)
- [x] Express backend (routes, middleware, DynamoDB/S3 services, Firebase Admin auth)
- [x] Admin panel (Next.js — template list, upload, API route)
- [x] AWS infra scripts (setup.sh, teardown.sh, seed-templates.sh)
- [x] 8 seed templates (good_morning, good_night, diwali, devotional, shayari, motivational, birthday, business_sale)
- [x] Dependencies installed (app + backend + iOS pods)
- [x] Google Services Gradle plugin configured
- [x] Android debug build successful — app runs on physical device
- [x] Metro bundler connects and loads JS bundle

### In Progress
- [ ] Test auth flow end-to-end

### Not Started
- [ ] Run AWS infra setup
- [ ] Connect app to backend
- [ ] Template browsing + Quick Mode rendering
- [ ] Download + share functionality
- [ ] Canvas editor (fabric.js WebView)
- [ ] Razorpay payment integration
- [ ] Push notifications (FCM)
- [ ] Production build + store submission

## Build Order
1. ~~RN scaffold + auth + navigation + stores~~ DONE
2. ~~Backend API + DynamoDB + S3/CDN~~ DONE
3. ~~Template system (JSON schema + auto-fill engine)~~ DONE
4. Home/browse UI + Quick Mode renderer
5. Download + share + paywall
6. Canvas editor (fabric.js WebView)
7. Admin panel + push notifications

## Conventions
- TypeScript strict mode everywhere
- Zustand for state (no Redux, no Context for global state)
- Axios with Cognito JWT interceptor
- Feature folders: `src/screens/`, `src/components/`, `src/store/`, `src/services/`, `src/utils/`
- DynamoDB single-table design
- All assets via CloudFront (never S3 direct)
- Images compressed to WebP before upload
- Environment variables in .env, never hardcoded
