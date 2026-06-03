"use client"
import { useTransition, useOptimistic } from "react"
import { Bell, FastForward, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { advanceReminder, delayReminder } from "@/lib/actions/reminder-actions"
import { addDays } from "@/lib/date-utils"
import type { ReminderView } from "@/lib/types"

function daysUntil(nextDueStr: string, todayStr: string): number {
  const due = new Date(nextDueStr)
  const today = new Date(todayStr)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function ReminderCard({
  reminder,
  todayStr,
  category,
}: {
  reminder: ReminderView
  todayStr: string
  category: string
}) {
  const [isPending, startTransition] = useTransition()
  const [optimisticDue, setOptimisticDue] = useOptimistic(reminder.state.next_due_at)

  const days = daysUntil(optimisticDue, todayStr)
  const isDueToday = days <= 0

  const handleAdvance = () => {
    const next = new Date(todayStr)
    next.setDate(next.getDate() + reminder.cadence_days)
    const nextStr = next.toISOString().split("T")[0]
    startTransition(async () => {
      setOptimisticDue(nextStr)
      await advanceReminder(reminder.id, category)
    })
  }

  const handleDelay = () => {
    const next = addDays(new Date(optimisticDue), 1).toISOString().split("T")[0]
    startTransition(async () => {
      setOptimisticDue(next)
      await delayReminder(reminder.id, category)
    })
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">{reminder.name}</p>
          <p className={`text-xs ${isDueToday ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {isDueToday ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleAdvance}
        >
          <FastForward className="h-3 w-3 mr-1" />
          Advance
        </Button>
        {isDueToday && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={handleDelay}
          >
            <Clock className="h-3 w-3 mr-1" />
            Delay
          </Button>
        )}
      </div>
    </div>
  )
}
