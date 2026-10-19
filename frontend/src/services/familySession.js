// A family member signed in on this device (no member account): the portals their number was invited to,
// and which one is open. Kept in local storage so the app reopens straight into the family view.
import { useSyncExternalStore } from 'react';

const KEY = 'sangam.family';
const listeners = new Set();

function read() {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(KEY) || 'null');
    return value?.portals?.length ? value : null;
  } catch {
    return null;
  }
}

let current = read();

function write(value) {
  current = value;
  try {
    if (value) globalThis.localStorage?.setItem(KEY, JSON.stringify(value));
    else globalThis.localStorage?.removeItem(KEY);
  } catch {
    // storage unavailable: the session lasts until the app closes
  }
  listeners.forEach((l) => l());
}

export const familySession = {
  get: () => current,
  // portals: [{ token, childName, name, relation }]
  signIn: (portals) => write({ portals, active: portals[0].token }),
  choose: (token) => current && write({ ...current, active: token }),
  signOut: () => write(null),
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useFamilySession = () => useSyncExternalStore(familySession.subscribe, familySession.get);
