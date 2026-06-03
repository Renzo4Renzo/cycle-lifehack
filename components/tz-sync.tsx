"use client"
import { useEffect } from "react"

// Sets a 'tz' cookie so the server knows the browser's local timezone.
// Reloads once on first visit so the very first server render uses the correct date.
export default function TzSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const existing = document.cookie.split("; ").find((r) => r.startsWith("tz="))?.split("=")[1]
    if (existing !== tz) {
      document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=${365 * 24 * 60 * 60}`
      if (!existing) window.location.reload()
    }
  }, [])
  return null
}
