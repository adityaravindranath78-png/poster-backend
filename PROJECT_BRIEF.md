# Poster & Status Maker App — Project Brief

> Crafto's auto-personalization speed + Poster Maker's full canvas editor in one app.

---

## 1. Concept

A hybrid mobile app combining two proven models:

- **Quick Mode (Crafto-style):** Browse templates by category, auto-fill user's name/photo/logo/phone, download and share in 5 seconds.
- **Edit Mode (Poster Maker-style):** Open the same template in a full drag-and-drop canvas editor — customize text, fonts, stickers, images, backgrounds — then export.

### Why This Wins

| Pain Point | Crafto | Poster Maker | This App |
|---|---|---|---|
| Rigid templates, can't edit text | Yes | No | Solved — full editor |
| Must build from scratch every time | No | Yes | Solved — auto-fill first |
| Subscription traps, hard cancellation | Yes | Yes | Transparent billing |
| Forced onboarding | Yes | No | Guest preview mode |

---

## 2. Reference Apps

### Crafto (com.crafto.android)
- 120M+ downloads, 4.6 rating, 651K+ reviews
- Developer: Primetrace Technologies (Kutumb App), Bengaluru
- Backed by: Tiger Global, Sequoia Surge, Better Capital, Whiteboard Capital
- Pricing: Freemium — Rs.99/mo to Rs.6,900/year
- Core: Daily status/greeting content — quotes, shayari, festivals, devotional — personalized with name + photo, shared to WhatsApp/Instagram

### Poster Maker (app.poster.maker.postermaker.flyer.designer)
- 10M+ downloads, 4.3 rating, 114K reviews
- Developer: Technozer Solution
- Core: Full canvas design tool — 50,000+ templates, drag-and-drop editor, text/fonts/stickers/images, export PNG/JPG/PDF
- Monetization: Ads + rewarded ads + premium subscription

---

## 3. Target Market

**Primary:** Indian mass market users sharing daily content on WhatsApp, Instagram, Facebook.

**Segments:**
- Everyday users — good morning/night messages, festival greetings, devotional content
- Local influencers / politicians — personal branding with name + photo + contact on daily posts
- Small business owners — promotional posters, festival offers, business frames with logo
- Content creators — custom social media posts with full editing control

**Languages:** Hindi, English, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam

---

## 4. Core User Flow

```
Open App
  |
  v
Browse Templates (categories, trending, daily, festivals)
  |
  v
Select Template
  |
  v
Auto-Personalize (name + photo + logo + phone applied instantly)
  |
  +---> [QUICK MODE] Preview --> Download / Share to WhatsApp/Instagram/FB
  |
  +---> [EDIT MODE] Open Canvas Editor
              |
              v
         Customize (drag elements, edit text, change fonts,
                    add stickers, swap background, adjust layers)
              |
              v
         Export (PNG / JPG / PDF / Video)
              |
              v
         Download / Share
```

---

## 5. Features Breakdown

### Phase 1 — Quick Mode MVP (Week 1, Days 1-4)

| Feature | Details |
|---|---|
| Auth | Phone OTP + Google sign-in (Cognito) |
| User Profile | Name, photo, business name, logo, phone — set once, applied everywhere |
| Home Feed | Categories, trending, daily, festival calendar |
| Template Browsing | Category filter, search, language filter |
| Auto-Personalization | Read template JSON → fill placeholders with user profile → render composite |
| Preview & Download | High-res image saved to gallery |
| Share | Deep links to WhatsApp Status, Instagram Stories, Facebook |
| Paywall | Free tier (watermark) vs Premium (no watermark, all templates). Razorpay + Play Billing |

### Phase 2 — Canvas Editor (Week 1, Days 5-7)

| Feature | Details |
|---|---|
| Canvas Engine | fabric.js in WebView, bidirectional bridge to React Native |
| Text Tools | Add/edit text, 200+ fonts (Latin + Devanagari), color, size, spacing, shadow, alignment |
| Image Tools | Add photos from gallery, crop, filters, opacity, border |
| Stickers | Searchable library (shapes, emojis, seasonal, decorative), drag to canvas |
| Backgrounds | Color picker, gradients, image library, blur |
| Layer Management | Z-index reorder, lock, hide, duplicate, delete |
| Undo / Redo | Full state history stack |
| Export | PNG, JPG, PDF at multiple resolutions (social media + print) |

### Phase 3 — Content & Growth (Week 2)

| Feature | Details |
|---|---|
| Admin Panel | Next.js CMS — upload templates, manage categories, schedule content, festival calendar |
| Multi-Language | 8 Indian languages for both UI and content |
| Push Notifications | Daily reminders, festival alerts (FCM via SNS) |
| Rewarded Ads | Watch 30s ad to unlock one premium template (AdMob) |
| Favorites | Save templates, view history of created designs |

