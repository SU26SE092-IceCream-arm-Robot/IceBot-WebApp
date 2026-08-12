import { FirebaseError, getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

function getFirebaseOptions(): FirebaseOptions | null {
  const options = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  };

  return Object.values(options).every(Boolean) ? (options as FirebaseOptions) : null;
}

export function isFirebaseGoogleLoginConfigured(): boolean {
  return getFirebaseOptions() !== null;
}

export async function signInWithFirebaseGoogle(): Promise<string> {
  const options = getFirebaseOptions();
  if (!options) {
    throw new Error("Firebase Authentication chưa được cấu hình cho WebApp.");
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(options);
  const auth = getAuth(app);
  auth.languageCode = "vi";

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const credential = await signInWithPopup(auth, provider);
  return credential.user.getIdToken();
}

export function getFirebaseGoogleLoginErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error
      ? error.message
      : "Không thể đăng nhập bằng Google qua Firebase.";
  }

  switch (error.code) {
    case "auth/popup-closed-by-user":
      return "Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.";
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn cửa sổ đăng nhập Google. Hãy cho phép popup rồi thử lại.";
    case "auth/cancelled-popup-request":
      return "Một yêu cầu đăng nhập Google khác đang được xử lý.";
    case "auth/network-request-failed":
      return "Không thể kết nối Firebase Authentication. Hãy kiểm tra mạng rồi thử lại.";
    case "auth/unauthorized-domain":
      return "Tên miền hiện tại chưa được Firebase Authentication cho phép.";
    case "auth/operation-not-allowed":
      return "Đăng nhập Google chưa được bật trong Firebase Authentication.";
    case "auth/account-exists-with-different-credential":
      return "Email này đã được đăng ký bằng phương thức đăng nhập khác.";
    default:
      return "Firebase không thể hoàn tất đăng nhập Google.";
  }
}
