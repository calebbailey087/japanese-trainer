import { useSyncExternalStore } from 'react';

export function parseHash(value: string) {
  const route = value.replace(/^#/, '') || '/';
  const index = route.indexOf('?');
  const pathname = index < 0 ? route : route.slice(0, index);
  return { pathname: pathname.startsWith('/') ? pathname : `/${pathname}`, search: index < 0 ? '' : route.slice(index + 1) };
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  window.addEventListener('popstate', callback);
  return () => {
    window.removeEventListener('hashchange', callback);
    window.removeEventListener('popstate', callback);
  };
}
const snapshot = () => window.location.hash;
const serverSnapshot = () => '#/';
function navigate(to: string, options?: { replace?: boolean; state?: unknown }) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = to.startsWith('/') ? to : `/${to}`;
  window.history[options?.replace ? 'replaceState' : 'pushState'](options?.state ?? null, '', url);
  window.dispatchEvent(new Event('hashchange'));
}
export function usePagesLocation(): [string, typeof navigate] {
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return [parseHash(hash).pathname, navigate];
}
usePagesLocation.hrefs = (href: string) => `#${href}`;
export function usePagesSearch() {
  return parseHash(useSyncExternalStore(subscribe, snapshot, serverSnapshot)).search;
}
