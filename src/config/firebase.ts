import admin from "firebase-admin";
import type { Auth } from "firebase-admin/auth";
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
console.log(clientEmail);
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Missing Firebase environment variables");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

export const db = admin.firestore();
export const auth: Auth = admin.auth();
export const firestoreAdmin = admin.firestore;
