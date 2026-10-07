const NAME_MIN = 2;
const NAME_MAX = 40;
const PASSWORD_MIN = 8;

export function validateFirstName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "First name is required.";
  if (trimmed.length < NAME_MIN) return `First name must be at least ${NAME_MIN} characters.`;
  if (trimmed.length > NAME_MAX) return `First name must be at most ${NAME_MAX} characters.`;
  if (!/^[a-zA-ZÀ-ÿ' -]+$/.test(trimmed)) return "First name contains invalid characters.";
  return "";
}

export function validateLastName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Last name is required.";
  if (trimmed.length < NAME_MIN) return `Last name must be at least ${NAME_MIN} characters.`;
  if (trimmed.length > NAME_MAX) return `Last name must be at most ${NAME_MAX} characters.`;
  if (!/^[a-zA-ZÀ-ÿ' -]+$/.test(trimmed)) return "Last name contains invalid characters.";
  return "";
}

export function validateEmail(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  // simple shape check — the backend does the authoritative deliverable check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email address.";
  return "";
}

export function validatePassword(value: string): string {
  if (!value) return "Password is required.";
  if (value.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (value.length > 128) return "Password is too long.";
  if (!/[A-Za-z]/.test(value)) return "Password must include at least one letter.";
  if (!/[0-9]/.test(value)) return "Password must include at least one number.";
  return "";
}

export function validateConfirmPassword(password: string, confirm: string): string {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return "";
}
