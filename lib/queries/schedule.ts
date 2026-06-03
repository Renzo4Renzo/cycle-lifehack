"use server"
import { supabaseServer } from "@/lib/supabase"
import { formatDate, addDays } from "@/lib/date"
import { advanceCycleState, currentUses } from "@/lib/cycle"
import type { BlockView, ReminderView, BlockWithData, ReminderWithState, BlockState, ReminderState } from "@/lib/types"

function normaliseBlockState(raw: BlockState | BlockState[] | null): BlockState | null {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

function normaliseReminderState(raw: ReminderState | ReminderState[] | null): ReminderState | null {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

export async function getSchedule(
  category: string,
  today: Date
): Promise<{ blocks: BlockView[]; reminders: ReminderView[] }> {
  const db = supabaseServer()
  const todayStr = formatDate(today)

  const [{ data: blocksRaw, error: blockErr }, { data: remindersRaw, error: reminderErr }] =
    await Promise.all([
      db
        .from("blocks")
        .select("*, cycles(id,block_id,position,enabled,cycle_items(id,cycle_id,name,image_path,position)), block_state(*)")
        .eq("category", category)
        .order("created_at"),
      db
        .from("reminders")
        .select("*, reminder_state(*)")
        .eq("category", category)
        .order("created_at"),
    ])

  if (blockErr) throw blockErr
  if (reminderErr) throw reminderErr

  const blocks: BlockWithData[] = (blocksRaw ?? []).map((b) => ({
    ...b,
    cycles: (b.cycles ?? [])
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      .map((c: { cycle_items: { position: number }[] }) => ({
        ...c,
        cycle_items: (c.cycle_items ?? []).sort(
          (a: { position: number }, b: { position: number }) => a.position - b.position
        ),
      })),
  }))

  // Auto-advance overdue reminders
  const reminders: ReminderView[] = []
  for (const r of remindersRaw ?? []) {
    const state = normaliseReminderState(r.reminder_state)
    if (!state) continue
    let nextDue = state.next_due_at
    while (nextDue < todayStr) {
      nextDue = formatDate(addDays(new Date(nextDue), r.cadence_days))
    }
    if (nextDue !== state.next_due_at) {
      await db.from("reminder_state").update({ next_due_at: nextDue }).eq("reminder_id", r.id)
      state.next_due_at = nextDue
    }
    reminders.push({ ...r, state })
  }

  // Auto-advance automatic blocks
  const blockViews: BlockView[] = []
  for (const block of blocks) {
    const rawState = normaliseBlockState(block.block_state)
    if (!rawState) continue
    const state = { ...rawState }

    if (block.type === "automatic" && state.last_action_date !== todayStr && block.cycles.length > 0) {
      const uses = currentUses(state)
      const newUses = uses + 1
      if (newUses >= block.max_uses) {
        const updates = advanceCycleState(state, block.cycles)
        await db.from("block_state").update({ ...updates, last_action_date: todayStr }).eq("block_id", block.id)
        Object.assign(state, updates, { last_action_date: todayStr })
      } else {
        const updatedUses = [...state.uses_per_cycle]
        updatedUses[state.current_cycle_idx] = newUses
        await db.from("block_state").update({ uses_per_cycle: updatedUses, last_action_date: todayStr }).eq("block_id", block.id)
        state.uses_per_cycle = updatedUses
        state.last_action_date = todayStr
      }
    }

    blockViews.push({ ...block, state })
  }

  return { blocks: blockViews, reminders }
}