### Phase 4 — Video & Scale (Week 2-3)

| Feature | Details |
|---|---|
| Video Export | Text animations (fade-in, slide), background pan/zoom, music overlay |
| AI Features | Background removal, AI text suggestions |
| Business Frames | Custom branded template builder for businesses |
| Performance | Image caching (FastImage), lazy loading, offline template cache |

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native (TypeScript) |
| State Management | Zustand |
| Navigation | React Navigation |
| Canvas Editor | fabric.js in WebView (MVP) — migrate to react-native-skia later |
| Auth | AWS Cognito (phone OTP + Google) |
| API Server | Node.js / Express on EC2 |
| Database | DynamoDB |
| File Storage | S3 + CloudFront CDN |
| Image Processing | AWS Lambda + Sharp (compositing) |
| Video Processing | AWS Lambda + FFmpeg |
| Payments | Razorpay (UPI, cards, wallets) + Google Play Billing |
| Push Notifications | Firebase Cloud Messaging via AWS SNS |
| Admin Panel | Next.js (web) |
| Analytics | Mixpanel or Amplitude |

---

## 7. Architecture

```
+-------------------------------------------------------+
|                  React Native App                      |
|                                                        |
|  +-------------+  +--------------+  +---------------+  |
|  | Quick Mode  |  | Canvas       |  | Profile &     |  |
|  | (Browse +   |  | Editor       |  | Branding      |  |
|  |  Auto-fill) |  | (fabric.js   |  | Manager       |  |
|  |             |  |  in WebView) |  |               |  |
|  +-------------+  +--------------+  +---------------+  |
+------------------------+------------------------------+
                         |
                         v
              +----------+-----------+
              |   API (Express/EC2)  |
              +----------+-----------+
                         |
         +---------------+---------------+
         |               |               |
+--------v-----+  +------v------+  +-----v--------+
|   Cognito    |  |  DynamoDB   |  |  S3 + CDN    |
|   (Auth)     |  |  (Data)     |  |  (Assets)    |
+--------------+  +------+------+  +--------------+
                         |
              +----------v-----------+
              |   Lambda             |
              |   (Sharp + FFmpeg)   |
              |   Image/Video proc   |
              +----------------------+
```

### Template JSON Schema (Core Architecture Decision)

Templates are NOT flat images. Each template is a structured JSON defining layers:

```json
{
  "id": "diwali_2026_001",
  "category": "festival",
  "subcategory": "diwali",
  "language": "hi",
  "tags": ["diwali", "deepavali", "festival", "lights"],
  "premium": false,
  "canvas": {
    "width": 1080,
    "height": 1080
  },
  "layers": [
    {
      "type": "image",
      "src": "backgrounds/diwali_001.webp",
      "x": 0, "y": 0,
      "width": 1080, "height": 1080,
      "z": 0,
      "locked": true
    },
    {
      "type": "text",
      "content": "शुभ दीपावली",
      "font": "NotoSansDevanagari-Bold",
      "size": 72,
      "color": "#FFD700",
      "x": 540, "y": 200,
      "z": 1,
      "editable": true
    },
    {
      "type": "placeholder",
      "key": "user_photo",
      "shape": "circle",
      "x": 540, "y": 500,
      "radius": 120,
      "z": 2
    },
    {
      "type": "placeholder",
      "key": "user_name",
      "font": "Poppins-SemiBold",
      "size": 36,
      "color": "#FFFFFF",
      "x": 540, "y": 660,
      "z": 3
    },
    {
      "type": "placeholder",
      "key": "phone",
      "font": "Poppins-Regular",
      "size": 24,
      "color": "#CCCCCC",
      "x": 540, "y": 710,
      "z": 4
    },
    {
      "type": "sticker",
      "src": "stickers/diya_sparkle.webp",
      "x": 100, "y": 800,
      "width": 150, "height": 150,
      "z": 5
    }
  ]
}
```

- **Quick Mode** reads this JSON, fills placeholders with user profile, renders composite image.
- **Edit Mode** loads the same JSON into fabric.js canvas, every layer becomes draggable and editable.

---

## 8. DynamoDB Schema

### Tables

**users**
| Key | Type | Description |
|---|---|---|
| PK: `USER#<userId>` | String | Partition key |
| SK: `PROFILE` | String | Sort key |
| name | String | Display name |
| photo_url | String | S3 URL to profile photo |
| business_name | String | Optional business name |
| logo_url | String | Optional business logo |
| phone | String | Optional phone number |
| language | String | Preferred language |
| subscription_status | String | free / premium |
| subscription_expiry | Number | Unix timestamp |

