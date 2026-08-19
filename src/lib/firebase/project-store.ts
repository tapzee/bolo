"use client";

import type { ProjectSnapshot, ProjectStore } from "@/lib/storage/project-store";
import { projectStore as localStore } from "@/lib/storage/project-store";
import { removeCachedVideo } from "@/lib/storage/video-cache";
import { firestoreDb } from "./client";

/**
 * Firestore-backed project persistence.
 *
 * Path: `users/{uid}/projects/{projectId}` — matching `firestore.rules`, which
 * only ever allow a signed-in user to touch documents under their own uid.
 *
 * Only caption JSON and settings are written. Never video, never audio. That is
 * an architectural rule, not an optimisation: keeping media out of Firestore is
 * what keeps storage cost near zero and the privacy promise true.
 *
 * All Firestore functions are imported dynamically so the SDK stays out of the
 * initial bundle — see the note in `client.ts`.
 */
export class FirestoreProjectStore implements ProjectStore {
  constructor(private readonly uid: string) {}

  async save(snapshot: ProjectSnapshot): Promise<void> {
    const db = await firestoreDb();
    if (db === null) return localStore.save(snapshot);

    try {
      const { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } =
        await import("firebase/firestore");

      const projectsRef = collection(db, "users", this.uid, "projects");
      const ref = doc(projectsRef, snapshot.id);

      // Only the first save under a brand new id can possibly be a duplicate —
      // every later autosave to that same id is just an update — so this
      // lookup only runs once per project instead of on every autosave tick.
      const existing = await getDoc(ref);
      if (!existing.exists()) {
        // Defends against duplicate project docs: the id is derived from the
        // file's name+size+lastModified, and that fingerprint can drift across
        // drops or reopens (e.g. re-downloaded WhatsApp media gets a fresh
        // mtime each time) — which would otherwise mint a new id and leave the
        // old one behind as an orphaned "Captions only" entry forever. Any
        // other doc for this user that is unmistakably the same clip (same
        // title, duration and frame size) is replaced rather than left behind.
        const siblings = await getDocs(
          query(
            projectsRef,
            where("title", "==", snapshot.title),
            where("durationSeconds", "==", snapshot.durationSeconds),
            where("sourceWidth", "==", snapshot.sourceWidth),
            where("sourceHeight", "==", snapshot.sourceHeight),
          ),
        );
        await Promise.all(
          siblings.docs.map(async (entry) => {
            await deleteDoc(entry.ref);
            await removeCachedVideo(entry.id);
          }),
        );
      }

      // Firestore rejects `undefined` fields, and optional caption properties
      // (colour, pageBreak) are absent on untouched words — the round trip
      // drops them cleanly.
      await setDoc(
        ref,
        JSON.parse(JSON.stringify(snapshot)) as ProjectSnapshot,
        { merge: true },
      );
    } catch (error) {
      throw new Error(
        error instanceof Error && /permission/i.test(error.message)
          ? "You don't have permission to save this project."
          : "Couldn't save to the cloud. Your work is kept in this browser.",
      );
    }
  }

  async load(id: string): Promise<ProjectSnapshot | null> {
    const db = await firestoreDb();
    if (db === null) return localStore.load(id);

    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const snap = await getDoc(doc(db, "users", this.uid, "projects", id));
      return snap.exists() ? (snap.data() as ProjectSnapshot) : null;
    } catch {
      return null;
    }
  }

  async list(): Promise<ProjectSnapshot[]> {
    const db = await firestoreDb();
    if (db === null) return localStore.list();

    try {
      const { collection, getDocs, limit, orderBy, query } = await import(
        "firebase/firestore"
      );
      const snap = await getDocs(
        query(
          collection(db, "users", this.uid, "projects"),
          orderBy("updatedAt", "desc"),
          limit(50),
        ),
      );
      return snap.docs.map((entry) => entry.data() as ProjectSnapshot);
    } catch {
      return [];
    }
  }

  async remove(id: string): Promise<void> {
    const db = await firestoreDb();
    if (db === null) return localStore.remove(id);

    try {
      const { deleteDoc, doc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "users", this.uid, "projects", id));
    } catch {
      // Already gone, or no permission — unreachable either way.
    }
  }
}

/**
 * Picks the right store for the current session.
 *
 * Signed-out is a first-class state: the whole upload → transcribe → edit →
 * export flow works without an account, kept in localStorage. Signing in moves
 * persistence to Firestore so it survives a cleared browser.
 */
export const storeForUser = (uid: string | null): ProjectStore =>
  uid === null ? localStore : new FirestoreProjectStore(uid);
