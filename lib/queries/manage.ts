"use server"
import { supabaseServer } from "@/lib/supabase"
import type { BlockView, ReminderView, BlockState, ReminderState } from "@/lib/types"

function normaliseBlockState(raw: BlockState | BlockState[] | null): BlockState | null {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

function normaliseReminderState(raw: ReminderState | ReminderState[] | null): ReminderState | null {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

export async function getAllBlocks(): Promise<BlockView[]> {
  const db = supabaseServer()
  const { data, error } = await db
    .from("blocks")
    .select("*, cycles(id,block_id,position,enabled,cycle_items(id,cycle_id,name,image_path,position)), block_state(*)")
    .order("created_at")
  if (error) throw error
  return (data ?? [])
    .map((b) => {
      const state = normaliseBlockState(b.block_state)
      if (!state) return null
      return {
        ...b,
        cycles: (b.cycles ?? [])
          .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
          .map((c: { cycle_items: { position: number }[] }) => ({
            ...c,
            cycle_items: (c.cycle_items ?? []).sort(
              (a: { position: number }, b: { position: number }) => a.position - b.position
            ),
          })),
        state,
      }
    })
    .filter(Boolean) as BlockView[]
}

export async function getBlockById(id: string): Promise<BlockView | null> {
  const db = supabaseServer()
  const { data, error } = await db
    .from("blocks")
    .select("*, cycles(id,block_id,position,enabled,cycle_items(id,cycle_id,name,image_path,position)), block_state(*)")
    .eq("id", id)
    .single()
  if (error) return null
  const state = normaliseBlockState(data.block_state)
  if (!state) return null
  return {
    ...data,
    cycles: (data.cycles ?? [])
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      .map((c: { cycle_items: { position: number }[] }) => ({
        ...c,
        cycle_items: (c.cycle_items ?? []).sort(
          (a: { position: number }, b: { position: number }) => a.position - b.position
        ),
      })),
    state,
  }
}

export async function getAllReminders(): Promise<ReminderView[]> {
  const db = supabaseServer()
  const { data, error } = await db
    .from("reminders")
    .select("*, reminder_state(*)")
    .order("created_at")
  if (error) throw error
  return (data ?? [])
    .map((r) => {
      const state = normaliseReminderState(r.reminder_state)
      if (!state) return null
      return { ...r, state }
    })
    .filter(Boolean) as ReminderView[]
}
