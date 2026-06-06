"use client"
import { useState, useRef, useEffect } from "react"
import { CalendarDays } from "lucide-react"
import { snapshotState, restoreState } from "@/lib/actions/sandbox-actions"

function localDateString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function readCookieDate(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)test-date=([^;]+)/)
  return match ? match[1] : null
}

function toDisplay(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}-${m}-${y.slice(2)}`
}

export default function DevTimeTravel() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") return null

  const [date, setDate] = useState<string | null>(null)
  const [isSandbox, setIsSandbox] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDate(readCookieDate() ?? localDateString())
    setIsSandbox(localStorage.getItem("sandbox-snapshot") !== null)
  }, [])

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

  const resetDate = async () => {
    if (busy) return
    setBusy(true)
    const snapshot = localStorage.getItem("sandbox-snapshot")
    if (snapshot) {
      await restoreState(snapshot)
      localStorage.removeItem("sandbox-snapshot")
    }
    document.cookie = "test-date=; path=/; max-age=0"
    setDate(localDateString())
    window.location.reload()
  }

  return (
    <div
      className={`fixed bottom-20 right-3 z-50 flex items-center gap-2 rounded-xl border px-3 py-2 shadow-lg text-xs md:bottom-4 ${
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
      <CalendarDays
        className="h-4 w-4 cursor-pointer text-muted-foreground"
        onClick={() => inputRef.current?.showPicker()}
      />
      <span className="w-16 tabular-nums">{date ? toDisplay(date) : ""}</span>
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
        className="rounded bg-primary px-2 py-0.5 text-primary-foreground disabled:opacity-50"
      >
        {busy ? "..." : "Set"}
      </button>
      <button
        onClick={resetDate}
        disabled={busy}
        className="text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        ↺
      </button>
    </div>
  )
}
