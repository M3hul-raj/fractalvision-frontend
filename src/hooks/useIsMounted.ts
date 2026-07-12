import { useSyncExternalStore } from "react";

/**
 * Returns `false` during SSR and on the very first client render (matching
 * the server snapshot), then `true` on every subsequent render.
 *
 * Use this to guard UI that depends on client-only state (e.g., Zustand
 * stores hydrated from localStorage/sessionStorage) and would otherwise
 * cause a hydration mismatch.
 *
 * Built on `useSyncExternalStore` — the React 18+ blessed API for
 * server/client divergence — so it avoids the extra render cycle and
 * the `react-hooks/set-state-in-effect` lint violation that the older
 * `useState`+`useEffect` pattern triggers.
 */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useIsMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}
