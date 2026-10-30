import { gsap } from 'gsap'

import { QUESTION_ORDER, SNIPPETS } from './copy'
import { CANVAS, CARD_WIDTH, SCATTER_SCALE, SNIPPET_WIDTH, scatter } from './layout'
import {
  CLEAR, EASE, LIFTED, LIT, RESTING, UNLIT, cardParts, countThreads, fileSource, inside, liftAssumption, step,
  type CardLayout, type Parts,
} from './motion'

/** Seconds per question. The loop runs one cycle per question, then starts over. */
export const CYCLE = 19.4
/** Where the loop rests for people who prefer reduced motion: the first question's card, fully built. */
export const STILL_AT = 16

interface Cycle {
  tl: gsap.core.Timeline
  parts: Parts
  focus: string
  /** Seconds from the loop's start to this cycle's start. */
  t0: number
}

/** The whole loop: noise, make sense of it, surface the assumptions, the card, hand-off. One cycle per question. */
export function buildLoop(root: HTMLElement): gsap.core.Timeline {
  const items = [...root.querySelectorAll<HTMLElement>('[data-item]')]
  const parts: Parts = {
    root,
    items,
    status: root.querySelector<HTMLElement>('[data-status]')!,
    steps: root.querySelector<HTMLElement>('[data-steps]')!,
    ghost: root.querySelector<HTMLElement>('[data-ghost]')!,
    cards: QUESTION_ORDER.map((id) => root.querySelector<HTMLElement>(`[data-card="${id}"]`)!),
    start: scatter(items.length),
  }
  const tl = gsap.timeline({ repeat: -1 })
  QUESTION_ORDER.forEach((focus, index) => {
    const cycle = { tl, parts, focus, t0: index * CYCLE }
    reset(cycle)
    noise(cycle)
    makeSense(cycle)
    surface(cycle)
    showCard(cycle)
    handOff(cycle)
  })
  return tl
}

const isExtra = (index: number) => Boolean(SNIPPETS[index].extra)
const isDecision = (index: number) => Boolean(SNIPPETS[index].question)
const decisionEl = ({ items }: Parts, id: string) => items[SNIPPETS.findIndex((snippet) => snippet.question === id)]

function reset({ tl, parts, t0 }: Cycle) {
  const { items, start, status, cards, root } = parts
  tl.set(items, { opacity: 0, x: (i: number) => start[i].x, y: (i: number) => start[i].y, scale: SCATTER_SCALE, zIndex: 0, filter: 'contrast(1) brightness(1)' }, t0)
  tl.set(root.querySelectorAll('[data-snippet]'), { boxShadow: RESTING }, t0)
  tl.set(root.querySelectorAll('[data-flag], [data-verdict]'), { opacity: 0 }, t0)
  tl.set(root.querySelectorAll('[data-highlight]'), { backgroundColor: CLEAR }, t0)
  tl.set(status, { opacity: 0, textContent: '' }, t0)
  tl.set(cards, { opacity: 0, transformOrigin: '0 0' }, t0)
  // Each cycle builds its card from hidden parts; the rest of the time every card shows whole.
  tl.set(cards.flatMap((card) => Object.values(cardParts(card))), { opacity: 1, y: 0 }, t0)
  // fromTo tweens apply their start values when the loop is built, so clear the tints they start from.
  tl.set(cards.flatMap((card) => [cardParts(card).assumption, cardParts(card).chip]), { backgroundColor: CLEAR }, t0)
  tl.set([parts.steps, parts.ghost], { opacity: 0 }, t0)
}

/** Beat 1: the work piles up across the frame, faster and faster. */
function noise({ tl, parts, t0 }: Cycle) {
  const { items, start } = parts
  items.forEach((el, index) => {
    // Square-root spacing: the gaps shrink, so it feels like the work keeps piling up.
    const at = t0 + 0.15 + 2.3 * Math.sqrt(index / items.length)
    tl.fromTo(el, { opacity: 0, y: start[index].y + 12 }, { opacity: 1, y: start[index].y, duration: 0.5, ease: EASE.out }, at)
  })
  tl.to(items.filter((_, index) => isExtra(index)), { opacity: 0, duration: 0.5, ease: EASE.in }, t0 + 2.9)
}

/**
 * Beat 2: it reads each message in turn and makes a call, tagged on the message. Then the message moves to its
 * pile: routine work stacks up, dimmed, on the left; the untested assumptions gather on the right.
 */