**templates**
| Key | Type | Description |
|---|---|---|
| PK: `TEMPLATE#<templateId>` | String | Partition key |
| SK: `META` | String | Sort key |
| category | String | festival / quotes / devotional / business / greeting |
| subcategory | String | diwali / good_morning / shayari etc. |
| language | String | hi / en / mr / gu / ta / te / kn / ml |
| premium | Boolean | Free or premium |
| tags | List | Searchable tags |
| schema_url | String | S3 URL to template JSON |
| thumbnail_url | String | S3 URL to preview thumbnail |
| created_at | Number | Unix timestamp |
| scheduled_date | String | YYYY-MM-DD if day-specific |

**GSI: category-language-index** — PK: category, SK: language (for browsing)
**GSI: scheduled-date-index** — PK: scheduled_date (for daily content)

---

## 9. Monetization Model

| Tier | Price | What You Get |
|---|---|---|
| Free | Rs.0 | Browse all templates, Quick Mode with watermark, basic fonts |
| Premium Monthly | Rs.99/mo | No watermark, all templates, all fonts, video export |
| Premium Yearly | Rs.599/yr | Same as monthly, discounted |
| Business | Rs.1,999/yr | Custom branded frames, priority templates, business card maker |

**Additional revenue:**
- Rewarded ads (watch ad to unlock one premium template)
- Banner ads in free tier (non-intrusive)

**Payment:** Razorpay (UPI AutoPay, cards, wallets) + Google Play Billing (for App Store compliance)

---

## 10. Content Categories

| Category | Examples |
|---|---|
| Good Morning / Night | Daily greeting images with quotes |
| Motivational | Success quotes, hustle quotes, life advice |
| Devotional / Bhakti | Deity images, mantras, bhajans, daily darshan |
| Festival | Diwali, Holi, Eid, Christmas, Navratri, Ganesh Chaturthi, etc. |
| Shayari | Romantic, friendship, sad, motivational (Hindi/Urdu) |
| Birthday / Anniversary | Personal celebration templates |
| Business | Sale posters, offer banners, service promotion, visiting cards |
| Patriotic | Republic Day, Independence Day, Gandhi Jayanti |
| Relationship | Love, friendship, family gratitude |
| Custom / Blank | Start from scratch in editor |

---

## 11. Timeline (1-Week Sprint with Claude Code)

| Day | Deliverables |
|---|---|
| Day 1 | Project scaffold, Cognito auth (phone + Google), React Navigation setup, Zustand stores, Express API, DynamoDB tables, S3 buckets + CloudFront |
| Day 2 | User profile screen, template JSON schema system, auto-fill engine, S3 template upload pipeline |
| Day 3 | Home screen, category browsing UI, template preview, Quick Mode renderer (auto-fill + composite), download to gallery |
| Day 4 | Share to WhatsApp/Instagram/Facebook, paywall (Razorpay + Play Billing), watermark logic |
| Day 5 | Canvas editor — fabric.js in WebView, RN bridge, load template JSON as editable layers, text editing tools, drag/resize/rotate |
| Day 6 | Stickers library, backgrounds library, image add/crop, layer management (z-index, lock, delete), undo/redo, export from editor |
| Day 7 | Admin panel (Next.js — template upload + categorize + schedule), push notifications (FCM), testing + bug fixes |

**Week 2 (stretch):** Video export, multi-language, rewarded ads, AI features, performance optimization, store submission.

---

## 12. Pricing Estimation (Freelance)

### Development Cost (Solo Full-Stack Developer)

| Scope | INR | USD |
|---|---|---|
| Phase 1 — Quick Mode MVP (launchable) | Rs.5-7 lakhs | $6,000-8,500 |
| Phase 1+2 — MVP + Canvas Editor (full core) | Rs.10-14 lakhs | $12,000-17,000 |
| Full Build — All phases, both platforms, admin panel, video | Rs.18-25 lakhs | $22,000-30,000 |
| Monthly Retainer — Maintenance, new features, content support | Rs.50K-1L/mo | $600-1,200/mo |

### Operational Costs (Not Included in Dev)

| Item | Estimated Cost |
|---|---|
| AWS infra (early stage) | Rs.4,000-12,000/month |
| Template design (graphic designer) | Rs.15,000-30,000 for initial batch |
| Content writing + translations | Rs.10,000-20,000/month ongoing |
| App Store fees | $25 (Google) + $99/yr (Apple) |
| Marketing / UA | Variable |

---

## 13. Pre-Build Checklist

- [ ] App name and package ID decided
- [ ] AWS account provisioned (Cognito, DynamoDB, S3, CloudFront, Lambda)
- [ ] Razorpay test account active
- [ ] 20-30 seed templates designed (background images as WebP)
- [ ] 50-100 Google Fonts bundled (Devanagari + Latin families)
- [ ] Sticker packs sourced (royalty-free SVG/PNG from flaticon/svgrepo)
- [ ] Quote/shayari content for initial categories (at least 100 entries)
- [ ] Firebase project for FCM
- [ ] Google Play Console + Apple Developer accounts ready
