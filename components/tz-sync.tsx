"use client"
import { useEffect } from "react"

// The browser computes today's date in its local timezone and writes it as a
// cookie. The server reads that string directly — no timezone math needed.
// Reloads when the stored date doesn't match (first visit, or date rolled over).
export default function TzSync() {
  useEffect(() => {
    const d = new Date()
    const localDate = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-")

    const existing = document.cookie
      .split("; ")
      .find((r) => r.startsWith("local-date="))
      ?.split("=")[1]

    if (existing !== localDate) {
      document.cookie = `local-date=${localDate}; path=/; max-age=86400`
      window.location.reload()
    }
  }, [])

  return null
}
