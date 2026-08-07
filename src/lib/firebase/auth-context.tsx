"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "./client";

export interface AuthState {
  user: User | null;
  /** True until the first auth state resolves — distinct from "signed out". */
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Fresh ID token for authenticating API calls, or null when signed out. */
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Maps Firebase's error codes to copy a person can act on. Firebase's own
 * messages leak implementation detail ("auth/invalid-credential") and are not
 * written for end users.
 */
const friendlyAuthError = (error: unknown): Error => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  const messages: Record<string, string> = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-not-found": "No account with that email. Try creating one.",
    "auth/wrong-password": "Wrong password. Try again.",
    "auth/invalid-credential": "That email and password don't match.",
    "auth/email-already-in-use": "An account with that email already exists.",
    "auth/weak-password": "Use at least 6 characters for your password.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the sign-in popup.",
    "auth/network-request-failed": "Connection issue. Please try again.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and retry.",
    "auth/operation-not-allowed":
      "That sign-in method isn't enabled in Firebase Auth.",
    "auth/unauthorized-domain":
      "This domain isn't authorised in Firebase Auth settings.",
  };

  return new Error(messages[code] ?? "Couldn't sign you in. Please try again.");
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      // Resolve immediately so the app renders signed-out rather than sitting
      // on a spinner forever when Firebase is not set up.
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    void (async () => {
      const auth = await firebaseAuth();
      if (auth === null) {
        setLoading(false);
        return;
      }
      const { onAuthStateChanged } = await import("firebase/auth");
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth, (next) => {
        setUser(next);
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [configured]);

  const signInWithGoogle = useCallback(async () => {
    const auth = await firebaseAuth();
    if (auth === null) throw new Error("Sign-in is not configured.");
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import(
        "firebase/auth"
      );
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      throw friendlyAuthError(error);
    }
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const auth = await firebaseAuth();
      if (auth === null) throw new Error("Sign-in is not configured.");
      try {
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        throw friendlyAuthError(error);
      }
    },
    [],
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string) => {
      const auth = await firebaseAuth();
      if (auth === null) throw new Error("Sign-in is not configured.");
      try {
        const { createUserWithEmailAndPassword } = await import(
          "firebase/auth"
        );
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        throw friendlyAuthError(error);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const auth = await firebaseAuth();
    if (auth === null) return;
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  }, []);

  // Always requested fresh from the SDK, which refreshes it near expiry.
  // Caching it ourselves would send an expired token after an hour, and the
  // request would silently bill as anonymous.
  const getIdToken = useCallback(async () => {
    const auth = await firebaseAuth();
    const current = auth?.currentUser;
    return current === null || current === undefined
      ? null
      : current.getIdToken();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      configured,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      logout,
      getIdToken,
    }),
    [
      user,
      loading,
      configured,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      logout,
      getIdToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
};
