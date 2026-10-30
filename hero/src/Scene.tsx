import { useRef } from 'react'

import { QuestionCard } from '@/components/QuestionCard'
import { QUESTIONS } from '@/data/questions'

import { PHONE_DECISIONS, PHONE_ROUTINE, QUESTION_ORDER, SNIPPETS, type Snippet as SnippetData } from './copy'
import { CANVAS, CARD_WIDTH, PHONE_CANVAS, PHONE_CARD_WIDTH } from './layout'
import { buildPhoneLoop, PHONE_STILL_AT } from './phoneTimeline'
import { Snippet } from './Snippet'
import { buildLoop, STILL_AT } from './timeline'
import { useLoop } from './useLoop'

// The cards are for show: their buttons do nothing on the landing page.
const NO_ACTIONS = { launch: () => {}, discuss: () => {}, setStatus: () => {}, decide: () => {} }

export type Variant = 'desktop' | 'phone'

const VARIANTS = {
  desktop: { canvas: CANVAS, cardWidth: CARD_WIDTH, snippets: SNIPPETS, build: buildLoop, stillAt: STILL_AT, label: 'text-[12px]' },
  phone: {
    canvas: PHONE_CANVAS,
    cardWidth: PHONE_CARD_WIDTH,
    snippets: [...PHONE_ROUTINE, ...PHONE_DECISIONS],
    build: buildPhoneLoop,
    stillAt: PHONE_STILL_AT,
    label: 'text-[10.5px]',
  },
} satisfies Record<Variant, { canvas: { width: number; height: number }; cardWidth: number; snippets: SnippetData[]; build: unknown; stillAt: number; label: string }>

/** One version of the hero, on its fixed canvas, scaled to `width`. The loop is built from the elements it renders. */
export function Scene({ variant, width }: { variant: Variant; width: number }) {
  const canvas = useRef<HTMLDivElement>(null)
  const { canvas: size, cardWidth, snippets, build, stillAt, label } = VARIANTS[variant]
  useLoop(canvas, build, stillAt)

  return (
    <div
      ref={canvas}
      className="absolute top-0 left-0 origin-top-left font-sans text-foreground"
      style={{ width: size.width, height: size.height, transform: `scale(${width / size.width})` }}
    >
      <div
        data-status
        className={`absolute inset-x-0 top-[22px] text-center font-mono ${label} tracking-[0.12em] text-muted-foreground uppercase`}
      />
      <div data-steps className={`absolute inset-x-0 top-[22px] flex justify-center gap-2 font-mono ${label} tracking-[0.12em] text-foreground uppercase`}>
        <span data-step>Assumption</span>
        <span data-step>→ Research question</span>
        <span data-step>→ Next step</span>
      </div>
      {snippets.map((snippet, index) => (
        <div key={index} data-item className="absolute top-0 left-0">
          <Snippet snippet={snippet} />
        </div>
      ))}
      {QUESTION_ORDER.map((id) => (
        <div key={id} data-card={id} className="absolute top-0 left-0" style={{ width: cardWidth }}>
          <QuestionCard question={QUESTIONS.find((question) => question.id === id)!} actions={NO_ACTIONS} />
        </div>
      ))}
      <div
        data-ghost
        className="absolute top-0 left-0 z-10 origin-top-left rounded-[3px] px-0.5 text-[15px] leading-snug whitespace-nowrap text-foreground"
      />
    </div>
  )
}
