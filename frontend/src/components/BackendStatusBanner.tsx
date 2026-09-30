import { useEffect, useState } from "react"

import { checkBackend } from "../api/config"
import CommonTopBanner from "./common/widgets/CommonToBanner"

export default function BackendStatusBanner() {
  const [backendAvailable, setBackendAvailable] = useState(true)

  useEffect(() => {
    let mounted = true

    async function check() {
      const result = await checkBackend()

      if (!mounted) {
        return
      }

      setBackendAvailable(result !== null)
    }

    check()

    const interval = setInterval(check, 5000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  if (backendAvailable) {
    return null
  }

  return (
    <div className="relative z-[100]">
      <CommonTopBanner variant="info">
        Unable to connect to server.
      </CommonTopBanner>
    </div>
  )
}
