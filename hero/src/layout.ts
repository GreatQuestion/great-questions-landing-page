/** The hero is laid out on a fixed canvas, then scaled to the page's width, so it looks the same at any size. */
export const CANVAS = { width: 1280, height: 720 }

/** The phone scene: a taller canvas, one message and one card at a time, sized to read at phone width. */
export const PHONE_CANVAS = { width: 400, height: 600 }
/** Narrow enough to read on a phone; the card drops its summary and buttons there so nothing wraps. */
export const PHONE_CARD_WIDTH = 360

export const SNIPPET_WIDTH = 360
/** Snippets are a little smaller while scattered, so a crowd of them fits. */
export const SCATTER_SCALE = 0.82
// The app's feed card width (feed column max-w-[52rem] less its px-5 padding), so cards lay out exactly as in the
// app, buttons on one line. They're scaled down to fit, never squeezed.
export const CARD_WIDTH = 792

export interface Point {
  x: number
  y: number
}

/** Seeded random (mulberry32), so the scatter is the same on every load. */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Where each snippet sits while the work is scattered: a jittered 4-column grid, below the status line. */
export function scatter(count: number, seed = 7): Point[] {
  const random = seeded(seed)
  const { width, height } = CANVAS
  const cols = 4
  const top = 56
  const rows = Math.ceil(count / cols)
  const cellW = width / cols
  const cellH = (height - top - 16) / rows
  const visualW = SNIPPET_WIDTH * SCATTER_SCALE
  // Positions are the unscaled box's top-left; scale is around the center, so the visible box is inset.
  const inset = (SNIPPET_WIDTH - visualW) / 2
  const margin = 20
  return Array.from({ length: count }, (_, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const left = col * cellW + (cellW - visualW) / 2 + (random() - 0.5) * 60
    return {
      x: Math.min(Math.max(left, margin), width - visualW - margin) - inset,
      y: top + row * cellH + random() * Math.max(0, cellH - 100) - 12,
    }
  })
}
