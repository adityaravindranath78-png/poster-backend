# Poster & Status Maker App

## What This Is
A hybrid of Crafto (120M+ downloads, auto-personalize status maker) and Poster Maker by Technozer (10M+ downloads, full canvas editor). Two modes in one app:
- **Quick Mode:** Browse template → auto-fill name/photo/logo/phone → share in 5 seconds
- **Edit Mode:** Same template opens in drag-and-drop canvas editor for full customization

## Tech Stack
- **App:** React Native (TypeScript) + Zustand + React Navigation
- **Canvas:** fabric.js in WebView
- **Auth:** Firebase (Phone OTP + Google sign-in) — Firebase Admin SDK for backend token verification
- **API:** Node.js/Express (TypeScript) — `src/`
- **DB:** DynamoDB (single-table design)
- **Storage:** S3 + CloudFront CDN
- **Payments:** Razorpay (create order → checkout → verify signature → activate subscription)
- **Push:** Firebase Cloud Messaging (FCM)
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
App.tsx                   # Entry — Firebase auth, FCM notifications, navigation
index.js                  # RN entry + FCM background handler
src/
  navigation/             # RootNavigator (auth gate + tabs), types
  screens/
    auth/                 # LoginScreen, OtpVerifyScreen
    home/                 # HomeScreen, CategoryScreen, TemplatePreviewScreen
    editor/               # EditorScreen (fabric.js WebView — WORKING)
    profile/              # ProfileScreen, SubscriptionScreen (Razorpay checkout)
    settings/             # SettingsScreen
  canvas/                 # editorHtml.ts — fabric.js HTML engine with RN bridge
  theme/                  # Design system: colors, typography, spacing, animations
  components/             # Button, Input, HapticPressable, SkeletonLoader, FadeIn, BottomSheet, etc.
  store/                  # Zustand: auth, user, template, editor, subscription
  services/               # api, auth, templates, user, subscription (Razorpay), storage, notifications (FCM)
  utils/                  # constants, helpers, templateEngine (auto-fill)
  types/                  # template, user, api
android/                  # Native Android (google-services.json included)
ios/                      # Native iOS (GoogleService-Info.plist included)
```

### poster-backend (Express + Admin + Infra)
```
src/
  index.ts                # Express entry point (port 3000)
  config/                 # env (zod), dynamodb, s3, firebase admin, razorpay
  middleware/              # auth (Firebase JWT verify + dev bypass), errorHandler, rateLimiter
  routes/                 # user (profile + FCM token), templates, upload, subscription (Razorpay)
  services/               # userService, templateService, s3Service, subscriptionService
  types/                  # shared types
  utils/                  # response helpers
admin/                    # Next.js admin panel (template upload + management)
infra/                    # setup.sh, teardown.sh, seed-templates.sh
templates/                # 8 seed template JSONs
scripts/                  # generate-assets.mjs (placeholder image generator)
firebase-service-account.json  # Firebase Admin SDK creds (gitignored)
```

## AWS Infrastructure (PROVISIONED & LIVE)
- **DynamoDB:** `poster-app` table (PK/SK) with GSIs: `category-language-index`, `scheduled-date-index`. PITR enabled.
- **S3:** `poster-app-assets-techveda` (versioning, public access blocked, CORS for GET+PUT)
  - 8 background images, 8 thumbnails, 4 stickers uploaded
- **CloudFront:** `dklcr2on9ks6p.cloudfront.net` with OAC (no public S3 URLs)
- **Region:** ap-south-1

## API Endpoints
```
GET    /health                              # Health check
GET    /api/v1/templates                    # List templates (query: category, language, limit, nextKey)
GET    /api/v1/templates/daily              # Daily scheduled templates (query: language)
GET    /api/v1/templates/search             # Search templates (query: q, limit)
GET    /api/v1/templates/:id                # Get single template
GET    /api/v1/user/profile                 # Get user profile [auth]
PUT    /api/v1/user/profile                 # Update user profile [auth]
POST   /api/v1/user/fcm-token              # Register FCM push token [auth]
POST   /api/v1/upload/presigned-url         # Get S3 presigned upload URL [auth]
GET    /api/v1/subscription/status          # Get subscription status [auth]
POST   /api/v1/subscription/create-order    # Create Razorpay order [auth]
POST   /api/v1/subscription/verify          # Verify payment + activate subscription [auth]
```

## Current Status

### Done
- [x] RN scaffold + navigation (auth stack, main tabs, home stack, profile stack)
- [x] Firebase Auth setup (Phone OTP + Google sign-in) — both providers enabled
- [x] All screens rebuilt with premium design system (reanimated springs, haptics, skeletons, glassmorphism)
- [x] Zustand stores (auth, user, template, editor, subscription) with AsyncStorage persistence
- [x] Services layer (api with JWT interceptor, auth, templates, user, storage, subscription)
- [x] Template engine (auto-fill placeholders with user profile)
- [x] Express backend API — all routes built and tested
- [x] Firebase Admin SDK configured with service account — production auth verification working
- [x] AWS infrastructure provisioned (DynamoDB, S3, CloudFront)
- [x] 8 templates seeded to DynamoDB + S3 with placeholder assets (backgrounds, thumbnails, stickers)
- [x] fabric.js canvas editor — load template, edit text, add text, delete, undo/redo, export PNG
- [x] Quick Mode rendering (auto-fill + export from TemplatePreviewScreen via hidden WebView)
- [x] Download to device (RNFS writeFile from canvas export)
- [x] Razorpay payment integration — create order, checkout, verify signature, activate subscription
- [x] FCM push notifications — permission request, token registration, foreground/background handlers
- [x] Admin panel (Next.js — template list, upload with category/language/tags)
- [x] App running on Android physical device

### Next Up
- [ ] Add Razorpay test keys to .env and test payment flow on device
- [ ] Test full end-to-end flow on device (auth → browse → preview → download → edit → share)
- [ ] Replace placeholder gradient backgrounds with actual designed template images
- [ ] iOS pod install + test on iOS
- [ ] Video export (FFmpeg Lambda or on-device)
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

# Android device
adb reverse tcp:3000 tcp:3000
npx react-native run-android
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
- Razorpay: create order on backend, checkout on frontend, verify on backend (never trust client)
