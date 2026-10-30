import { BrandIcon } from '@/components/BrandIcon'
import { StakesBars } from '@/components/StakesBars'
import { QUESTIONS } from '@/data/questions'
import type { Person } from '@/data/types'
import { STAKES_LABELS } from '@/lib/meta'

import type { Snippet as SnippetData } from './copy'
import { SNIPPET_WIDTH } from './layout'

const PEOPLE = new Map<string, Person>(QUESTIONS.flatMap((question) => question.people.map((person) => [person.name, person])))

/** One piece of everyday work: a message, comment or ticket, in the app's own card styling. */
export function Snippet({ snippet }: { snippet: SnippetData }) {
  const person = PEOPLE.get(snippet.author)
  const question = QUESTIONS.find((item) => item.id === snippet.question)
  const initials = snippet.author.split(' ').map((part) => part[0]).join('')

  return (
    <div
      data-snippet
      className="relative rounded-lg border border-border bg-card px-3.5 pt-2.5 pb-3 shadow-[0_1px_2px_rgb(6_11_20/0.04)]"
      style={{ width: SNIPPET_WIDTH }}
    >
      {snippet.verdict ? <Verdict text={snippet.verdict} isAssumption={Boolean(question)} /> : null}
      <div className="mb-1 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <BrandIcon source={snippet.source} className="size-3.5" />
        <span className="text-foreground/75">{snippet.where}</span>
        <span className="ml-auto inline-flex items-center gap-1.5 font-sans text-[11px]">
          <span
            className="grid size-[18px] place-items-center rounded-full text-[8px] font-semibold text-white"
            style={{ background: `oklch(0.55 0.08 ${person?.hue ?? 230})` }}
          >
            {initials}
          </span>
          {snippet.author.split(' ')[0]}
        </span>
      </div>
      <div className="text-[15px] leading-snug text-foreground">
        <SnippetText text={snippet.text} highlight={snippet.highlight} />
      </div>
      {question ? (
        <div
          data-flag
          className="mt-2 flex items-center gap-2 border-t border-border pt-1.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase"
        >
          <StakesBars stakes={question.stakes} />
          <span className="text-foreground/80">{STAKES_LABELS[question.stakes]}</span>
          <span>·</span>
          <span>Assumption</span>
        </div>
      ) : null}
    </div>
  )
}

/** The scan's call on a message, pinned to its top edge as it's read. Assumptions get the stronger, inked tag. */
function Verdict({ text, isAssumption }: { text: string; isAssumption: boolean }) {
  return (
    <span
      data-verdict
      className={
        isAssumption
          ? 'absolute -top-2.5 right-3 rounded-full bg-foreground px-2 py-0.5 font-mono text-[9.5px] tracking-[0.12em] text-background uppercase'
          : 'absolute -top-2.5 right-3 rounded-full border border-border bg-card px-2 py-0.5 font-mono text-[9.5px] tracking-[0.12em] text-muted-foreground uppercase'
      }
    >
      {text}
    </span>
  )
}

/** The message, with its risky part wrapped so the loop can light it up. */
function SnippetText({ text, highlight }: { text: string; highlight?: string }) {
  const at = highlight ? text.indexOf(highlight) : -1
  if (!highlight || at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <span data-highlight className="-mx-0.5 rounded-[3px] px-0.5">
        {highlight}
      </span>
      {text.slice(at + highlight.length)}
    </>
  )
}
