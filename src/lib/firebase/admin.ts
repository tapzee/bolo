import "server-only";

import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-side Firebase Admin.
 *
 * The service-account private key here bypasses every Firestore security rule,
 * so this module is `server-only`: the build fails outright if a client
 * component ever imports it, rather than silently shipping the key to browsers.
 *
 * Used for exactly two things the client must not be trusted with: verifying
 * ID tokens, and writing credit balances.
 */

const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
// `.env` files cannot hold real newlines, so the key is stored with literal
// `\n` sequences and restored here. Without this, the PEM parse fails with a
// famously unhelpful "error:0909006C" from OpenSSL.
const PRIVATE_KEY = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n",
);

export const isAdminConfigured = (): boolean =>
  typeof PROJECT_ID === "string" &&
  typeof CLIENT_EMAIL === "string" &&
  typeof PRIVATE_KEY === "string" &&
  PRIVATE_KEY.includes("BEGIN PRIVATE KEY");

let adminApp: App | null = null;

const app = (): App | null => {
  if (!isAdminConfigured()) return null;
  if (adminApp !== null) return adminApp;

  adminApp =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId: PROJECT_ID,
            clientEmail: CLIENT_EMAIL,
            privateKey: PRIVATE_KEY,
          }),
        });

  return adminApp;
};

export const adminAuth = (): Auth | null => {
  const instance = app();
  return instance === null ? null : getAuth(instance);
};

export const adminDb = (): Firestore | null => {
  const instance = app();
  return instance === null ? null : getFirestore(instance);
};

/**
 * Resolves the caller's verified uid from an `Authorization: Bearer <idToken>`
 * header, or `null` when absent or invalid.
 *
 * Returning `null` rather than throwing is deliberate: signed-out use is a
 * supported state, not an error. Callers decide what an anonymous request is
 * allowed to do.
 *
 * The uid is only ever taken from a *verified* token — never from a header or
 * body field the client controls, which would let anyone spend anyone's credits.
 */
export const verifyRequestUid = async (
  request: Request,
): Promise<string | null> => {
  const auth = adminAuth();
  if (auth === null) return null;

  const header = request.headers.get("authorization");
  if (header === null || !header.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (token.length === 0) return null;

  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    // Expired or forged token. Treated as signed-out rather than as an error,
    // so a stale tab degrades gracefully instead of hard-failing.
    return null;
  }
};
