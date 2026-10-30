import { useLayoutEffect, type RefObject } from 'react'
import { gsap } from 'gsap'

/**
 * Builds a loop on the canvas and runs it while it's on screen. People who prefer reduced motion get one still
 * frame, `stillAt`.
 */
export function useLoop(
  canvas: RefObject<HTMLElement | null>,
  build: (root: HTMLElement) => gsap.core.Timeline,
  stillAt: number,
): void {
  useLayoutEffect(() => {
    const canvasEl = canvas.current
    if (!canvasEl) return
    let observer: IntersectionObserver | undefined
    const ctx = gsap.context(() => {
      const tl = build(canvasEl)
      // For reviewing a beat: ?t=9.5 holds the loop at that second.
      const hold = new URLSearchParams(location.search).get('t')
      if (hold !== null) {
        // Not suppressing events, so the status line's counter is drawn at that second too.
        tl.seek(Number(hold), false).pause()
        return
      }
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        tl.seek(stillAt, false).pause()
        return
      }
      // Pause off screen, so it isn't running for nobody and picks up where it was when you scroll back.
      observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? tl.play() : tl.pause()))
      observer.observe(canvasEl)
    }, canvasEl)
    return () => {
      observer?.disconnect()
      ctx.revert()
    }
  }, [canvas, build, stillAt])
}
