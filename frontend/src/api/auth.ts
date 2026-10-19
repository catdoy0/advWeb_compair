import { API_URL } from "./config";
import type { StoreSettings, UserSession, SignUpPayload } from "../types/auth";

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data.detail ?? fallback;
  } catch {
    return fallback;
  }
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/forget-password-sendcode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return { ok: false, message: await readError(res, "Unable to send reset code.") };
    const data = await res.json();
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, message: "Unable to send reset code. Please try again." };
  }
}

export async function googleSignIn(credential: string): Promise<{
  session: UserSession | null;
  error: string;
}> {
  try {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) {
      return { session: null, error: await readError(res, "Google sign-in failed.") };
    }
    return { session: await res.json(), error: "" };
  } catch {
    return { session: null, error: "Unable to contact the server. Please try again." };
  }
}

export async function verifyPasswordResetCode(payload: {
  email: string;
  code: string;
}): Promise<{ ok: boolean; message: string; resetToken?: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/verify-reset-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, message: await readError(res, "Unable to reset password.") };
    const data = await res.json();
    return { ok: true, message: "Code verified.", resetToken: data.reset_token };
  } catch {
    return { ok: false, message: "Unable to verify code. Please try again." };
  }
}

export async function resetPassword(payload: {
  reset_token: string;
  password: string;
  confirm_password: string;
}): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, message: await readError(res, "Unable to reset password.") };
    const data = await res.json();
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, message: "Unable to reset password. Please try again." };
  }
}

export async function getStoreSettings(): Promise<StoreSettings | null> {
  try {
    const res = await fetch(`${API_URL}/auth/store-settings`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}


export async function login(email: string, password: string): Promise<UserSession | null>{
  const res = await fetch(`${API_URL}/auth/signin`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    credentials: "include",
    body: JSON.stringify({email, password}),
  });
  if (!res.ok) return null;
  return await res.json();
}



export async function signUp(payload: SignUpPayload): Promise<UserSession | null> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return await res.json();
}


/**
 * Returns true if the email is already registered.
 * Fails *open* on network error (returns false) so a flaky check doesn't
 * block the user — the signup endpoint will reject the duplicate anyway.
 */
export async function checkEmailTaken(email: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/check-email-taken`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      credentials: "include",
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.taken);
  } catch {
    return false;
  }
}


export async function logout(): Promise<void>{
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
}

export async function session(): Promise<UserSession | null> {
  try {
    const res = await fetch(`${API_URL}/auth/session`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}


export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${API_URL}/${path}`;
  const opts: RequestInit = { credentials: "include", ...options };

  let res = await fetch(url, opts);

  if (res.status === 401) {
    const refreshed = await fetch(`${API_URL}/auth/session`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshed.ok) {
      res = await fetch(url, opts);
    }
  }

  return res;
}
