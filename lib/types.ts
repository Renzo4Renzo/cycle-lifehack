export type BlockType = "manual" | "automatic"

export interface Block {
  id: string
  name: string
  type: BlockType
  category: string
  max_uses: number
  created_at: string
}

export interface Cycle {
  id: string
  block_id: string
  position: number
  enabled: boolean
}

export interface CycleItem {
  id: string
  cycle_id: string
  name: string
  image_path: string | null
  position: number
}

export interface CycleWithItems extends Cycle {
  cycle_items: CycleItem[]
}

export interface BlockState {
  block_id: string
  current_cycle_idx: number
  uses_per_cycle: number[]
  last_action_date: string | null
}

export interface BlockWithData extends Block {
  cycles: CycleWithItems[]
  // Supabase may return as object or single-element array; normalised in queries
  block_state: BlockState | BlockState[] | null
}

export interface Reminder {
  id: string
  name: string
  category: string
  cadence_days: number
  starts_at: string
  created_at: string
}

export interface ReminderState {
  reminder_id: string
  next_due_at: string
}

export interface ReminderWithState extends Reminder {
  reminder_state: ReminderState | ReminderState[] | null
}

// Normalised views used throughout the UI (never null)
export interface BlockView extends Block {
  cycles: CycleWithItems[]
  state: BlockState
}

export interface ReminderView extends Reminder {
  state: ReminderState
}
