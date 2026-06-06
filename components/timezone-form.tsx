"use client"
import { useState, useTransition } from "react"
import { TZ_OFFSETS } from "@/lib/tz-offsets"
import { saveScheduleTimezone } from "@/lib/actions/settings-actions"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

export default function TimezoneForm({ currentOffset }: { currentOffset: number }) {
  const [selected, setSelected] = useState(String(currentOffset))

  const selectedTz = TZ_OFFSETS.find((tz) => String(tz.minutes) === selected)
  const displayLabel = selectedTz ? `${selectedTz.label} — ${selectedTz.cities}` : selected
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      await saveScheduleTimezone(Number(selected))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Cycles and reminders advance when the date changes in this timezone — not in
        the browser&apos;s local time. Pick wherever you primarily live.
      </p>

      <div className="space-y-2">
        <label className="text-sm font-medium">Schedule timezone</label>
        <Select value={selected} onValueChange={(v) => { setSelected(v); setSaved(false) }}>
          <SelectTrigger className="w-full">
            <span>{displayLabel}</span>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {TZ_OFFSETS.map((tz) => (
              <SelectItem key={tz.minutes} value={String(tz.minutes)}>
                <span className="font-mono text-xs">{tz.label}</span>
                <span className="text-muted-foreground"> — {tz.cities}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSave}
        disabled={isPending || saved || selected === String(currentOffset)}
      >
        {isPending ? "Saving…" : saved ? "Saved!" : "Save"}
      </Button>
    </div>
  )
}
