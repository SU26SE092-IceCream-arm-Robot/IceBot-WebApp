import { afterEach, describe, expect, it, vi } from "vitest";

import { isFirebaseGoogleLoginConfigured } from "@/lib/firebase-auth";

const FIREBASE_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "example.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "example",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "example.firebasestorage.app",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456:web:abcdef",
} as const;

describe("Firebase Authentication configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables Google login only when every Firebase client value exists", () => {
    Object.entries(FIREBASE_ENV).forEach(([name, value]) => vi.stubEnv(name, value));

    expect(isFirebaseGoogleLoginConfigured()).toBe(true);
  });

  it("keeps Google login unavailable for partial configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "api-key");

    expect(isFirebaseGoogleLoginConfigured()).toBe(false);
  });
});
