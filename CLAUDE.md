# Poster & Status Maker App

## What This Is
A hybrid of Crafto (120M+ downloads, auto-personalize status maker) and Poster Maker by Technozer (10M+ downloads, full canvas editor). Two modes in one app:
- **Quick Mode:** Browse template → auto-fill name/photo/logo/phone → share in 5 seconds
- **Edit Mode:** Same template opens in drag-and-drop canvas editor for full customization

## Tech Stack
- **App:** React Native (TypeScript) + Zustand + React Navigation
- **Canvas:** fabric.js in WebView (MVP), react-native-skia migration later
- **Auth:** Firebase (Phone OTP + Google sign-in)
- **API:** Node.js/Express on EC2
- **DB:** DynamoDB
- **Storage:** S3 + CloudFront
- **Image/Video Processing:** Lambda + Sharp + FFmpeg
- **Payments:** Razorpay + Google Play Billing (day 2)
- **Push:** FCM via SNS
- **Admin:** Next.js web app

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
    editor/               # EditorScreen (fabric.js WebView)
    profile/              # ProfileScreen, SubscriptionScreen
    settings/             # SettingsScreen
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
  config/                 # env (zod), dynamodb, s3, firebase admin
  middleware/              # auth (Firebase JWT), errorHandler, rateLimiter
  routes/                 # user, templates, upload, subscription
  services/               # userService, templateService, s3Service
  types/                  # shared types
  utils/                  # response helpers
admin/                    # Next.js admin panel (template upload + management)
infra/                    # setup.sh, teardown.sh, seed-templates.sh
templates/                # 8 seed template JSONs
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
- [x] Repos split: poster-frontend + poster-backend (GitHub, private)
- [x] Vinay-Gurjar added as admin collaborator on both repos
- [x] Design system foundation (color tokens, typography, spacing, radii, shadows)
- [x] Animation primitives (5 spring configs, timing presets, press scales)
- [x] Base components: HapticPressable, Button (gradient), Input (animated border), SkeletonLoader, FadeIn, BottomSheet
- [x] Deps: react-native-reanimated, gesture-handler, haptic-feedback, linear-gradient, blur

### Next Up
- [ ] Rebuild LoginScreen + OtpVerifyScreen with design system (god-tier polish)
- [ ] Run AWS infra setup (DynamoDB, S3, CloudFront)
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
- Axios with Firebase JWT interceptor
- Feature folders: `src/screens/`, `src/components/`, `src/store/`, `src/services/`, `src/utils/`
- DynamoDB single-table design
- All assets via CloudFront (never S3 direct)
- Images compressed to WebP before upload
- Environment variables in .env, never hardcoded
