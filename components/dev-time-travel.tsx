"use client"
import { useState, useRef, useEffect } from "react"
import { CalendarDays } from "lucide-react"
import { snapshotState, restoreState } from "@/lib/actions/sandbox-actions"

function readCookieDate(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)test-date=([^;]+)/)
  return match ? match[1] : null
}

function toDisplay(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}-${m}-${y.slice(2)}`
}

export default function DevTimeTravel({ todayStr }: { todayStr: string }) {
  const [date, setDate] = useState<string | null>(null)
  const [isSandbox, setIsSandbox] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Reads browser-only storage (cookie/localStorage) to hydrate state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(readCookieDate() ?? todayStr)
    setIsSandbox(localStorage.getItem("sandbox-snapshot") !== null)
  }, [todayStr])

  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") return null

  const applyDate = async () => {
    if (!date || busy) return
    setBusy(true)
    if (!localStorage.getItem("sandbox-snapshot")) {
      const snapshot = await snapshotState()
      localStorage.setItem("sandbox-snapshot", snapshot)
    }
    document.cookie = `test-date=${date}; path=/; max-age=86400`
    window.location.reload()
  }

  const openPicker = () => inputRef.current?.showPicker()

  const resetDate = async () => {
    if (busy) return
    setBusy(true)
    const snapshot = localStorage.getItem("sandbox-snapshot")
    if (snapshot) {
      await restoreState(snapshot)
      localStorage.removeItem("sandbox-snapshot")
    }
    document.cookie = "test-date=; path=/; max-age=0"
    setDate(todayStr)
    window.location.reload()
  }

  return (
    <div
      className={`fixed bottom-20 right-4 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg text-sm md:bottom-4 ${
        isSandbox
          ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
          : "border bg-card"
      }`}
    >
      {isSandbox && (
        <span className="font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
          SANDBOX
        </span>
      )}
      <button
        type="button"
        onClick={openPicker}
        className="flex items-center gap-2 cursor-pointer"
      >
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
        <span className="w-20 tabular-nums">{date ? toDisplay(date) : ""}</span>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={date ?? ""}
        onChange={(e) => setDate(e.target.value)}
        className="sr-only"
      />
      <button
        onClick={applyDate}
        disabled={busy}
        className="rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground disabled:opacity-50"
      >
        {busy ? "..." : "Set"}
      </button>
      <button
        onClick={resetDate}
        disabled={busy}
        className="text-base text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        ↺
      </button>
    </div>
  )
}
