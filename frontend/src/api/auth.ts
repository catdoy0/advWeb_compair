import { API_URL } from "./config";
import type { UserSession, SignUpPayload } from "../types/auth";


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
