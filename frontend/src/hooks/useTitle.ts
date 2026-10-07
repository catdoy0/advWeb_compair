import { useEffect } from "react"

export function useTitle(title: string) {
  useEffect(() => {
    if (title) document.title = `Compair: ${title}`
  })
}
