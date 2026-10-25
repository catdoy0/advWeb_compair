export async function responseErrorMessage(res: Response, fallback: string): Promise<string> {
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After"));
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      const wait = retryAfter < 60
        ? `${Math.ceil(retryAfter)} seconds`
        : `${Math.ceil(retryAfter / 60)} minute${Math.ceil(retryAfter / 60) === 1 ? "" : "s"}`;
      return `Too many attempts. Please wait ${wait} before trying again.`;
    }
    return "Too many attempts. Please wait a minute before trying again.";
  }

  try {
    const data = await res.json();
    return data.detail ?? data.error ?? data.message ?? fallback;
  } catch {
    return fallback;
  }
}
