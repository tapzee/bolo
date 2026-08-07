"use client";

import type { ProjectSnapshot, ProjectStore } from "@/lib/storage/project-store";
import { projectStore as localStore } from "@/lib/storage/project-store";
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
      const { doc, setDoc } = await import("firebase/firestore");
      // Firestore rejects `undefined` fields, and optional caption properties
      // (colour, pageBreak) are absent on untouched words — the round trip
      // drops them cleanly.
      await setDoc(
        doc(db, "users", this.uid, "projects", snapshot.id),
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
