"use server"
import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase"
import { getCategories } from "@/lib/categories"

interface ItemInput {
  name: string
  imagePath: string | null
}

interface CycleInput {
  items: ItemInput[]
}

export async function createBlock(formData: FormData) {
  const db = supabaseServer()
  const name = formData.get("name") as string
  const type = formData.get("type") as "manual" | "automatic"
  const category = formData.get("category") as string
  const maxUses = Number(formData.get("max_uses"))
  const cyclesJson = formData.get("cycles") as string
  const cycles: CycleInput[] = JSON.parse(cyclesJson)

  const { data: block, error: blockErr } = await db
    .from("blocks")
    .insert({ name, type, category, max_uses: maxUses })
    .select()
    .single()
  if (blockErr) throw blockErr

  for (let ci = 0; ci < cycles.length; ci++) {
    const { data: cycle, error: cycleErr } = await db
      .from("cycles")
      .insert({ block_id: block.id, position: ci + 1 })
      .select()
      .single()
    if (cycleErr) throw cycleErr

    for (let ii = 0; ii < cycles[ci].items.length; ii++) {
      const item = cycles[ci].items[ii]
      let imagePath = item.imagePath

      const imageFile = formData.get(`image_${ci}_${ii}`) as File | null
      if (imageFile && imageFile.size > 0) {
        const ext = imageFile.name.split(".").pop() ?? "jpg"
        const path = `${block.id}/${cycle.id}/${Date.now()}-${ii}.${ext}`
        const { error: uploadErr } = await db.storage
          .from("cycle-images")
          .upload(path, await imageFile.arrayBuffer(), { contentType: imageFile.type })
        if (!uploadErr) imagePath = path
      }

      await db.from("cycle_items").insert({
        cycle_id: cycle.id,
        name: item.name,
        image_path: imagePath,
        position: ii + 1,
      })
    }
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
  const cyclesJson = formData.get("cycles") as string
  const cycles: CycleInput[] = JSON.parse(cyclesJson)

  await db.from("blocks").update({ name, type, category, max_uses: maxUses }).eq("id", blockId)

  // Delete existing cycles (cascade deletes items)
  await db.from("cycles").delete().eq("block_id", blockId)

  for (let ci = 0; ci < cycles.length; ci++) {
    const { data: cycle, error: cycleErr } = await db
      .from("cycles")
      .insert({ block_id: blockId, position: ci + 1 })
      .select()
      .single()
    if (cycleErr) throw cycleErr

    for (let ii = 0; ii < cycles[ci].items.length; ii++) {
      const item = cycles[ci].items[ii]
      let imagePath = item.imagePath

      const imageFile = formData.get(`image_${ci}_${ii}`) as File | null
      if (imageFile && imageFile.size > 0) {
        const ext = imageFile.name.split(".").pop() ?? "jpg"
        const path = `${blockId}/${cycle.id}/${Date.now()}-${ii}.${ext}`
        const { error: uploadErr } = await db.storage
          .from("cycle-images")
          .upload(path, await imageFile.arrayBuffer(), { contentType: imageFile.type })
        if (!uploadErr) imagePath = path
      }

      await db.from("cycle_items").insert({
        cycle_id: cycle.id,
        name: item.name,
        image_path: imagePath,
        position: ii + 1,
      })
    }
  }

  // Reset state to cycle 0 with zeroed uses
  await db.from("block_state").update({
    current_cycle_idx: 0,
    uses_per_cycle: new Array(cycles.length).fill(0),
    last_action_date: null,
  }).eq("block_id", blockId)

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

  await db
    .from("reminder_state")
    .insert({ reminder_id: reminder.id, next_due_at: startsAt })

  revalidatePaths()
}

export async function updateReminder(reminderId: string, formData: FormData) {
  const db = supabaseServer()
  const name = formData.get("name") as string
  const category = formData.get("category") as string
  const cadenceDays = Number(formData.get("cadence_days"))
  const startsAt = formData.get("starts_at") as string

  await db
    .from("reminders")
    .update({ name, category, cadence_days: cadenceDays, starts_at: startsAt })
    .eq("id", reminderId)

  await db
    .from("reminder_state")
    .update({ next_due_at: startsAt })
    .eq("reminder_id", reminderId)

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
