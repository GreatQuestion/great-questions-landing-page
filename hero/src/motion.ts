import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

import { SNIPPET_WIDTH, type Point } from './layout'

// Shared by the desktop and phone loops: the curves, the tints, and the steps that turn a message into a card.

gsap.registerPlugin(CustomEase)

// The app's motion curve (QuestionCard: ease [0.16, 1, 0.3, 1]), so the hero moves the way the product does.
export const EASE = {
  out: CustomEase.create('gq-out', 'M0,0 C0.16,1 0.3,1 1,1'),
  inOut: CustomEase.create('gq-in-out', 'M0,0 C0.65,0 0.35,1 1,1'),
  in: CustomEase.create('gq-in', 'M0,0 C0.7,0 0.84,0 1,1'),
}

export const THREADS = 1284
export const LIFTED = '0 14px 36px rgb(6 11 20 / 0.14)'
export const RESTING = '0 1px 2px rgb(6 11 20 / 0.04)'
// The app's brand (#266bd8) as a soft tint, the page's "great questions" highlight; the neutral one for the rest.
export const LIT = 'rgba(38, 107, 216, 0.16)'
export const UNLIT = 'rgba(6, 11, 20, 0.07)'
export const CLEAR = 'rgba(38, 107, 216, 0)'

/** The elements a loop animates. `start` is where each message sits before it's read. */
export interface Parts {
  root: HTMLElement
  items: HTMLElement[]
  status: HTMLElement
  steps: HTMLElement
  ghost: HTMLElement
  cards: HTMLElement[]
  start: Point[]
}

export const inside = (el: HTMLElement, selector: string) => el.querySelector<HTMLElement>(selector)

/** The parts of the app's question card, in the order the card is built from the message. */
export function cardParts(card: HTMLElement) {
  const article = card.querySelector<HTMLElement>('article')!
  const [summary, assumption] = article.querySelectorAll<HTMLElement>('p')
  const sources = assumption.nextElementSibling as HTMLElement
  return {
    header: article.querySelector<HTMLElement>('button > div')!,
    headline: article.querySelector<HTMLElement>('h2')!.parentElement!,
    summary,
    assumption,
    label: assumption.querySelector<HTMLElement>('span')!,
    sources,
    chip: sources.querySelector<HTMLElement>('a')!,
    recommendation: article.querySelector<HTMLElement>('.rounded-b-lg')!,
  }
}

/** Offset of `el` from `ancestor`, through the offsetParent chain (unaffected by transforms). */
export function offsetIn(el: HTMLElement, ancestor: HTMLElement): Point {
  let x = 0
  let y = 0
  for (let node: HTMLElement | null = el; node && node !== ancestor; node = node.offsetParent as HTMLElement | null) {
    x += node.offsetLeft
    y += node.offsetTop
  }
  return { x, y }
}

/** Where the message and the card it becomes sit while the card is built. */
export interface CardLayout {
  focusEl: HTMLElement
  card: HTMLElement
  cardScale: number
  snippetScale: number
  /** The message's unscaled position, and the top-left of its scaled box. */
  snippet: Point
  snippetOrigin: Point
  cardAt: Point
}

export type CardPieces = ReturnType<typeof cardParts>

