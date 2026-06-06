"use server"
import { supabaseServer } from "@/lib/supabase"

export async function snapshotState(): Promise<string> {
  const db = supabaseServer()

  const [{ data: blockStates, error: bErr }, { data: reminderStates, error: rErr }] =
    await Promise.all([
      db.from("block_state").select("block_id, current_cycle_idx, uses_per_cycle, last_action_date"),
      db.from("reminder_state").select("reminder_id, next_due_at"),
    ])

  if (bErr) throw bErr
  if (rErr) throw rErr

  return JSON.stringify({
    blockStates: blockStates ?? [],
    reminderStates: reminderStates ?? [],
  })
}

export async function restoreState(snapshotJson: string): Promise<void> {
  const db = supabaseServer()

  let payload: {
    blockStates: Array<{ block_id: string; current_cycle_idx: number; uses_per_cycle: number[]; last_action_date: string | null }>
    reminderStates: Array<{ reminder_id: string; next_due_at: string }>
  }

  try {
    payload = JSON.parse(snapshotJson)
  } catch {
    throw new Error("sandbox-actions: invalid snapshot JSON")
  }

  const ops: Promise<unknown>[] = []

  if (payload.blockStates.length > 0) {
    ops.push(
      db
        .from("block_state")
        .upsert(payload.blockStates, { onConflict: "block_id" })
        .then(({ error }) => { if (error) throw error })
    )
  }

  if (payload.reminderStates.length > 0) {
    ops.push(
      db
        .from("reminder_state")
        .upsert(payload.reminderStates, { onConflict: "reminder_id" })
        .then(({ error }) => { if (error) throw error })
    )
  }

  await Promise.all(ops)
}
