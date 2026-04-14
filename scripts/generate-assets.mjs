#!/usr/bin/env node
/**
 * Generate placeholder template assets (backgrounds, stickers, thumbnails)
 * and upload to S3. Uses sharp for image generation.
 */
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGION = "ap-south-1";
const BUCKET = "poster-app-assets-techveda";

const s3 = new S3Client({ region: REGION });

async function upload(key, buffer, contentType = "image/webp") {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  console.log(`  ✓ ${key}`);
}

// Generate a gradient background
async function makeBackground(width, height, colors, name) {
  const [c1, c2] = colors;
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${c1}"/>
        <stop offset="100%" style="stop-color:${c2}"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
  </svg>`;
  const buf = await sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
  await upload(name, buf);
  return buf;
}

// Generate a simple shape sticker
async function makeSticker(size, shape, color, name) {
  let svg;
  if (shape === "circle") {
    svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>`;
  } else if (shape === "star") {
    const cx = size / 2, cy = size / 2, r = size / 2 - 8;
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.5;
      points.push(`${cx + rad * Math.cos(angle)},${cy + rad * Math.sin(angle)}`);
    }
    svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <polygon points="${points.join(" ")}" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>`;
  } else if (shape === "crescent") {
    svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 8}" fill="${color}"/>
      <circle cx="${size / 2 + 20}" cy="${size / 2 - 10}" r="${size / 2 - 16}" fill="#0D1B2A"/>
    </svg>`;
  } else {
    // rect/default
    svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="${size - 16}" height="${size - 16}" rx="16" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>`;
  }
  const buf = await sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer();
  await upload(name, buf);
}

// Generate thumbnail (smaller version of background with text overlay)
async function makeThumbnail(bgBuf, label, templateId) {
  const thumb = await sharp(bgBuf)
    .resize(400, 400, { fit: "cover" })
    .composite([
      {
        input: Buffer.from(
          `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="280" width="400" height="120" fill="rgba(0,0,0,0.5)" rx="0"/>
            <text x="200" y="350" font-family="Arial,sans-serif" font-size="28" font-weight="bold"
              fill="white" text-anchor="middle">${label}</text>
          </svg>`
        ),
        top: 0,
        left: 0,
      },
    ])
    .webp({ quality: 80 })
    .toBuffer();
  await upload(`templates/${templateId}/thumb.webp`, thumb);
}

// ─── Asset Definitions ───
const backgrounds = [
  { name: "backgrounds/birthday_confetti.webp", colors: ["#FF6B8A", "#FFA07A"], label: "Birthday", id: "birthday_001" },
  { name: "backgrounds/red_sale_bg.webp", colors: ["#DC143C", "#8B0000"], label: "Business Sale", id: "business_sale_001" },
  { name: "backgrounds/ganesh_orange.webp", colors: ["#FF8C00", "#FF4500"], label: "Devotional", id: "devotional_001" },
  { name: "backgrounds/diwali_lights.webp", colors: ["#2C1654", "#FF8C00"], label: "Diwali", id: "diwali_001" },
  { name: "backgrounds/good_morning_sunrise.webp", colors: ["#FFD700", "#FF6347"], label: "Good Morning", id: "good_morning_001" },
  { name: "backgrounds/night_stars.webp", colors: ["#0D1B2A", "#1B2838"], label: "Good Night", id: "good_night_001" },
  { name: "backgrounds/dark_gradient.webp", colors: ["#1A1A2E", "#16213E"], label: "Motivational", id: "motivational_001" },
  { name: "backgrounds/shayari_roses.webp", colors: ["#8B0030", "#D4145A"], label: "Shayari", id: "shayari_001" },
];

const stickers = [
  { name: "stickers/cake.webp", shape: "circle", color: "#FFD700", size: 200 },
  { name: "stickers/balloons.webp", shape: "star", color: "#FF6B8A", size: 200 },
  { name: "stickers/diya_sparkle.webp", shape: "star", color: "#FFD700", size: 200 },
  { name: "stickers/moon.webp", shape: "crescent", color: "#F0E68C", size: 200 },
];

async function main() {
  console.log("Generating and uploading template assets...\n");

  // Backgrounds + thumbnails
  console.log("Backgrounds:");
  for (const bg of backgrounds) {
    const buf = await makeBackground(1080, 1080, bg.colors, bg.name);
    await makeThumbnail(buf, bg.label, bg.id);
  }

  // Stickers
  console.log("\nStickers:");
  for (const s of stickers) {
    await makeSticker(s.size, s.shape, s.color, s.name);
  }

  console.log("\nDone! All assets uploaded to S3.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
