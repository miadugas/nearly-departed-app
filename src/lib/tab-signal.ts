// Tapping the already-active tab is expected to "reset" that screen (the iOS
// convention: scroll to top, recenter the map). The tab bar has no handle on
// the screen it's sitting under, so it publishes here and screens subscribe.
type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function onTabReselect(tab: string, fn: Listener): () => void {
  const set = listeners.get(tab) ?? new Set<Listener>();
  set.add(fn);
  listeners.set(tab, set);
  return () => set.delete(fn);
}

export function emitTabReselect(tab: string): void {
  listeners.get(tab)?.forEach((fn) => fn());
}
