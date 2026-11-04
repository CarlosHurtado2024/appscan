import { useSyncExternalStore } from 'react';

export type Route = { path: string; segments: string[]; params: URLSearchParams };

const read = () => location.hash.slice(1) || '/';

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (opts.replace) location.replace(`#${to}`);
  else location.hash = to;
}

export function useRoute(): Route {
  const path = useSyncExternalStore(subscribe, read);
  const [pathname, query] = path.split('?');
  return { path, segments: pathname.split('/').filter(Boolean), params: new URLSearchParams(query) };
}
