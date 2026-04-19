#!/usr/bin/env node
// Generates 6 placeholder template variants per category (12 categories = 72 total).
// Each variant points to an existing S3 background + reuses its category's _001 thumbnail
// so the seed script can push them to DynamoDB immediately without new asset uploads.
//
// Usage:
//   node scripts/gen-placeholder-templates.mjs
//   bash infra/seed-templates.sh

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const CDN = 'dklcr2on9ks6p.cloudfront.net';

const CATEGORY_BG = {
  good_morning: 'backgrounds/good_morning_sunrise.webp',
  good_night: 'backgrounds/night_stars.webp',
  devotional: 'backgrounds/ganesh_orange.webp',
  festival: 'backgrounds/diwali_lights.webp',
  shayari: 'backgrounds/shayari_roses.webp',
  motivational: 'backgrounds/dark_gradient.webp',
  birthday: 'backgrounds/birthday_confetti.webp',
  business: 'backgrounds/red_sale_bg.webp',
  anniversary: 'backgrounds/birthday_confetti.webp',
  patriotic: 'backgrounds/dark_gradient.webp',
  love: 'backgrounds/shayari_roses.webp',
  friendship: 'backgrounds/shayari_roses.webp',
};

// Maps category id -> template id of its existing _001 (for thumbnail reuse)
const THUMB_SOURCE = {
  good_morning: 'good_morning_001',
  good_night: 'good_night_001',
  devotional: 'devotional_001',
  festival: 'diwali_001',
  shayari: 'shayari_001',
  motivational: 'motivational_001',
  birthday: 'birthday_001',
  business: 'business_sale_001',
  anniversary: 'birthday_001',
  patriotic: 'motivational_001',
  love: 'shayari_001',
  friendship: 'shayari_001',
};

// Themed text variants. Each entry produces one template.
// 6 entries per category × 12 categories = 72 variants.
const VARIANTS = {
  good_morning: [
    ['सुप्रभात', 'आपका दिन शुभ हो', 'hi'],
    ['Good Morning', 'Have a wonderful day', 'en'],
    ['शुभ प्रभात', 'ईश्वर आपका भला करे', 'hi'],
    ['नमस्कार', 'नई शुरुआत', 'hi'],
    ['जय श्री राम', 'शुभ प्रभात', 'hi'],
    ['सुप्रभात जी', 'खुशियों भरा दिन हो', 'hi'],
  ],
  good_night: [
    ['शुभ रात्रि', 'मीठे सपने', 'hi'],
    ['Good Night', 'Sweet dreams', 'en'],
    ['शुभ निशा', 'ईश्वर रक्षा करें', 'hi'],
    ['नमस्ते', 'सुकून भरी रात', 'hi'],
    ['ॐ नमः शिवाय', 'शुभ रात्रि', 'hi'],
    ['अलविदा', 'कल फिर मिलेंगे', 'hi'],
  ],
  devotional: [
    ['जय श्री राम', 'राम राम जी', 'hi'],
    ['ॐ नमः शिवाय', 'हर हर महादेव', 'hi'],
    ['राधे राधे', 'जय श्री कृष्ण', 'hi'],
    ['जय माता दी', 'जय दुर्गा माँ', 'hi'],
    ['जय हनुमान', 'बजरंग बली की जय', 'hi'],
    ['जय गणेश', 'गणपति बाप्पा मोरया', 'hi'],
  ],
  festival: [
    ['शुभ दीपावली', 'खुशियाँ मुबारक', 'hi'],
    ['Happy Diwali', 'Light up the joy', 'en'],
    ['होली मुबारक', 'रंगों का त्यौहार', 'hi'],
    ['रक्षाबंधन', 'भाई बहन का बंधन', 'hi'],
    ['नवरात्रि', 'जय माता दी', 'hi'],
    ['ईद मुबारक', 'खुशियाँ बरसें', 'hi'],
  ],
  shayari: [
    ['दिल की बात', 'कुछ अधूरे अल्फ़ाज़', 'hi'],
    ['मोहब्बत', 'ख़ामोश सी ग़ज़ल', 'hi'],
    ['जज़्बात', 'लफ़्ज़ों में उलझे', 'hi'],
    ['यादें', 'कभी न भूलने वाली', 'hi'],
    ['तन्हाई', 'तेरी कमी है', 'hi'],
    ['Shayari', 'Words from the heart', 'en'],
  ],
  motivational: [
    ['Believe', 'in yourself', 'en'],
    ['मेहनत', 'रंग लाएगी', 'hi'],
    ['Never Give Up', 'Keep pushing', 'en'],
    ['सपने बड़े देखो', 'हकीकत भी बड़ी होगी', 'hi'],
    ['Rise & Shine', 'Own the day', 'en'],
    ['हिम्मत', 'हारी नहीं', 'hi'],
  ],
  birthday: [
    ['Happy Birthday', 'Many happy returns', 'en'],
    ['जन्मदिन मुबारक', 'सदा खुश रहो', 'hi'],
    ['Birthday Wishes', 'Cheers to you', 'en'],
    ['शुभ जन्मदिन', 'ईश्वर की कृपा बनी रहे', 'hi'],
    ['Make a Wish', 'Blow out the candles', 'en'],
    ['सालगिरह मुबारक', 'खुशियों भरा साल हो', 'hi'],
  ],
  business: [
    ['Mega Sale', 'Up to 50% off', 'en'],
    ['महा बचत', 'सीमित समय के लिए', 'hi'],
    ['Grand Opening', 'Welcome offer', 'en'],
    ['नई शुरुआत', 'आपकी सेवा में', 'hi'],
    ['Special Offer', 'Hurry up', 'en'],
    ['धमाकेदार ऑफर', 'आज ही पाएँ', 'hi'],
  ],
  anniversary: [
    ['Happy Anniversary', 'Forever together', 'en'],
    ['सालगिरह मुबारक', 'प्यार बना रहे', 'hi'],
    ['Our Day', 'Celebrating us', 'en'],
    ['शुभ विवाह वर्षगांठ', 'खुशियों की सालगिरह', 'hi'],
    ['Together Forever', 'Cheers to love', 'en'],
    ['प्यार की सालगिरह', 'साथ हमेशा', 'hi'],
  ],
  patriotic: [
    ['जय हिन्द', 'वंदे मातरम', 'hi'],
    ['Happy Republic Day', '26 January', 'en'],
    ['स्वतंत्रता दिवस', '15 अगस्त', 'hi'],
    ['Proud Indian', 'Jai Hind', 'en'],
    ['मेरा भारत महान', 'सारे जहाँ से अच्छा', 'hi'],
    ['तिरंगा', 'गर्व है तुझ पर', 'hi'],
  ],
  love: [
    ['I Love You', 'Forever yours', 'en'],
    ['तुमसे प्यार है', 'बस तुम ही तुम', 'hi'],
    ['My Valentine', 'Be mine', 'en'],
    ['दिल तुम्हारा', 'धड़कन भी तुम्हारी', 'hi'],
    ['Love You', 'Always and forever', 'en'],
    ['मोहब्बत', 'सिर्फ तुमसे', 'hi'],
  ],
  friendship: [
    ['Best Friends', 'Forever', 'en'],
    ['दोस्ती', 'सबसे अनमोल', 'hi'],
    ['Yaari', 'Unbreakable bond', 'en'],
    ['यारी निभाएंगे', 'हर हाल में', 'hi'],
    ['Happy Friendship Day', 'Cheers dosto', 'en'],
    ['दोस्त', 'ज़िन्दगी के रंग', 'hi'],
  ],
};

