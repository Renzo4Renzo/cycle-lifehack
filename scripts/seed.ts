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

interface CycleSeed {
  enabled?: boolean
  items: string[]
}

async function insertBlock(
  name: string,
  type: "manual" | "automatic",
  category: string,
  maxUses: number,
  cycles: CycleSeed[]
) {
  const { data: block } = await db
    .from("blocks")
    .insert({ name, type, category, max_uses: maxUses })
    .select()
    .single()

  for (let ci = 0; ci < cycles.length; ci++) {
    const enabled = cycles[ci].enabled ?? true
    const { data: cycle } = await db
      .from("cycles")
      .insert({ block_id: block.id, position: ci + 1, enabled })
      .select()
      .single()

    for (let ii = 0; ii < cycles[ci].items.length; ii++) {
      const itemName = cycles[ci].items[ii]
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

  const disabledCount = cycles.filter((c) => (c.enabled ?? true) === false).length
  const suffix = disabledCount > 0 ? ` (${disabledCount} cycle(s) disabled)` : ""
  console.log(`✓ Block: ${name}${suffix}`)
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

  await db.from("reminder_state").insert({ reminder_id: reminder.id, next_due_at: startsAt })
  console.log(`✓ Reminder: ${name}`)
}

async function main() {
  console.log("Seeding…")

  // ── Outfits ──────────────────────────────────────────────────────────────
  // Cycle 2 (Polo Shirt) is disabled — maybe it's in the wash
  await insertBlock("Outdoor Outfit", "manual", "outfits", 3, [
    { items: ["Away T-shirt", "Olive Charcoal", "Sockless Black"] },
    { enabled: false, items: ["Polo Shirt", "Chinos", "Sneakers"] },
    { items: ["Hoodie", "Joggers", "Running Shoes"] },
  ])

  // Both cycles active (standard auto block)
  await insertBlock("Home Outfit", "automatic", "outfits", 1, [
    { items: ["T-shirt", "Jogger"] },
    { items: ["Tank Top", "Shorts"] },
  ])

  // Three sets; Set B temporarily disabled
  await insertBlock("Underwear", "automatic", "outfits", 1, [
    { items: ["Set A"] },
    { enabled: false, items: ["Set B"] },
    { items: ["Set C"] },
  ])

  await insertBlock("Home Footwear", "automatic", "outfits", 1, [
    { items: ["Slippers"] },
    { items: ["Flip Flops"] },
  ])

  await insertReminder("Laundry Day", "outfits", 7, "2026-06-08")

  // ── Food ─────────────────────────────────────────────────────────────────
  // Cycle 3 (Tuna Wrap) disabled — not feeling it this rotation
  await insertBlock("Lunch", "manual", "food", 2, [
    { items: ["Boiled Eggs", "Rice and Beans", "Lemonade"] },
    { items: ["Chicken Salad", "Quinoa", "Green Tea"] },
    { enabled: false, items: ["Tuna Wrap", "Sweet Potato", "Agua Fresca"] },
  ])

  // Greek Yogurt disabled; only Cottage Cheese active
  await insertBlock("Eye Snacks/Dinner", "automatic", "food", 1, [
    { enabled: false, items: ["Greek Yogurt"] },
    { items: ["Cottage Cheese"] },
  ])

  await insertReminder("Cheat Day", "food", 14, "2026-06-15")

  console.log("Done!")
}

main().catch(console.error)