function makeSense({ tl, parts, t0 }: Cycle) {
  const { items, start } = parts
  // Read in reading order: row by row (the scatter fills 4 to a row), left to right.
  const row = (index: number) => Math.floor(index / 4)
  const core = items
    .map((el, index) => ({ el, index }))
    .filter(({ index }) => !isExtra(index))
    .sort((a, b) => row(a.index) - row(b.index) || start[a.index].x - start[b.index].x)
    .map(({ el }) => el)
  const sweepStart = t0 + 3.3
  const interval = 0.4
  const piles = sortPiles()
  tl.to(core, { opacity: 0.45, duration: 0.4, ease: EASE.inOut }, t0 + 3.0)
  core.forEach((el, order) => {
    const at = sweepStart + interval * order
    const box = inside(el, '[data-snippet]')!
    tl.to(el, { opacity: 1, scale: SCATTER_SCALE * 1.06, zIndex: 10 + order, duration: 0.12, ease: EASE.out }, at - 0.08)
    tl.to(box, { boxShadow: LIFTED, duration: 0.12, ease: EASE.out }, at - 0.08)
    tl.fromTo(inside(el, '[data-verdict]'), { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.2, ease: EASE.out }, at + 0.05)
    const target = isDecision(items.indexOf(el)) ? piles.assumption(box.offsetHeight) : piles.routine(box.offsetHeight)
    tl.to(el, { ...target, duration: 0.55, ease: EASE.inOut }, at + 0.4)
    tl.to(box, { boxShadow: RESTING, duration: 0.4, ease: EASE.inOut }, at + 0.4)
  })
  countThreads(tl, parts, t0 + 3.0, sweepStart, interval * (core.length - 1))
}

/** Where read messages go: a dim stack bottom-left for routine work, a column on the right for assumptions. */
function sortPiles() {
  const margin = 32
  const routineScale = 0.62
  const assumptionScale = 0.9
  let routineCount = 0
  let assumptionTop = 100
  // Scale is around the center: these turn a scaled box's top-left into the unscaled box's position.
  const place = (left: number, top: number, h: number, scale: number) => ({
    x: left - (SNIPPET_WIDTH * (1 - scale)) / 2,
    y: top - (h * (1 - scale)) / 2,
    scale,
  })
  return {
    routine(h: number) {
      // A deck: each card lands a little higher, over the last, so only the edges of earlier ones show. Dimmed
      // with contrast rather than opacity, so cards underneath don't show through.
      const top = CANVAS.height - margin - h * routineScale - routineCount * 10
      routineCount += 1
      return { ...place(margin, top, h, routineScale), opacity: 1, filter: 'contrast(0.45) brightness(1.12)' }
    },
    assumption(h: number) {
      const top = assumptionTop
      assumptionTop += h * assumptionScale + 22
      return { ...place(CANVAS.width - margin - SNIPPET_WIDTH * assumptionScale, top, h, assumptionScale), opacity: 1, filter: 'contrast(1) brightness(1)' }
    },
  }
}

/** Beat 3: the routine work leaves, the three decisions line up, and each one's risky part lights up in turn. */
function surface({ tl, parts, t0 }: Cycle) {
  const { items } = parts
  tl.to(items.filter((_, index) => !isDecision(index)), { opacity: 0, duration: 0.3, ease: EASE.in }, t0 + 7.8)
  const scale = 1.1
  const gap = 22
  const decisions = QUESTION_ORDER.map((id) => decisionEl(parts, id))
  const heights = decisions.map((el) => inside(el, '[data-snippet]')!.offsetHeight)
  const total = heights.reduce((sum, h) => sum + h * scale, 0) + gap * (decisions.length - 1)
  let top = (CANVAS.height - total) / 2 + 12
  decisions.forEach((el, index) => {
    const h = heights[index]
    // Scale is around the center: place the unscaled box so the scaled one's top lands on `top`.
    const y = top - h / 2 + (h * scale) / 2
    top += h * scale + gap
    tl.to(el, { x: CANVAS.width / 2 - SNIPPET_WIDTH / 2, y, scale, duration: 0.7, ease: EASE.inOut }, t0 + 7.8)
    const at = t0 + 8.7 + index * 0.6
    tl.to(inside(el, '[data-flag]'), { opacity: 1, duration: 0.25, ease: EASE.out }, at)
    // Its flag says the same as the tag, with the stakes; the tag steps aside.
    tl.to(inside(el, '[data-verdict]'), { opacity: 0, duration: 0.25, ease: EASE.inOut }, at)
    tl.to(inside(el, '[data-highlight]'), { backgroundColor: LIT, duration: 0.3, ease: EASE.out }, at)
    // One lit accent at a time: the previous highlight settles to neutral as the next one lights.
    if (index > 0) tl.to(inside(decisions[index - 1], '[data-highlight]'), { backgroundColor: UNLIT, duration: 0.3, ease: EASE.inOut }, at)
  })
}

