interface UserAvatarProps {
  initials: string
  size?: number
  tone?: "primary" | "sidebar"
  className?: string
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
}: UserAvatarProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {initials}
    </div>
  )
}
