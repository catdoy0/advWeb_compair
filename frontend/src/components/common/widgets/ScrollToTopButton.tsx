import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"


export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const halfway =
        (document.documentElement.scrollHeight - window.innerHeight) / 2
      setVisible(scrolled > halfway)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`
        hover:cursor-pointer
        bg-slate-500/20
        fixed
        bottom-6
        right-6
        z-50
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        p-0
        shadow-md
        transition-all
        duration-300
        ${visible
          ? "animate-[bounce_1.3s_2.5] opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"}
      `}
    >
      <ArrowUp size={16} />
    </button>
  )
}
