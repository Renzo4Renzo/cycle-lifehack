"use server"
import { supabaseServer } from "@/lib/supabase"
import { formatDate, addDays, diffDays } from "@/lib/date"
import { advanceAutoBlockDay, retreatAutoBlockDay } from "@/lib/cycle"
import type { BlockView, ReminderView, BlockWithData, BlockState, ReminderState } from "@/lib/types"

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
      // Replay one day's progression per day of difference from the persisted
      // anchor, forward or backward, so jumping to any date (e.g. dev
      // time-travel) lands on the same cycle as visiting each day in between
      // — and is fully reversible (no drift when jumping back and forth).
      const daysPassed = state.last_action_date === null
        ? 1
        : diffDays(new Date(state.last_action_date), today)

      if (daysPassed > 0) {
        for (let i = 0; i < daysPassed; i++) {
          Object.assign(state, advanceAutoBlockDay(state, block.cycles, block.max_uses))
        }
      } else {
        for (let i = 0; i < -daysPassed; i++) {
          Object.assign(state, retreatAutoBlockDay(state, block.cycles, block.max_uses))
        }
      }
      state.last_action_date = todayStr
      await db.from("block_state").update({
        current_cycle_idx: state.current_cycle_idx,
        uses_per_cycle: state.uses_per_cycle,
        last_action_date: todayStr,
      }).eq("block_id", block.id)
    }

    blockViews.push({ ...block, state })
  }

  return { blocks: blockViews, reminders }
}
