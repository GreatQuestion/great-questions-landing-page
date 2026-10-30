import { createRoot } from 'react-dom/client'
import { MotionGlobalConfig } from 'motion/react'

import css from '@/index.css?inline'

import { Hero } from './Hero'

// The app's components animate themselves with `motion`. Here GSAP moves everything, so theirs stay still.
MotionGlobalConfig.skipAnimations = true

/**
 * Mounts the hero in a shadow root, so the app's styles (Tailwind's reset included) and the page's styles
 * never touch each other.
 */
function mount(host: HTMLElement) {
  hoistPropertyRules(css)
  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  // The app sets its tokens on :root; inside a shadow root that's :host.
  style.textContent = css.replaceAll(':root', ':host')
  const container = document.createElement('div')
  shadow.append(style, container)
  createRoot(container).render(<Hero />)
}

/** Browsers ignore @property inside shadow roots, and Tailwind's shadows and rings rely on them. Register them on the page. */
function hoistPropertyRules(stylesheet: string) {
  const rules = stylesheet.match(/@property[^{]+\{[^}]*\}/g)
  if (!rules) return
  const style = document.createElement('style')
  style.textContent = rules.join('\n')
  document.head.append(style)
}

const host = document.getElementById('hero')
if (host) mount(host)