/** Where things sit while the card is built: the message on the left, the card it becomes on the right. */
function buildLayout(parts: Parts, focus: string): CardLayout {
  const margin = 72
  const snippetScale = 1.1
  const focusEl = decisionEl(parts, focus)
  const box = inside(focusEl, '[data-snippet]')!
  const card = parts.cards[QUESTION_ORDER.indexOf(focus as (typeof QUESTION_ORDER)[number])]
  // Fits beside the message, with a gap between them.
  const besideMessage = (CANVAS.width - margin * 2 - SNIPPET_WIDTH * snippetScale - 60) / CARD_WIDTH
  const cardScale = Math.min(0.95, (CANVAS.height - 110) / card.offsetHeight, besideMessage)
  const snippetH = box.offsetHeight
  return {
    focusEl,
    card,
    cardScale,
    snippetScale,
    // Scale is around the snippet's center: these place its scaled box with its left edge at the margin.
    snippet: { x: margin - (SNIPPET_WIDTH * (1 - snippetScale)) / 2, y: CANVAS.height / 2 - snippetH / 2 + 14 },
    snippetOrigin: { x: margin, y: CANVAS.height / 2 - (snippetH * snippetScale) / 2 + 14 },
    cardAt: { x: CANVAS.width - margin - CARD_WIDTH * cardScale, y: (CANVAS.height - card.offsetHeight * cardScale) / 2 + 14 },
  }
}

/**
 * Beat 4: the message becomes the app's real question card, piece by piece, beside it. The flagged phrase lifts
 * out and becomes the card's assumption; the question appears; the message files itself as the card's source;
 * then the recommended next step. A line at the top names each step as it happens.
 */
function showCard({ tl, parts, focus, t0 }: Cycle) {
  const layout = buildLayout(parts, focus)
  const { focusEl, card, cardScale, cardAt } = layout
  const others = QUESTION_ORDER.filter((id) => id !== focus).map((id) => decisionEl(parts, id))
  const pieces = cardParts(card)
  const { header, headline, summary, assumption, sources, recommendation } = pieces

  tl.to(parts.status, { opacity: 0, duration: 0.3, ease: EASE.in }, t0 + 10.6)
  tl.to(others, { opacity: 0, y: '-=16', duration: 0.4, ease: EASE.in }, t0 + 10.7)
  tl.set(focusEl, { zIndex: 5 }, t0 + 10.7)
  tl.to(focusEl, { ...layout.snippet, scale: layout.snippetScale, duration: 0.7, ease: EASE.inOut }, t0 + 10.7)
  tl.to(inside(focusEl, '[data-highlight]'), { backgroundColor: LIT, duration: 0.3, ease: EASE.inOut }, t0 + 10.7)

  // An empty card waits on the right; it fills in from the message.
  tl.set([header, headline, summary, assumption, sources, recommendation], { opacity: 0 }, t0 + 10.7)
  tl.fromTo(card, { opacity: 0, ...cardAt, y: cardAt.y + 16, scale: cardScale }, { opacity: 1, y: cardAt.y, duration: 0.6, ease: EASE.out }, t0 + 11.1)

  liftAssumption(tl, parts, layout, pieces, t0 + 11.7)
  step(tl, parts, 0, t0 + 11.7)
  tl.fromTo([header, headline], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE.out, stagger: 0.1 }, t0 + 12.7)
  tl.fromTo(summary, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: EASE.out }, t0 + 13.1)
  step(tl, parts, 1, t0 + 12.7)
  fileSource(tl, layout, pieces, t0 + 13.7)
  // With the message filed into it, the card takes the center for its last piece.
  tl.to(card, { x: (CANVAS.width - CARD_WIDTH * cardScale) / 2, duration: 0.8, ease: EASE.inOut }, t0 + 14.5)
  tl.fromTo(recommendation, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: EASE.out }, t0 + 14.9)
  step(tl, parts, 2, t0 + 14.9)
  tl.to(parts.steps, { opacity: 0, duration: 0.3, ease: EASE.in }, t0 + 16.4)
}

/**
 * Beat 5: the card moves up to the top of a feed, as in the app, and the other two questions load in beneath it.
 * The feed runs off the bottom of the frame, like a list that keeps going. Then the loop clears for the next one.
 */
function handOff({ tl, parts, focus, t0 }: Cycle) {
  const { cards } = parts
  const scale = 0.72
  const gap = 12
  const x = (CANVAS.width - CARD_WIDTH * scale) / 2
  const focusIndex = QUESTION_ORDER.indexOf(focus as (typeof QUESTION_ORDER)[number])
  // Feed order: the card just built on top, the others in their usual order below it.
  const feed = [cards[focusIndex], ...cards.filter((_, index) => index !== focusIndex)]
  let y = 40
  feed.forEach((card, order) => {
    const at = { x, y, scale }
    y += card.offsetHeight * scale + gap
    if (order === 0) {
      tl.to(card, { ...at, duration: 0.8, ease: EASE.inOut }, t0 + 16.6)
      return
    }
    tl.fromTo(card, { opacity: 0, ...at, y: at.y + 16 }, { opacity: 1, y: at.y, duration: 0.5, ease: EASE.out }, t0 + 17 + order * 0.15)
  })
  tl.to(cards, { opacity: 0, duration: 0.5, ease: EASE.in }, t0 + CYCLE - 0.6)
}
