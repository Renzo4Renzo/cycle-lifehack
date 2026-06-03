import type { BlockState } from "./types"

export function currentUses(state: BlockState): number {
  return state.uses_per_cycle[state.current_cycle_idx] ?? 0
}

// Advance to the next cycle and zero out only the destination slot.
export function advanceCycleState(
  state: BlockState,
  totalCycles: number
): Pick<BlockState, "current_cycle_idx" | "uses_per_cycle"> {
  const next = (state.current_cycle_idx + 1) % totalCycles
  const uses = [...state.uses_per_cycle]
  uses[next] = 0
  return { current_cycle_idx: next, uses_per_cycle: uses }
}

// Restore to the previous cycle; the old slot's count is untouched.
export function restoreCycleState(
  state: BlockState,
  totalCycles: number
): Pick<BlockState, "current_cycle_idx"> {
  const prev =
    state.current_cycle_idx === 0
      ? totalCycles - 1
      : state.current_cycle_idx - 1
  return { current_cycle_idx: prev }
}
