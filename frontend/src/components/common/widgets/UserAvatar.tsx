interface UserAvatarProps {
  initials: string
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
  size = 32,
  tone = "primary",
  className = "",
  variant = "user"
}: UserAvatarProps) {
  
  // Apply the custom styles if the variant is 'messages', otherwise fallback to tone-based classes
  const variantClasses = variant === "messages" 
    ? "h-7 w-7 bg-[#dceaff] text-[9px] font-bold text-[#2870e8]" 
    : `text-xs font-semibold ${tones[tone]}`;

  return (
    <div
      // Size overrides applied via style only if not using the 'messages' fixed h-7/w-7 dimensions
      style={variant !== "messages" ? { width: size, height: size } : undefined}
      className={`flex shrink-0 items-center justify-center rounded-full ${variantClasses} ${className}`}
    >
      {initials}
    </div>
  )
}
