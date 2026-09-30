export const API_URL = "http://localhost:8080";
export const WS_URL = "ws://localhost:8080";

export async function checkBackend() {
  try {
    const res = await fetch(`${API_URL}/`)
  if (!res.ok) return null;

    console.log(res.json())
    return await res.json();
  } catch {
    return null;
  }
}
