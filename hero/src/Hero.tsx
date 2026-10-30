import { useRef } from 'react'

import { Scene, type Variant } from './Scene'
import { useWidth } from './useWidth'

/** Below this width the desktop scene's text gets too small to read, so phones get their own, simpler scene. */
const PHONE_BELOW = 640

/**
 * The landing page's hero loop: everyday Slack, Linear and GitHub messages → the agent reads and sorts them →
 * the assumptions surface → one becomes the app's real question card. Decorative: the page's copy says the same
 * in words, so it's hidden from screen readers.
 */
export function Hero() {
  const host = useRef<HTMLDivElement>(null)
  const width = useWidth(host)
  const variant: Variant = width > 0 && width < PHONE_BELOW ? 'phone' : 'desktop'

  // text-left: the page centers its hero text, and inherited styles still cross into the shadow root.
  return (
    <div
      ref={host}
      aria-hidden
      className={`pointer-events-none relative w-full overflow-hidden bg-muted text-left select-none ${variant === 'phone' ? 'aspect-[2/3]' : 'aspect-video'}`}
    >
      {width > 0 ? <Scene key={variant} variant={variant} width={width} /> : null}
    </div>
  )
}
