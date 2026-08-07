import "server-only";

import { adminAuth, verifyRequestUid } from "./admin";

/**
 * Admin access control.
 *
 * THE RULE: admin status is decided here, on the server, from a verified ID
 * token plus a server-only allowlist. It is never taken from a request body, a
 * header, a query param, or a Firestore field the user could write. The admin
 * panel can grant credits — treating a client-supplied claim as proof would let
 * anyone mint themselves unlimited transcription.
 *
 * The client-side check in the UI exists only to hide a menu item. Every admin
 * route re-checks independently, because hidden UI is not access control.
 */

const allowlist = (): string[] =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);

export const isAdminEmail = (email: string | undefined): boolean => {
  if (email === undefined) return false;
  const list = allowlist();
  // An empty allowlist means "no admins", never "everyone". Getting this
  // backwards on a misconfigured deploy would expose the panel to the world.
  return list.length > 0 && list.includes(email.toLowerCase());
};

export interface AdminIdentity {
  uid: string;
  email: string;
}

/**
 * Resolves the caller as an admin, or `null`.
 *
 * Requires a *verified* token and an email that is both present in the
 * allowlist and marked verified by Firebase — an unverified email can be
 * claimed by anyone who can receive a signup form.
 */
export const requireAdmin = async (
  request: Request,
): Promise<AdminIdentity | null> => {
  const uid = await verifyRequestUid(request);
  if (uid === null) return null;

  const auth = adminAuth();
  if (auth === null) return null;

  try {
    const user = await auth.getUser(uid);
    if (user.emailVerified !== true) return null;
    if (!isAdminEmail(user.email)) return null;
    return { uid, email: user.email ?? "" };
  } catch {
    return null;
  }
};

/** Uniform 404 for non-admins — a 403 would confirm the route exists. */
export const notAdminResponse = (): Response =>
  new Response(JSON.stringify({ ok: false, message: "Not found" }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });
