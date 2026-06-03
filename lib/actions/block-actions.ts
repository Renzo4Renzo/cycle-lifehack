"use server"
import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase"
import { getToday, formatDate } from "@/lib/date"
import { advanceCycleState, currentUses, restoreCycleState } from "@/lib/cycle"
import type { BlockState } from "@/lib/types"

async function fetchState(blockId: string): Promise<BlockState> {
  const db = supabaseServer()
  const { data, error } = await db.from("block_state").select("*").eq("block_id", blockId).single()
  if (error) throw error
  return data as BlockState
}

async function fetchCycles(blockId: string): Promise<{ id: string; enabled: boolean }[]> {
  const db = supabaseServer()
  const { data, error } = await db
    .from("cycles")
    .select("id, enabled")
    .eq("block_id", blockId)
    .order("position")
  if (error) throw error
  return (data ?? []) as { id: string; enabled: boolean }[]
}

export async function addUse(blockId: string, category: string) {
  const db = supabaseServer()
  const state = await fetchState(blockId)
  const uses = [...state.uses_per_cycle]
  uses[state.current_cycle_idx] = (uses[state.current_cycle_idx] ?? 0) + 1
  await db
    .from("block_state")
    .update({ uses_per_cycle: uses, last_action_date: formatDate(await getToday()) })
    .eq("block_id", blockId)
  revalidatePath(`/${category}`)
}

export async function completeCycle(blockId: string, category: string) {
  const db = supabaseServer()
  const [state, cycles] = await Promise.all([fetchState(blockId), fetchCycles(blockId)])
  const updates = advanceCycleState(state, cycles)
  await db
    .from("block_state")
    .update({ ...updates, last_action_date: formatDate(await getToday()) })
    .eq("block_id", blockId)
  revalidatePath(`/${category}`)
}

export async function restoreCycle(blockId: string, category: string) {
  const db = supabaseServer()
  const [state, cycles] = await Promise.all([fetchState(blockId), fetchCycles(blockId)])
  const updates = restoreCycleState(state, cycles)
  await db
    .from("block_state")
    .update({ ...updates, last_action_date: formatDate(await getToday()) })
    .eq("block_id", blockId)
  revalidatePath(`/${category}`)
}
