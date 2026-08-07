/**
 * Reports whether an account can actually reach /admin, and why not if it can't.
 *
 * Reads the same two conditions the server enforces, so there is no guessing:
 * the email must be in ADMIN_EMAILS, and Firebase must have it marked verified.
 *
 *   npm run check:admin                    # checks every ADMIN_EMAILS entry
 *   npm run check:admin -- you@example.com
 *
 * Pass --verify to mark the address verified via the Admin SDK. Only do that
 * for an address you genuinely control — it is the check that stops someone
 * typing your email into a signup form and inheriting admin rights.
 */
import { config } from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

config({ path: ".env.local" });

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Firebase Admin is not configured in .env.local.");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const auth = getAuth();

const allowlist = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const shouldVerify = process.argv.includes("--verify");
const targets = args.length > 0 ? args : allowlist;

if (allowlist.length === 0) {
  console.log("ADMIN_EMAILS is empty — nobody has admin access.");
  console.log("That is the safe default, but it also means /admin is closed.");
  process.exit(0);
}

console.log(`ADMIN_EMAILS: ${allowlist.join(", ")}`);
console.log("");

for (const email of targets) {
  try {
    const user = await auth.getUserByEmail(email);
    const inAllowlist = allowlist.includes((user.email ?? "").toLowerCase());
    const providers = user.providerData.map((p) => p.providerId).join(", ");
    const canAdmin = inAllowlist && user.emailVerified;

    console.log(`${email}`);
    console.log(`  uid            ${user.uid}`);
    console.log(`  providers      ${providers || "none"}`);
    console.log(`  emailVerified  ${user.emailVerified}`);
    console.log(`  in allowlist   ${inAllowlist}`);
    console.log(`  → /admin       ${canAdmin ? "ALLOWED" : "BLOCKED"}`);

    if (!canAdmin && !user.emailVerified) {
      if (shouldVerify) {
        await auth.updateUser(user.uid, { emailVerified: true });
        console.log(`  ✔ marked verified — sign out and back in to refresh your token`);
      } else {
        console.log(`  fix: sign in with Google instead, or re-run with --verify`);
      }
    }
    console.log("");
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    console.log(`${email}`);
    console.log(
      code.includes("user-not-found")
        ? "  no Firebase account with this email yet — sign in once at /create first\n"
        : `  lookup failed: ${code || "unknown error"}\n`,
    );
  }
}
