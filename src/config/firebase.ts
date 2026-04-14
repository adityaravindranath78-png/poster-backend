import admin from "firebase-admin";
import { env } from "./env.js";

if (!admin.apps.length) {
  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Use service account JSON file path
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else if (env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY) {
    // Use env vars directly
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // Default credentials (for local dev with gcloud auth)
    admin.initializeApp();
  }
}

export const firebaseAuth: ReturnType<typeof admin.auth> = admin.auth();
