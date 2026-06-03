"use server"
import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase"
import { getToday, formatDate } from "@/lib/date"
import { advanceCycleState, currentUses, restoreCycleState } from "@/lib/cycle"
import type { BlockState } from "@/lib/types"

async function fetchState(blockId: string): Promise<BlockState> {
  const db = supabaseServer()
  const { data, error } = await db
    .from("block_state")
    .select("*")
    .eq("block_id", blockId)
    .single()
  if (error) throw error
  return data as BlockState
}

async function fetchTotalCycles(blockId: string): Promise<number> {
  const db = supabaseServer()
  const { count, error } = await db
    .from("cycles")
    .select("*", { count: "exact", head: true })
    .eq("block_id", blockId)
  if (error) throw error
  return count ?? 0
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
  const [state, totalCycles] = await Promise.all([
    fetchState(blockId),
    fetchTotalCycles(blockId),
  ])
  const updates = advanceCycleState(state, totalCycles)
  await db
    .from("block_state")
    .update({ ...updates, last_action_date: formatDate(await getToday()) })
    .eq("block_id", blockId)
  revalidatePath(`/${category}`)
}

export async function restoreCycle(blockId: string, category: string) {
  const db = supabaseServer()
  const [state, totalCycles] = await Promise.all([
    fetchState(blockId),
    fetchTotalCycles(blockId),
  ])
  const updates = restoreCycleState(state, totalCycles)
  await db
    .from("block_state")
    .update({ ...updates, last_action_date: formatDate(await getToday()) })
    .eq("block_id", blockId)
  revalidatePath(`/${category}`)
}
