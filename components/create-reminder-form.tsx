"use client"
import { useState, useTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createReminder, updateReminder } from "@/lib/actions/manage-actions"
import { getCategories } from "@/lib/categories"
import type { ReminderView } from "@/lib/types"

interface FormState {
  name: string
  category: string
  cadenceDays: string
  startsAt: string
}

function defaultForm(categories: string[]): FormState {
  return {
    name: "",
    category: categories[0] ?? "outfits",
    cadenceDays: "7",
    startsAt: new Date().toISOString().split("T")[0],
  }
}

function reminderToForm(r: ReminderView): FormState {
  return {
    name: r.name,
    category: r.category,
    cadenceDays: String(r.cadence_days),
    startsAt: r.state.next_due_at,
  }
}

export default function CreateReminderForm({
  reminder,
  onDone,
}: {
  reminder?: ReminderView
  onDone: () => void
}) {
  const categories = getCategories()
  const [form, setForm] = useState<FormState>(
    reminder ? reminderToForm(reminder) : defaultForm(categories)
  )
  const [isPending, startTransition] = useTransition()
  const dateRef = useRef<HTMLInputElement>(null)

  const toDisplay = (iso: string) => {
    const [y, m, d] = iso.split("-")
    return `${d}-${m}-${y.slice(2)}`
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const fd = new FormData()
      fd.append("name", form.name)
      fd.append("category", form.category)
      fd.append("cadence_days", form.cadenceDays)
      fd.append("starts_at", form.startsAt)
      if (reminder) {
        await updateReminder(reminder.id, fd)
      } else {
        await createReminder(fd)
      }
      onDone()
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Reminder name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Laundry Day"
        />
      </div>
      <div className="space-y-1">
        <Label>Category</Label>
        <Select
          value={form.category}
          onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? f.category }))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Cadence (days)</Label>
        <Input
          type="number"
          min={1}
          value={form.cadenceDays}
          onChange={(e) => setForm((f) => ({ ...f, cadenceDays: e.target.value }))}
        />
      </div>
      <div className="space-y-1">
        <Label>Next due date</Label>
        <Input
          value={form.startsAt ? toDisplay(form.startsAt) : ""}
          readOnly
          placeholder="DD-MM-YY"
          className="cursor-pointer"
          onClick={() => dateRef.current?.showPicker()}
        />
        <input
          ref={dateRef}
          type="date"
          value={form.startsAt}
          onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
          className="sr-only"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone} disabled={isPending}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isPending || !form.name}>
          {isPending ? "Saving…" : reminder ? "Save changes" : "Create reminder"}
        </Button>
      </div>
    </div>
  )
}
