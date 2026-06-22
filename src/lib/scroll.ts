// Shared smooth-scroll helpers that place a target flush below the fixed
// AppHeader (and the mini-workflow bar when it is present).

export const HEADER_H = 64; // AppHeader height (h-16)

/** Vertical offset to leave above a scroll target. */
function scrollOffset(includeMiniBar: boolean): number {
  if (!includeMiniBar) return HEADER_H;
  const bar = document.querySelector('[data-mini-bar]');
  return HEADER_H + (bar ? bar.getBoundingClientRect().height : 0);
}

/** Smooth-scroll so `el` sits just below the fixed header. */
export function scrollToElement(el: HTMLElement, includeMiniBar = false): void {
  const offset = scrollOffset(includeMiniBar);
  window.scrollTo({
    top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset),
    behavior: 'smooth',
  });
}

/** Smooth-scroll to the element with the given id; no-op if it doesn't exist. */
export function scrollToId(id: string, includeMiniBar = false): void {
  const el = document.getElementById(id);
  if (!el) return;
  scrollToElement(el, includeMiniBar);
}