function buildTemplate({id, category, subcategory, language, heading, sub, bg, thumbUrl}) {
  return {
    id,
    category,
    subcategory,
    language,
    tags: [category, subcategory, language],
    premium: false,
    thumbnail_url: thumbUrl,
    canvas: {width: 1080, height: 1080},
    layers: [
      {
        type: 'image',
        src: bg,
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        z: 0,
        locked: true,
      },
      {
        type: 'text',
        content: heading,
        font: language === 'hi' ? 'NotoSansDevanagari-Bold' : 'Poppins-Bold',
        size: 88,
        color: '#FFFFFF',
        x: 540,
        y: 200,
        z: 1,
        editable: true,
      },
      {
        type: 'text',
        content: sub,
        font: language === 'hi' ? 'NotoSansDevanagari-Regular' : 'Poppins-Regular',
        size: 36,
        color: '#F2E9D7',
        x: 540,
        y: 310,
        z: 2,
        editable: true,
      },
      {
        type: 'placeholder',
        key: 'user_photo',
        shape: 'circle',
        x: 540,
        y: 560,
        radius: 120,
        z: 3,
      },
      {
        type: 'placeholder',
        key: 'user_name',
        font: 'Poppins-SemiBold',
        size: 40,
        color: '#FFFFFF',
        x: 540,
        y: 740,
        z: 4,
      },
      {
        type: 'placeholder',
        key: 'phone',
        font: 'Poppins-Regular',
        size: 24,
        color: '#E5D9BE',
        x: 540,
        y: 800,
        z: 5,
      },
      {
        type: 'placeholder',
        key: 'logo',
        shape: 'rectangle',
        x: 540,
        y: 920,
        width: 140,
        height: 60,
        z: 6,
      },
    ],
  };
}

let written = 0;
for (const [category, entries] of Object.entries(VARIANTS)) {
  const bg = CATEGORY_BG[category];
  const thumbSource = THUMB_SOURCE[category];
  const thumbUrl = `https://${CDN}/templates/${thumbSource}/thumb.webp`;

  entries.forEach((entry, i) => {
    const [heading, sub, language] = entry;
    const seq = String(i + 2).padStart(3, '0'); // _001 already exists for most, so start at _002
    const id = `${category}_${seq}`;
    const filePath = path.join(TEMPLATES_DIR, `${id}.json`);

    // Skip if this exact id already exists (preserves existing _001s)
    if (fs.existsSync(filePath)) {
      console.log(`[skip]  ${id} already exists`);
      return;
    }

    const tmpl = buildTemplate({
      id,
      category,
      subcategory: `${category}_v${seq}`,
      language,
      heading,
      sub,
      bg,
      thumbUrl,
    });

    fs.writeFileSync(filePath, JSON.stringify(tmpl, null, 2) + '\n');
    written++;
    console.log(`[write] ${id}  "${heading}"`);
  });
}

console.log(`\nDone. Wrote ${written} placeholder template JSONs to ${TEMPLATES_DIR}.`);
console.log('Next step: bash infra/seed-templates.sh');
