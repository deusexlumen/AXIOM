import "@testing-library/jest-dom/vitest";
import { afterAll } from "vitest";

// ScrollTrigger.enable() starts a 250ms sync interval that calls bare global rAF,
// which no longer exists after jsdom teardown. Disable it before that happens.
// Lazy import: a static import would run registerPlugin() before the matchMedia
// polyfill below is installed.
afterAll(async () => {
  const { ScrollTrigger } = await import("@/motion/gsap");
  ScrollTrigger.disable();
});

// jsdom has no matchMedia; GSAP's ScrollTrigger requires it at registerPlugin() time (module import).
// Tests override per-case via vi.stubGlobal("matchMedia", ...).
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
