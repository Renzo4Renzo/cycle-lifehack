"use server"
import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase"
import { getToday, formatDate, addDays } from "@/lib/date"
import type { ReminderState } from "@/lib/types"

async function fetchReminderState(reminderId: string): Promise<ReminderState & { cadence_days: number }> {
  const db = supabaseServer()
  const { data, error } = await db
    .from("reminders")
    .select("cadence_days, reminder_state(*)")
    .eq("id", reminderId)
    .single()
  if (error) throw error
  const state = Array.isArray(data.reminder_state)
    ? data.reminder_state[0]
    : data.reminder_state
  return { ...state, cadence_days: data.cadence_days }
}

export async function advanceReminder(reminderId: string, category: string) {
  const db = supabaseServer()
  await fetchReminderState(reminderId)
  const today = await getToday()
  const nextDue = formatDate(today)
  await db
    .from("reminder_state")
    .update({ next_due_at: nextDue })
    .eq("reminder_id", reminderId)
  revalidatePath(`/${category}`)
}

export async function delayReminder(reminderId: string, category: string) {
  const db = supabaseServer()
  const { next_due_at } = await fetchReminderState(reminderId)
  const nextDue = formatDate(addDays(new Date(next_due_at), 1))
  await db
    .from("reminder_state")
    .update({ next_due_at: nextDue })
    .eq("reminder_id", reminderId)
  revalidatePath(`/${category}`)
}
