import googleLogoUrl from "../../../assets/Google__G__logo.svg"

type GoogleLogoProps = {
  size?: number
  className?: string
  alt?: string
}

export default function GoogleLogo({
  size = 16,
  className,
  alt = "",
}: GoogleLogoProps) {
  return (
    <img
      src={googleLogoUrl}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  )
}
