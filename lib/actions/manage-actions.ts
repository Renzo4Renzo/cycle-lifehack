"use server"
import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase"
import { getCategories } from "@/lib/categories"
import type { BlockState } from "@/lib/types"

interface ItemInput {
  name: string
  imagePath: string | null
}

interface CycleInput {
  id?: string
  enabled: boolean
  items: ItemInput[]
}

async function upsertCycleItems(
  db: ReturnType<typeof import("@/lib/supabase").supabaseServer>,
  blockId: string,
  cycleId: string,
  ci: number,
  items: ItemInput[],
  formData: FormData
) {
  await db.from("cycle_items").delete().eq("cycle_id", cycleId)
  for (let ii = 0; ii < items.length; ii++) {
    let imagePath = items[ii].imagePath
    const imageFile = formData.get(`image_${ci}_${ii}`) as File | null
    if (imageFile && imageFile.size > 0) {
      const ext = imageFile.name.split(".").pop() ?? "jpg"
      const path = `${blockId}/${cycleId}/${Date.now()}-${ii}.${ext}`
      const { error } = await db.storage
        .from("cycle-images")
        .upload(path, await imageFile.arrayBuffer(), { contentType: imageFile.type })
      if (!error) imagePath = path
    }
    await db.from("cycle_items").insert({
      cycle_id: cycleId,
      name: items[ii].name,
      image_path: imagePath,
      position: ii + 1,
    })
  }
}

export async function createBlock(formData: FormData) {
  const db = supabaseServer()
  const name = formData.get("name") as string
  const type = formData.get("type") as "manual" | "automatic"
  const category = formData.get("category") as string
  const maxUses = Number(formData.get("max_uses"))
  const cycles: CycleInput[] = JSON.parse(formData.get("cycles") as string)

  const { data: block, error: blockErr } = await db
    .from("blocks")
    .insert({ name, type, category, max_uses: maxUses })
    .select()
    .single()
  if (blockErr) throw blockErr

  for (let ci = 0; ci < cycles.length; ci++) {
    const { data: cycle, error: cycleErr } = await db
      .from("cycles")
      .insert({ block_id: block.id, position: ci + 1, enabled: cycles[ci].enabled })
      .select()
      .single()
    if (cycleErr) throw cycleErr
    await upsertCycleItems(db, block.id, cycle.id, ci, cycles[ci].items, formData)
  }

  await db.from("block_state").insert({
    block_id: block.id,
    current_cycle_idx: 0,
    uses_per_cycle: new Array(cycles.length).fill(0),
    last_action_date: null,
  })

  revalidatePaths()
}

export async function updateBlock(blockId: string, formData: FormData) {
  const db = supabaseServer()
  const name = formData.get("name") as string
  const type = formData.get("type") as "manual" | "automatic"
  const category = formData.get("category") as string
  const maxUses = Number(formData.get("max_uses"))
  const cycles: CycleInput[] = JSON.parse(formData.get("cycles") as string)

  await db.from("blocks").update({ name, type, category, max_uses: maxUses }).eq("id", blockId)

  // Load old cycles and state for smart state preservation
  const [{ data: oldCyclesData }, { data: oldStateData }] = await Promise.all([
    db.from("cycles").select("id, position").eq("block_id", blockId).order("position"),
    db.from("block_state").select("*").eq("block_id", blockId).single(),
  ])

  const oldCycles = oldCyclesData ?? []
  const oldState = (oldStateData ?? { current_cycle_idx: 0, uses_per_cycle: [] }) as BlockState
  const oldUses = oldState.uses_per_cycle ?? []
  const oldIdToIdx = new Map(oldCycles.map((c, i) => [c.id, i]))
  const currentOldCycleId = oldCycles[oldState.current_cycle_idx]?.id
  const incomingIds = new Set(cycles.filter((c) => c.id).map((c) => c.id!))

  // Delete cycles removed from the form
  for (const old of oldCycles) {
    if (!incomingIds.has(old.id)) {
      await db.from("cycles").delete().eq("id", old.id)
    }
  }

  // Update existing cycles and insert new ones
  for (let ci = 0; ci < cycles.length; ci++) {
    const cycle = cycles[ci]
    let cycleId: string

    if (cycle.id && incomingIds.has(cycle.id)) {
      await db.from("cycles").update({ position: ci + 1, enabled: cycle.enabled }).eq("id", cycle.id)
      cycleId = cycle.id
    } else {
      const { data: newCycle, error } = await db
        .from("cycles")
        .insert({ block_id: blockId, position: ci + 1, enabled: cycle.enabled })
        .select()
        .single()
      if (error) throw error
      cycleId = newCycle.id
    }

    await upsertCycleItems(db, blockId, cycleId, ci, cycle.items, formData)
  }

  // Preserve uses for cycles that still exist (matched by ID); zero for new ones
  const newUses = cycles.map((c) => {
    if (c.id) {
      const oldIdx = oldIdToIdx.get(c.id)
      return oldIdx !== undefined ? (oldUses[oldIdx] ?? 0) : 0
    }
    return 0
  })

  // Keep current_cycle_idx pointing at the same cycle (by ID) if it still exists
  let newCurrentIdx = 0
  if (currentOldCycleId) {
    const found = cycles.findIndex((c) => c.id === currentOldCycleId)
    if (found >= 0) {
      newCurrentIdx = found
    } else {
      // Current cycle was deleted — land on first enabled cycle
      const firstEnabled = cycles.findIndex((c) => c.enabled)
      newCurrentIdx = firstEnabled >= 0 ? firstEnabled : 0
    }
  }
  newCurrentIdx = Math.max(0, Math.min(newCurrentIdx, cycles.length - 1))

  await db.from("block_state")
    .update({ current_cycle_idx: newCurrentIdx, uses_per_cycle: newUses })
    .eq("block_id", blockId)

  revalidatePaths()
}

export async function deleteBlock(blockId: string) {
  const db = supabaseServer()
  await db.from("blocks").delete().eq("id", blockId)
  revalidatePaths()
}

export async function createReminder(formData: FormData) {
  const db = supabaseServer()
  const name = formData.get("name") as string
  const category = formData.get("category") as string
  const cadenceDays = Number(formData.get("cadence_days"))
  const startsAt = formData.get("starts_at") as string

  const { data: reminder, error } = await db
    .from("reminders")
    .insert({ name, category, cadence_days: cadenceDays, starts_at: startsAt })
    .select()
    .single()
  if (error) throw error

  await db.from("reminder_state").insert({ reminder_id: reminder.id, next_due_at: startsAt })
  revalidatePaths()
}

export async function updateReminder(reminderId: string, formData: FormData) {
  const db = supabaseServer()
  const name = formData.get("name") as string
  const category = formData.get("category") as string
  const cadenceDays = Number(formData.get("cadence_days"))
  const startsAt = formData.get("starts_at") as string

  await db.from("reminders")
    .update({ name, category, cadence_days: cadenceDays, starts_at: startsAt })
    .eq("id", reminderId)
  await db.from("reminder_state").update({ next_due_at: startsAt }).eq("reminder_id", reminderId)
  revalidatePaths()
}

export async function deleteReminder(reminderId: string) {
  const db = supabaseServer()
  await db.from("reminders").delete().eq("id", reminderId)
  revalidatePaths()
}

function revalidatePaths() {
  revalidatePath("/manage/blocks")
  revalidatePath("/manage/reminders")
  for (const cat of getCategories()) {
    revalidatePath(`/${cat}`)
  }
}
