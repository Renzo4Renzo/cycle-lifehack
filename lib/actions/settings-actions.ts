"use server"
import { supabaseServer } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function saveScheduleTimezone(offsetMinutes: number) {
  const db = supabaseServer()
  const { error } = await db
    .from("settings")
    .upsert({ id: 1, schedule_tz_offset: offsetMinutes })
  if (error) throw error
  revalidatePath("/", "layout")
}
