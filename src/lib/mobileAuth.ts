import { Capacitor } from '@capacitor/core';

export const MOBILE_AUTH_SCHEME = 'com.fanyayoung.makemeupapp';

export function buildAuthCallbackUrl(nextPath: string) {
  const base = Capacitor.isNativePlatform()
    ? `${MOBILE_AUTH_SCHEME}://auth/callback`
    : `${window.location.origin}/auth/callback`;
  return `${base}?next=${encodeURIComponent(nextPath)}`;
}

export function mobileCallbackPath(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== `${MOBILE_AUTH_SCHEME}:` || url.hostname !== 'auth' || url.pathname !== '/callback') {
      return null;
    }
    return `/auth/callback${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
