import type { ChangeEmailRequest, ChangePasswordRequest } from "../types/profile";
import { API_URL } from "./config";

const PROFILE = "profile";

async function readMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data.detail ?? data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function changeEmail(
  payload: ChangeEmailRequest,
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_URL}/${PROFILE}/change-email`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { ok: false, message: await readMessage(res, "Failed to change email.") };
  }

  return { ok: true, message: await readMessage(res, "Email changed.") };
}

export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_URL}/${PROFILE}/change-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { ok: false, message: await readMessage(res, "Failed to change password.") };
  }

  return { ok: true, message: await readMessage(res, "Password changed.") };
}