/** The flagged phrase lifts off the message and lands as the card's assumption, which lights up as it arrives. */
export function liftAssumption(tl: gsap.core.Timeline, parts: Parts, layout: CardLayout, pieces: CardPieces, at: number) {
  const highlight = inside(layout.focusEl, '[data-highlight]')!
  const from = offsetIn(highlight, layout.focusEl)
  const to = offsetIn(pieces.assumption, layout.card)
  const labelWidth = pieces.label.offsetWidth
  const { ghost } = parts
  const startScale = layout.snippetScale
  const endScale = (layout.cardScale * 13) / 15 // the card's assumption is 13px; the message is 15px
  tl.set(ghost, { textContent: highlight.textContent, backgroundColor: LIT, opacity: 0 }, at)
  tl.fromTo(
    ghost,
    { opacity: 1, x: layout.snippetOrigin.x + from.x * startScale, y: layout.snippetOrigin.y + from.y * startScale, scale: startScale },
    {
      x: layout.cardAt.x + (to.x + labelWidth) * layout.cardScale,
      y: layout.cardAt.y + to.y * layout.cardScale,
      scale: endScale,
      duration: 0.8,
      ease: EASE.inOut,
    },
    at,
  )
  tl.to(highlight, { backgroundColor: UNLIT, duration: 0.3, ease: EASE.inOut }, at)
  // A quick hand-over: the phrase lands, then the card's own assumption line takes its place.
  tl.to(ghost, { opacity: 0, duration: 0.2, ease: EASE.in }, at + 0.8)
  tl.fromTo(pieces.assumption, { opacity: 0, backgroundColor: LIT }, { opacity: 1, duration: 0.25, ease: EASE.out }, at + 0.85)
  tl.to(pieces.assumption, { backgroundColor: CLEAR, duration: 0.6, ease: EASE.inOut }, at + 1.2)
}

/** The message shrinks into the card's source chip, so you can see where the question came from. */
export function fileSource(tl: gsap.core.Timeline, layout: CardLayout, pieces: CardPieces, at: number) {
  const chip = offsetIn(pieces.chip, layout.card)
  const box = inside(layout.focusEl, '[data-snippet]')!
  const chipCenter = {
    x: layout.cardAt.x + (chip.x + pieces.chip.offsetWidth / 2) * layout.cardScale,
    y: layout.cardAt.y + (chip.y + pieces.chip.offsetHeight / 2) * layout.cardScale,
  }
  tl.fromTo(pieces.sources, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: EASE.out }, at)
  tl.set(pieces.chip, { opacity: 0 }, at)
  // Scale is around the center, so placing the unscaled box's center on the chip's center lands it there.
  tl.to(layout.focusEl, { x: chipCenter.x - SNIPPET_WIDTH / 2, y: chipCenter.y - box.offsetHeight / 2, scale: 0.12, opacity: 0, duration: 0.8, ease: EASE.inOut }, at)
  tl.fromTo(pieces.chip, { opacity: 0, backgroundColor: LIT }, { opacity: 1, duration: 0.2, ease: EASE.out }, at + 0.65)
  tl.to(pieces.chip, { backgroundColor: CLEAR, duration: 0.6, ease: EASE.inOut }, at + 0.9)
}

/** The step line: Assumption → Research question → Next step. The current step is full ink, earlier ones settle back. */
export function step(tl: gsap.core.Timeline, parts: Parts, index: number, at: number) {
  const steps = [...parts.steps.querySelectorAll<HTMLElement>('[data-step]')]
  if (index === 0) tl.set(steps, { opacity: 0 }, at).set(parts.steps, { opacity: 1 }, at)
  tl.fromTo(steps[index], { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, ease: EASE.out }, at)
  if (index > 0) tl.to(steps[index - 1], { opacity: 0.45, duration: 0.4, ease: EASE.inOut }, at)
}

/** The status line counts threads while it reads, then reports what came out. */
export function countThreads(tl: gsap.core.Timeline, parts: Parts, showAt: number, from: number, duration: number) {
  const { status } = parts
  const counter = { n: 0 }
  const count = (n: number) => `Scanning · ${Math.round(n).toLocaleString('en-US')} threads`
  tl.set(status, { textContent: count(0) }, showAt)
  tl.to(status, { opacity: 1, duration: 0.3, ease: EASE.out }, showAt)
  tl.fromTo(counter, { n: 0 }, { n: THREADS, duration, ease: 'none', onUpdate: () => void (status.textContent = count(counter.n)) }, from)
  tl.set(status, { textContent: `${THREADS.toLocaleString('en-US')} threads → 3 assumptions worth testing` }, from + duration + 0.5)
}

