/**
 * Run with: npx tsx scripts/seed.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local" })

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function picsumUrl(name: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(name)}/300/300`
}

async function insertBlock(
  name: string,
  type: "manual" | "automatic",
  category: string,
  maxUses: number,
  cycles: string[][]
) {
  const { data: block } = await db
    .from("blocks")
    .insert({ name, type, category, max_uses: maxUses })
    .select()
    .single()

  for (let ci = 0; ci < cycles.length; ci++) {
    const { data: cycle } = await db
      .from("cycles")
      .insert({ block_id: block.id, position: ci + 1 })
      .select()
      .single()

    for (let ii = 0; ii < cycles[ci].length; ii++) {
      const itemName = cycles[ci][ii]
      await db.from("cycle_items").insert({
        cycle_id: cycle.id,
        name: itemName,
        image_path: picsumUrl(itemName),
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

  console.log(`✓ Block: ${name}`)
}

async function insertReminder(
  name: string,
  category: string,
  cadenceDays: number,
  startsAt: string
) {
  const { data: reminder } = await db
    .from("reminders")
    .insert({ name, category, cadence_days: cadenceDays, starts_at: startsAt })
    .select()
    .single()

  await db.from("reminder_state").insert({
    reminder_id: reminder.id,
    next_due_at: startsAt,
  })

  console.log(`✓ Reminder: ${name}`)
}

async function main() {
  console.log("Seeding…")

  // Outfits
  await insertBlock("Outdoor Outfit", "manual", "outfits", 3, [
    ["Away T-shirt", "Olive Charcoal", "Sockless Black"],
    ["Polo Shirt", "Chinos", "Sneakers"],
    ["Hoodie", "Joggers", "Running Shoes"],
  ])
  await insertBlock("Home Outfit", "automatic", "outfits", 1, [
    ["T-shirt", "Jogger"],
    ["Tank Top", "Shorts"],
  ])
  await insertBlock("Underwear", "automatic", "outfits", 1, [
    ["Set A"],
    ["Set B"],
    ["Set C"],
  ])
  await insertBlock("Home Footwear", "automatic", "outfits", 1, [
    ["Slippers"],
    ["Flip Flops"],
  ])
  await insertReminder("Laundry Day", "outfits", 7, "2026-06-01")

  // Food
  await insertBlock("Lunch", "manual", "food", 2, [
    ["Boiled Eggs", "Rice and Beans", "Lemonade"],
    ["Chicken Salad", "Quinoa", "Green Tea"],
    ["Tuna Wrap", "Sweet Potato", "Agua Fresca"],
  ])
  await insertBlock("Eye Snacks/Dinner", "automatic", "food", 1, [
    ["Greek Yogurt"],
    ["Cottage Cheese"],
  ])
  await insertReminder("Cheat Day", "food", 14, "2026-06-01")

  console.log("Done!")
}

main().catch(console.error)
