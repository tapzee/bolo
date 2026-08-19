/**
 * Finds and removes duplicate project documents caused by the reopen-id bug
 * (fixed in video-cache.ts / use-caption-pipeline.ts): every time a project
 * was reopened, `cachedVideoToFile` lost the original file's `lastModified`,
 * which shifted `projectIdForFile`'s output and made autosave write a brand
 * new `users/{uid}/projects/{id}` document instead of updating the one that
 * was opened.
 *
 * Duplicates from the same source file share title/duration/dimensions and
 * only differ in `id` and `updatedAt`. The single oldest doc in each group is
 * the original — its id is the one that still matches the cached video in the
 * browser's IndexedDB — so it is kept and every newer sibling is deleted.
 *
 *   npm run dedupe:projects -- <email>              # dry run, report only
 *   npm run dedupe:projects -- <email> --apply       # actually delete
 */
import { config } from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const apply = process.argv.includes("--apply");
const email = args[0];

if (!email) {
  console.error("Usage: npm run dedupe:projects -- <email> [--apply]");
  process.exit(1);
}

const auth = getAuth();
const db = getFirestore();

const user = await auth.getUserByEmail(email);
console.log(`${email} → uid ${user.uid}\n`);

const snap = await db.collection("users").doc(user.uid).collection("projects").get();

type Row = { id: string; title: string; durationSeconds: number; sourceWidth: number; sourceHeight: number; updatedAt: number };
const rows: Row[] = snap.docs.map((d) => {
  const data = d.data();
  return {
    id: d.id,
    title: String(data.title ?? ""),
    durationSeconds: Number(data.durationSeconds ?? 0),
    sourceWidth: Number(data.sourceWidth ?? 0),
    sourceHeight: Number(data.sourceHeight ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  };
});

const groups = new Map<string, Row[]>();
for (const row of rows) {
  const key = `${row.title}::${row.durationSeconds}::${row.sourceWidth}x${row.sourceHeight}`;
  const list = groups.get(key) ?? [];
  list.push(row);
  groups.set(key, list);
}

let totalDupes = 0;
for (const [key, list] of groups) {
  if (list.length < 2) continue;
  list.sort((a, b) => a.updatedAt - b.updatedAt);
  const [keep, ...drop] = list;
  totalDupes += drop.length;
  console.log(`"${key}" — ${list.length} copies`);
  console.log(`  keep   ${keep.id}  (oldest, updatedAt ${new Date(keep.updatedAt).toISOString()})`);
  for (const d of drop) {
    console.log(`  ${apply ? "delete" : "would delete"} ${d.id}  (updatedAt ${new Date(d.updatedAt).toISOString()})`);
    if (apply) {
      await db.collection("users").doc(user.uid).collection("projects").doc(d.id).delete();
    }
  }
  console.log("");
}

console.log(
  totalDupes === 0
    ? "No duplicates found."
    : `${totalDupes} duplicate document(s) ${apply ? "deleted" : "found — rerun with --apply to delete them"}.`,
);
