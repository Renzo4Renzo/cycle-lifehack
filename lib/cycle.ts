import type { BlockState } from "./types"

export function currentUses(state: BlockState): number {
  return state.uses_per_cycle[state.current_cycle_idx] ?? 0
}

// Scan forward from current position for the next enabled cycle.
// If none ahead, wrap to the beginning (starts new rotation).
// On arrival, zero out the destination slot.
export function advanceCycleState(
  state: BlockState,
  cycles: { enabled: boolean }[]
): Pick<BlockState, "current_cycle_idx" | "uses_per_cycle"> {
  const n = cycles.length
  const cur = state.current_cycle_idx

  const tryNext = (): number | null => {
    for (let i = cur + 1; i < n; i++) {
      if (cycles[i].enabled) return i
    }
    for (let i = 0; i < n; i++) {
      if (cycles[i].enabled) return i
    }
    return null
  }

  const next = tryNext()
  if (next === null) return { current_cycle_idx: cur, uses_per_cycle: state.uses_per_cycle }

  const uses = [...state.uses_per_cycle]
  uses[next] = 0
  return { current_cycle_idx: next, uses_per_cycle: uses }
}

// Apply one day's worth of automatic-block progression: record a use of the
// current cycle, advancing to the next enabled cycle once max_uses is reached.
export function advanceAutoBlockDay(
  state: BlockState,
  cycles: { enabled: boolean }[],
  maxUses: number
): Pick<BlockState, "current_cycle_idx" | "uses_per_cycle"> {
  const newUses = currentUses(state) + 1
  if (newUses >= maxUses) return advanceCycleState(state, cycles)

  const usesPerCycle = [...state.uses_per_cycle]
  usesPerCycle[state.current_cycle_idx] = newUses
  return { current_cycle_idx: state.current_cycle_idx, uses_per_cycle: usesPerCycle }
}

// Inverse of advanceAutoBlockDay: undo one day's worth of progression.
export function retreatAutoBlockDay(
  state: BlockState,
  cycles: { enabled: boolean }[],
  maxUses: number
): Pick<BlockState, "current_cycle_idx" | "uses_per_cycle"> {
  if (currentUses(state) > 0) {
    const usesPerCycle = [...state.uses_per_cycle]
    usesPerCycle[state.current_cycle_idx] -= 1
    return { current_cycle_idx: state.current_cycle_idx, uses_per_cycle: usesPerCycle }
  }

  if (!cycles.some((c) => c.enabled)) {
    return { current_cycle_idx: state.current_cycle_idx, uses_per_cycle: state.uses_per_cycle }
  }

  const prev = restoreCycleState(state, cycles).current_cycle_idx
  const usesPerCycle = [...state.uses_per_cycle]
  usesPerCycle[prev] = maxUses - 1
  return { current_cycle_idx: prev, uses_per_cycle: usesPerCycle }
}

// Scan backward from current position for the previous enabled cycle.
// If none behind, wrap to the end.
export function restoreCycleState(
  state: BlockState,
  cycles: { enabled: boolean }[]
): Pick<BlockState, "current_cycle_idx"> {
  const n = cycles.length
  const cur = state.current_cycle_idx

  for (let i = cur - 1; i >= 0; i--) {
    if (cycles[i].enabled) return { current_cycle_idx: i }
  }
  for (let i = n - 1; i >= 0; i--) {
    if (cycles[i].enabled) return { current_cycle_idx: i }
  }
  return { current_cycle_idx: cur }
}
