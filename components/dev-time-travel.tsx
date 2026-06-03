"use client"
import { useState } from "react"
import { CalendarDays } from "lucide-react"

export default function DevTimeTravel() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") return null

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])

  const applyDate = () => {
    document.cookie = `test-date=${date}; path=/; max-age=86400`
    window.location.reload()
  }

  const resetDate = () => {
    document.cookie = "test-date=; path=/; max-age=0"
    window.location.reload()
  }

  return (
    <div className="fixed bottom-20 right-3 z-50 flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-lg text-xs md:bottom-4">
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border-none bg-transparent outline-none text-xs w-32"
      />
      <button onClick={applyDate} className="rounded bg-primary px-2 py-0.5 text-primary-foreground">
        Set
      </button>
      <button onClick={resetDate} className="text-muted-foreground hover:text-foreground">
        ↺
      </button>
    </div>
  )
}
