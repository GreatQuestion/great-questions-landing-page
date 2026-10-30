import { useLayoutEffect, useState, type RefObject } from 'react'

/** The element's width, following resizes. */
export function useWidth(host: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    // Measure now, not just on the first resize callback, which a browser can hold back while a page is hidden.
    setWidth(el.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [host])
  return width
}
