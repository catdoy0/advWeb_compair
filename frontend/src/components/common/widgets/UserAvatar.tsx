import { API_URL } from "../../../api/config";

interface UserAvatarProps {
  initials: string
  avatarUrl?: string | null
  size?: number
  tone?: "primary" | "sidebar"
  className?: string
  variant?: "user" | "messages"
}

const tones = {
  primary: "bg-[#2d65c8] text-white",
  sidebar: "bg-[#1d4d80] text-white",
}

export default function UserAvatar({
  initials,
  avatarUrl,
  size = 32,
  tone = "primary",
  className = "",
  variant = "user"
}: UserAvatarProps) {
  
  // Apply the custom styles if the variant is 'messages', otherwise fallback to tone-based classes
  const variantClasses = variant === "messages" 
    ? "h-7 w-7 bg-[#dceaff] text-[9px] font-bold text-[#2870e8]" 
    : `text-xs font-semibold ${tones[tone]}`;
  const imageUrl = avatarUrl
    ? /^https?:\/\//i.test(avatarUrl)
      ? avatarUrl
      : `${API_URL}/${avatarUrl.replace(/^\/+/, "")}`
    : null;

  return (
    <div
      // Size overrides applied via style only if not using the 'messages' fixed h-7/w-7 dimensions
      style={variant !== "messages" ? { width: size, height: size } : undefined}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${variantClasses} ${className}`}
    >
      <span>{initials}</span>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => { event.currentTarget.style.display = "none"; }}
        />
      )}
    </div>
  )
}
