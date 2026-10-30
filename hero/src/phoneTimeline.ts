import { gsap } from 'gsap'

import { PHONE_ROUTINE, QUESTION_ORDER } from './copy'
import { PHONE_CANVAS, PHONE_CARD_WIDTH, SNIPPET_WIDTH } from './layout'
import {
  CLEAR, EASE, LIFTED, LIT, RESTING, cardParts, countThreads, fileSource, inside, liftAssumption, step,
  type CardLayout, type Parts,
} from './motion'

/** Seconds per question on phones. Shorter than desktop: one message, one card, no feed. */
export const PHONE_CYCLE = 13.4
/** Where the loop rests for reduced motion: the first question's card, fully built. */
export const PHONE_STILL_AT = 11.5

const MARGIN = (PHONE_CANVAS.width - SNIPPET_WIDTH) / 2
const LIST_TOP = 56
const DIM = 'contrast(0.45) brightness(1.12)'
const UNDIMMED = 'contrast(1) brightness(1)'

interface PhoneCycle {
  tl: gsap.core.Timeline
  parts: Parts
  /** The five messages shown this cycle, top to bottom: routine work with the focus decision in the middle. */
  list: HTMLElement[]
  focusEl: HTMLElement
  card: HTMLElement
  t0: number
}

/**
 * The phone loop: a short list of messages is read top to bottom and tagged; the routine ones clear away; the
 * one decision becomes the app's question card, built beneath it. One cycle per question.
 */
export function buildPhoneLoop(root: HTMLElement): gsap.core.Timeline {
  const items = [...root.querySelectorAll<HTMLElement>('[data-item]')]
  const cards = QUESTION_ORDER.map((id) => root.querySelector<HTMLElement>(`[data-card="${id}"]`)!)
  // The phone card keeps what reads at this size: the question, its assumption, sources and the next step.
  cards.forEach((card) => {
    const { summary, recommendation } = cardParts(card)
    gsap.set([summary, recommendation.querySelector('.mt-3')], { display: 'none' })
  })
  const parts: Parts = {
    root,
    items,
    status: root.querySelector<HTMLElement>('[data-status]')!,
    steps: root.querySelector<HTMLElement>('[data-steps]')!,
    ghost: root.querySelector<HTMLElement>('[data-ghost]')!,
    cards,
    start: [],
  }
  const routine = items.slice(0, PHONE_ROUTINE.length)
  const decisions = items.slice(PHONE_ROUTINE.length)
  const tl = gsap.timeline({ repeat: -1 })
  QUESTION_ORDER.forEach((_, index) => {
    const focusEl = decisions[index]
    const cycle = { tl, parts, list: [routine[0], routine[1], focusEl, routine[2], routine[3]], focusEl, card: cards[index], t0: index * PHONE_CYCLE }
    reset(cycle)
    readList(cycle)
    surface(cycle)
    buildCard(cycle)
  })
  return tl
}

/** Each message's top in the list, stacked with a small gap. */
function listTops(list: HTMLElement[]): number[] {
  let top = LIST_TOP
  return list.map((el) => {
    const at = top
    top += inside(el, '[data-snippet]')!.offsetHeight + 14
    return at
  })
}

function reset({ tl, parts, list, card, t0 }: PhoneCycle) {
  const { items, root, cards } = parts
  const tops = listTops(list)
  tl.set(items, { opacity: 0, x: MARGIN, y: 0, scale: 1, zIndex: 0, filter: UNDIMMED }, t0)
  tl.set(list, { y: (i: number) => tops[i] }, t0)
  tl.set(root.querySelectorAll('[data-snippet]'), { boxShadow: RESTING }, t0)
  tl.set(root.querySelectorAll('[data-flag], [data-verdict]'), { opacity: 0 }, t0)
  tl.set(root.querySelectorAll('[data-highlight]'), { backgroundColor: CLEAR }, t0)
  tl.set(parts.status, { opacity: 0, textContent: '' }, t0)
  tl.set(cards, { opacity: 0, transformOrigin: '0 0' }, t0)
  const pieces = cardParts(card)
  tl.set(Object.values(pieces), { opacity: 1, y: 0 }, t0)
  tl.set([pieces.assumption, pieces.chip], { backgroundColor: CLEAR }, t0)
  tl.set([parts.steps, parts.ghost], { opacity: 0 }, t0)
}

