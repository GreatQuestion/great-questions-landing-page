import type { SourceType } from '@/data/types'

export interface Snippet {
  source: SourceType
  where: string
  author: string
  text: string
  /** The prototype question this decision becomes. Only set on the decisions. */
  question?: string
  /** The risky part of `text`, marked when the assumption is surfaced. */
  highlight?: string
  /** What the scan makes of it, tagged on as it's read. */
  verdict?: string
  /** Only in the opening, so it feels crowded. Leaves before the reading starts. */
  extra?: boolean
}

// The hero loop's messages. Three are decisions resting on an assumption (each points at a prototype question,
// with its risky phrase marked); the rest is routine noise. Adapted from the teaser film's copy.
const DECISIONS: Record<string, Snippet> = {
  q1: { source: 'slack', where: '#growth', author: 'June Park', text: "Moving the invite step earlier. That's why admins stall.", question: 'q1', verdict: 'Untested assumption', highlight: "That's why admins stall." },
  q2: { source: 'github', where: 'app#2841', author: 'Sam Whitaker', text: 'Notification settings live under Workspace now. Obvious spot.', question: 'q2', verdict: 'Untested assumption', highlight: 'Obvious spot.' },
  q3: { source: 'slack', where: '#pricing', author: 'Leo Brandt', text: 'Advanced permissions alone will sell the Business plan.', question: 'q3', verdict: 'Untested assumption', highlight: 'alone will sell the Business plan' },
}

const ROUTINE: Snippet[] = [
  { source: 'linear', where: 'CORE-188', author: 'Ana Ruiz', text: 'Moved to next cycle, blocked on the API change.', verdict: 'Status update' },
  { source: 'slack', where: '#product', author: 'June Park', text: 'Standup moved to 10:15 tomorrow.', verdict: 'FYI' },
  { source: 'github', where: 'app#2877', author: 'Ana Ruiz', text: 'LGTM, merging after CI.', verdict: 'Routine' },
  { source: 'slack', where: '#design-crit', author: 'Sam Whitaker', text: 'Updated the empty state, new copy in Figma.', verdict: 'Status update' },
  { source: 'linear', where: 'CORE-201', author: 'Kofi Mensah', text: 'Bumped the export limit to 10k rows.', verdict: 'Already shipped' },
  { source: 'slack', where: '#support', author: 'Priya Nair', text: 'Closed out the SSO ticket, customer confirmed.', verdict: 'Resolved' },
  { source: 'slack', where: '#eng-retro', author: 'Kofi Mensah', text: 'Thanks all, notes are in the doc.', verdict: 'FYI' },
]

// Only in the opening, so it feels like too much to keep track of. They leave before the reading starts.
const EXTRA_LINES: Snippet[] = [
  { source: 'slack', where: '#growth', author: 'Leo Brandt', text: 'Going with annual-only pricing for the new plan.' },
  { source: 'linear', where: 'CORE-219', author: 'Maya Okafor', text: 'Defaulting new projects to list view.' },
  { source: 'github', where: 'app#2890', author: 'Ana Ruiz', text: 'Dropping the legacy CSV importer, nobody uses it.' },
  { source: 'linear', where: 'CORE-226', author: 'Sam Whitaker', text: 'Filters go in a side panel. Decided in standup.' },
  { source: 'slack', where: '#support', author: 'Priya Nair', text: 'Telling customers the fix ships Friday.' },
  { source: 'github', where: 'app#2895', author: 'Dev Raman', text: 'Removed the onboarding tour on mobile.' },
  { source: 'slack', where: '#product', author: 'June Park', text: 'Renaming Reports to Insights in the nav.' },
  { source: 'linear', where: 'ONB-41', author: 'Dev Raman', text: 'Templates on by default for every new workspace.' },
]
const EXTRA: Snippet[] = EXTRA_LINES.map((snippet) => ({ ...snippet, extra: true }))

/** The order the loop shows the questions in, and their order in the hand-off row. */
export const QUESTION_ORDER = ['q1', 'q2', 'q3'] as const

// Decisions sit apart from each other in the read order, so they surface across the whole frame.
const CORE: Snippet[] = [ROUTINE[0], DECISIONS.q1, ROUTINE[1], ROUTINE[2], DECISIONS.q2, ROUTINE[3], ROUTINE[4], DECISIONS.q3, ROUTINE[5], ROUTINE[6]]

/** Core and extra snippets interleaved, so the extras spread across the whole frame. */
export const SNIPPETS: Snippet[] = CORE.flatMap((snippet, index) => [snippet, ...(EXTRA[index] ? [EXTRA[index]] : [])])

/**
 * The phone loop's messages: a short list, four routine and one decision, read top to bottom. The decision in
 * the middle changes each cycle (only the focus question's shows).
 */
export const PHONE_ROUTINE: Snippet[] = [ROUTINE[1], ROUTINE[0], ROUTINE[2], ROUTINE[5]]
export const PHONE_DECISIONS: Snippet[] = QUESTION_ORDER.map((id) => DECISIONS[id])
