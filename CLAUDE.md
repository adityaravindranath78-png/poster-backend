# Poster & Status Maker App

## What This Is
A hybrid of Crafto (120M+ downloads, auto-personalize status maker) and Poster Maker by Technozer (10M+ downloads, full canvas editor). Two modes in one app:
- **Quick Mode:** Browse template → auto-fill name/photo/logo/phone → share in 5 seconds
- **Edit Mode:** Same template opens in drag-and-drop canvas editor for full customization

## Tech Stack
- **App:** React Native (TypeScript) + Zustand + React Navigation
- **Canvas:** fabric.js in WebView (MVP), react-native-skia migration later
- **Auth:** Firebase (Phone OTP + Google sign-in)
- **API:** Node.js/Express (TypeScript) — `src/`
- **DB:** DynamoDB (single-table design)
- **Storage:** S3 + CloudFront CDN
- **Image/Video Processing:** Lambda + Sharp + FFmpeg (planned)
- **Payments:** Razorpay + Google Play Billing (planned)
- **Push:** FCM via SNS (planned)
- **Admin:** Next.js web app — `admin/`

## Key Architecture
Templates are JSON schemas with layered structure (not flat images). Each template defines background, text layers, placeholder tokens (user_photo, user_name, phone, logo), and stickers. Quick Mode fills placeholders automatically. Edit Mode loads same JSON into fabric.js as editable layers.

See `PROJECT_BRIEF.md` for full template JSON schema, DynamoDB schema, architecture diagrams, feature breakdown, timeline, and pricing.

## Repos & Local Structure
```
GitHub: adityaravindranath78-png/poster-frontend   (private)
GitHub: adityaravindranath78-png/poster-backend     (private)
Collaborator: Vinay-Gurjar (admin on both)

Local:
  /Users/adityar/projects/freelancing/poster-frontend/   # React Native app
  /Users/adityar/projects/freelancing/poster-backend/     # Express API + admin + infra + templates
```

### poster-frontend (React Native app)
```
App.tsx                   # Entry — Firebase auth listener, navigation
src/
  navigation/             # RootNavigator (auth gate + tabs), types
  screens/
    auth/                 # LoginScreen, OtpVerifyScreen
    home/                 # HomeScreen, CategoryScreen, TemplatePreviewScreen
    editor/               # EditorScreen (fabric.js WebView — WORKING)
    profile/              # ProfileScreen, SubscriptionScreen
    settings/             # SettingsScreen
  canvas/                 # editorHtml.ts — fabric.js HTML engine
  theme/                  # Design system: colors, typography, spacing, animations
  components/             # Base: Button, Input, HapticPressable, SkeletonLoader, FadeIn, BottomSheet + app components
  store/                  # Zustand: auth, user, template, editor, subscription
  services/               # api (Axios+JWT), auth, templates, user, subscription, storage
  utils/                  # constants, helpers, templateEngine (auto-fill)
  types/                  # template, user, api
android/                  # Native Android (google-services.json included)
ios/                      # Native iOS (GoogleService-Info.plist included)
```

### poster-backend (Express + Admin + Infra)
```
src/
  index.ts                # Express entry point (port 3000)
  config/                 # env (zod), dynamodb, s3, firebase admin
  middleware/              # auth (Firebase JWT + dev bypass), errorHandler, rateLimiter
  routes/                 # user, templates, upload, subscription
  services/               # userService, templateService, s3Service
  types/                  # shared types
  utils/                  # response helpers
admin/                    # Next.js admin panel (template upload + management)
infra/                    # setup.sh, teardown.sh, seed-templates.sh
templates/                # 8 seed template JSONs
```

## AWS Infrastructure (PROVISIONED)
- **DynamoDB:** `poster-app` table (PK/SK) with GSIs: `category-language-index`, `scheduled-date-index`. PITR enabled.
- **S3:** `poster-app-assets-techveda` (versioning, public access blocked, CORS for GET+PUT)
- **CloudFront:** `dklcr2on9ks6p.cloudfront.net` with OAC (no public S3 URLs)
- **Region:** ap-south-1

## API Endpoints
```
GET    /health                          # Health check
GET    /api/v1/templates                # List templates (query: category, language, limit, nextKey)
GET    /api/v1/templates/daily          # Daily scheduled templates (query: language)
GET    /api/v1/templates/search         # Search templates (query: q, limit)
GET    /api/v1/templates/:id            # Get single template
GET    /api/v1/user/profile             # Get user profile [auth]
PUT    /api/v1/user/profile             # Update user profile [auth]
POST   /api/v1/upload/presigned-url     # Get S3 presigned upload URL [auth]
GET    /api/v1/subscription/status      # Get subscription status [auth]
```

## Current Status

### Done
- [x] RN scaffold + navigation (auth stack, main tabs, home stack, profile stack)
- [x] Firebase Auth setup (Phone OTP + Google sign-in)
- [x] All screens rebuilt with premium design system (animations, haptics, skeletons)
- [x] Zustand stores (auth, user, template, editor, subscription)
- [x] Services layer (api with JWT interceptor, auth, templates, user, storage, subscription)
- [x] Template engine (auto-fill placeholders with user profile)
- [x] **Express backend API — FULLY BUILT AND TESTED**
- [x] **AWS infrastructure provisioned (DynamoDB, S3, CloudFront)**
- [x] **8 templates seeded to DynamoDB + S3**
- [x] **fabric.js canvas editor — WORKING (load template, edit, add text, undo/redo, export PNG)**
- [x] **Quick Mode rendering (auto-fill + export from TemplatePreviewScreen)**
- [x] **Download to device (RNFS writeFile from canvas export)**
- [x] Admin panel (Next.js — template list, upload, API route)
- [x] App running on Android physical device
- [x] Dev auth bypass for local testing without Firebase Admin creds

### Next Up
- [ ] Get Firebase Admin service account JSON for production auth verification
- [ ] Upload actual template background images/thumbnails to S3
- [ ] Test full end-to-end flow on device (browse → preview → download → edit)
- [ ] Razorpay payment integration
- [ ] Push notifications (FCM)
- [ ] Production build + store submission

## Running Locally
```bash
# Backend
cd poster-backend
npm install
npm run dev                    # Starts Express on port 3000

# Frontend (separate terminal)
cd poster-frontend
npm start                      # Metro bundler
npx react-native run-android   # Or: adb reverse tcp:3000 tcp:3000 first
```

## Conventions
- TypeScript strict mode everywhere
- Zustand for state (no Redux, no Context for global state)
- Axios with Firebase JWT interceptor
- Feature folders: `src/screens/`, `src/components/`, `src/store/`, `src/services/`, `src/utils/`
- DynamoDB single-table design
- All assets via CloudFront (never S3 direct)
- Images compressed to WebP before upload
- Environment variables in .env, never hardcoded
