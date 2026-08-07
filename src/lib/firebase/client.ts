"use client";

import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

/**
 * Browser-side Firebase, loaded lazily.
 *
 * EVERY IMPORT HERE IS `import type` AND EVERY SDK LOAD IS DYNAMIC. That is
 * deliberate: statically importing `firebase/app`, `firebase/auth` and
 * `firebase/firestore` put ~180KB into the initial bundle of every page, paid
 * by every visitor including the ones who never sign in. Auth is optional in
 * this product, so its cost must be optional too.
 *
 * The config values are public by design. A Firebase web config identifies the
 * project; it is not a credential. Access is controlled by `firestore.rules`,
 * which is the thing to review carefully — not this file.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

/**
 * Whether Firebase is configured at all.
 *
 * The app must stay fully usable without it — upload, transcribe, edit and
 * export all work signed-out. Auth adds saved projects and credits; it is not a
 * gate on the core product.
 */
export const isFirebaseConfigured = (): boolean =>
  config.apiKey.length > 0 && config.projectId.length > 0;

let appPromise: Promise<FirebaseApp> | null = null;

const loadApp = async (): Promise<FirebaseApp | null> => {
  if (!isFirebaseConfigured()) return null;

  appPromise ??= (async () => {
    const { getApp, getApps, initializeApp } = await import("firebase/app");
    // Next's dev server re-executes modules on hot reload; re-initialising
    // would throw "Firebase App named '[DEFAULT]' already exists".
    return getApps().length > 0 ? getApp() : initializeApp(config);
  })();

  return appPromise;
};

export const firebaseAuth = async (): Promise<Auth | null> => {
  const app = await loadApp();
  if (app === null) return null;
  const { getAuth } = await import("firebase/auth");
  return getAuth(app);
};

export const firestoreDb = async (): Promise<Firestore | null> => {
  const app = await loadApp();
  if (app === null) return null;
  const { getFirestore } = await import("firebase/firestore");
  return getFirestore(app);
};
