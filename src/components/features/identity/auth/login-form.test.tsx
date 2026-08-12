import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/features/identity/auth/login-form";
import { useAuth } from "@/hooks/identity/use-auth";
import {
  isFirebaseGoogleLoginConfigured,
  signInWithFirebaseGoogle,
} from "@/lib/firebase-auth";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

vi.mock("@/hooks/identity/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/firebase-auth", () => ({
  getFirebaseGoogleLoginErrorMessage: vi.fn(() => "Firebase login failed"),
  isFirebaseGoogleLoginConfigured: vi.fn(),
  signInWithFirebaseGoogle: vi.fn(),
}));

describe("LoginForm Firebase Google login", () => {
  const login = vi.fn();
  const googleLogin = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      status: "unauthenticated",
      session: null,
      currentUser: null,
      effectiveAccess: null,
      errorMessage: null,
      retryRestore: vi.fn(),
      login,
      googleLogin,
      logout: vi.fn(),
    });
    vi.mocked(isFirebaseGoogleLoginConfigured).mockReturnValue(true);
    vi.mocked(signInWithFirebaseGoogle).mockResolvedValue("firebase-id-token");
    googleLogin.mockResolvedValue(null);
  });

  it("exchanges the Firebase ID token through the IceBot Google login API", async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập bằng Google" }));

    await waitFor(() => {
      expect(signInWithFirebaseGoogle).toHaveBeenCalledTimes(1);
      expect(googleLogin).toHaveBeenCalledWith("firebase-id-token");
      expect(replace).toHaveBeenCalledWith("/dashboard");
    });
  });
});
