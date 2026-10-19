// The Android Back button. MainActivity asks window.__sangamBack() first; when nothing here handles it,
// the app goes to the background (never closes). Order: the open sheet closes, then the screen's own back
// arrow, then the root fallback (another tab → the feed).
import { useEffect, useRef } from 'react';

const handlers = []; // { kind: 'sheet' | 'screen', run }
let rootFallback = null;

function register(kind, ref) {
  const entry = { kind, run: () => ref.current?.() };
  handlers.push(entry);
  return () => {
    const i = handlers.indexOf(entry);
    if (i >= 0) handlers.splice(i, 1);
  };
}

// While mounted, Back runs fn: sheets pass onClose, screens their back arrow's action
export function useBackHandler(fn, kind = 'sheet') {
  const ref = useRef(fn);
  ref.current = fn;
  const active = Boolean(fn);
  useEffect(() => (active ? register(kind, ref) : undefined), [active, kind]);
}

export const setRootBack = (fn) => { rootFallback = fn; };

globalThis.__sangamBack = () => {
  const sheet = [...handlers].reverse().find((h) => h.kind === 'sheet');
  const screen = [...handlers].reverse().find((h) => h.kind === 'screen');
  const h = sheet || screen;
  if (h) {
    h.run();
    return true;
  }
  return Boolean(rootFallback?.());
};