/** Beats 1 and 2: the messages arrive, then each is read and tagged. Routine work dims as its tag lands. */
function readList({ tl, parts, list, focusEl, t0 }: PhoneCycle) {
  const tops = listTops(list)
  list.forEach((el, index) => {
    tl.fromTo(el, { opacity: 0, y: tops[index] + 16 }, { opacity: 1, y: tops[index], duration: 0.5, ease: EASE.out }, t0 + 0.2 + index * 0.3)
  })
  const readStart = t0 + 2.3
  const interval = 0.55
  list.forEach((el, index) => {
    const at = readStart + index * interval
    const box = inside(el, '[data-snippet]')
    tl.to(el, { scale: 1.03, zIndex: 5, duration: 0.15, ease: EASE.out }, at - 0.08)
    tl.to(box, { boxShadow: LIFTED, duration: 0.15, ease: EASE.out }, at - 0.08)
    tl.fromTo(inside(el, '[data-verdict]'), { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.2, ease: EASE.out }, at + 0.05)
    tl.to(el, { scale: 1, zIndex: 0, duration: 0.3, ease: EASE.inOut }, at + 0.4)
    tl.to(box, { boxShadow: RESTING, duration: 0.3, ease: EASE.inOut }, at + 0.4)
    if (el !== focusEl) tl.to(el, { filter: DIM, duration: 0.3, ease: EASE.inOut }, at + 0.4)
  })
  countThreads(tl, parts, t0 + 2.0, readStart, interval * (list.length - 1))
}

/** Beat 3: the routine work clears away, the decision rises to the top, and its risky phrase lights up. */
function surface({ tl, list, focusEl, t0 }: PhoneCycle) {
  const rest = list.filter((el) => el !== focusEl)
  tl.to(rest, { opacity: 0, x: MARGIN - 32, duration: 0.4, ease: EASE.in, stagger: 0.05 }, t0 + 5.3)
  tl.to(focusEl, { y: LIST_TOP, zIndex: 5, duration: 0.6, ease: EASE.inOut }, t0 + 5.5)
  tl.to(inside(focusEl, '[data-verdict]'), { opacity: 0, duration: 0.25, ease: EASE.inOut }, t0 + 6.0)
  tl.to(inside(focusEl, '[data-flag]'), { opacity: 1, duration: 0.25, ease: EASE.out }, t0 + 6.0)
  tl.to(inside(focusEl, '[data-highlight]'), { backgroundColor: LIT, duration: 0.3, ease: EASE.out }, t0 + 6.0)
}

/** Beat 4: the card builds beneath the message, then takes its place at the top for the next step. */
function buildCard({ tl, parts, focusEl, card, t0 }: PhoneCycle) {
  const box = inside(focusEl, '[data-snippet]')!
  // Full size: the card is laid out at the phone width, so it reads without scaling.
  const cardScale = 1
  const cardAt = { x: (PHONE_CANVAS.width - PHONE_CARD_WIDTH) / 2, y: LIST_TOP + box.offsetHeight + 18 }
  const layout: CardLayout = {
    focusEl,
    card,
    cardScale,
    snippetScale: 1,
    snippet: { x: MARGIN, y: LIST_TOP },
    snippetOrigin: { x: MARGIN, y: LIST_TOP },
    cardAt,
  }
  const pieces = cardParts(card)
  const { header, headline, assumption, sources, recommendation } = pieces

  tl.to(parts.status, { opacity: 0, duration: 0.3, ease: EASE.in }, t0 + 6.6)
  tl.set([header, headline, assumption, sources, recommendation], { opacity: 0 }, t0 + 6.6)
  tl.fromTo(card, { opacity: 0, ...cardAt, y: cardAt.y + 16, scale: cardScale }, { opacity: 1, y: cardAt.y, duration: 0.6, ease: EASE.out }, t0 + 6.7)
  liftAssumption(tl, parts, layout, pieces, t0 + 7.2)
  step(tl, parts, 0, t0 + 7.2)
  tl.fromTo([header, headline], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE.out, stagger: 0.1 }, t0 + 8.2)
  step(tl, parts, 1, t0 + 8.2)
  fileSource(tl, layout, pieces, t0 + 9.0)
  // With the message filed into it, the card moves up to the top for its last piece.
  tl.to(card, { y: LIST_TOP, duration: 0.7, ease: EASE.inOut }, t0 + 9.8)
  tl.fromTo(recommendation, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: EASE.out }, t0 + 10.3)
  step(tl, parts, 2, t0 + 10.3)
  tl.to([card, parts.steps], { opacity: 0, duration: 0.5, ease: EASE.in }, t0 + PHONE_CYCLE - 0.7)
}
