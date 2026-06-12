"use server"
import { supabaseServer } from "@/lib/supabase"

function assertDevMode() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
    throw new Error("sandbox-actions: only available in dev mode")
  }
}

export async function snapshotState(): Promise<string> {
  assertDevMode()
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
  assertDevMode()
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

  if (!isValidSnapshot(payload)) {
    throw new Error("sandbox-actions: invalid snapshot shape")
  }

  const ops: PromiseLike<unknown>[] = []

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

function isValidSnapshot(payload: unknown): payload is {
  blockStates: Array<{ block_id: string; current_cycle_idx: number; uses_per_cycle: number[]; last_action_date: string | null }>
  reminderStates: Array<{ reminder_id: string; next_due_at: string }>
} {
  if (typeof payload !== "object" || payload === null) return false
  const p = payload as Record<string, unknown>
  if (!Array.isArray(p.blockStates) || !Array.isArray(p.reminderStates)) return false

  return (
    p.blockStates.every(
      (b) =>
        typeof b === "object" &&
        b !== null &&
        typeof (b as Record<string, unknown>).block_id === "string" &&
        Number.isInteger((b as Record<string, unknown>).current_cycle_idx) &&
        (b as { current_cycle_idx: number }).current_cycle_idx >= 0 &&
        Array.isArray((b as Record<string, unknown>).uses_per_cycle) &&
        ((b as { uses_per_cycle: unknown[] }).uses_per_cycle).every(
          (u): u is number => Number.isInteger(u) && (u as number) >= 0
        ) &&
        (typeof (b as Record<string, unknown>).last_action_date === "string" ||
          (b as Record<string, unknown>).last_action_date === null)
    ) &&
    p.reminderStates.every(
      (r) =>
        typeof r === "object" &&
        r !== null &&
        typeof (r as Record<string, unknown>).reminder_id === "string" &&
        typeof (r as Record<string, unknown>).next_due_at === "string"
    )
  )
}
