import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { mobileCallbackPath } from '@/lib/mobileAuth';

export default function NativeAppLifecycle() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    const listeners: PluginListenerHandle[] = [];
    const handledUrls = new Set<string>();

    const handleUrl = async (url: string) => {
      const path = mobileCallbackPath(url);
      if (!path || disposed || handledUrls.has(url)) return;
      handledUrls.add(url);
      // Android closes the auth browser when the app is resumed; iOS needs close().
      if (Capacitor.getPlatform() === 'ios') {
        await Browser.close().catch(() => undefined);
      }
      if (!disposed) navigateRef.current(path, { replace: true });
    };

    const register = async () => {
      const urlListener = await App.addListener('appUrlOpen', ({ url }) => { void handleUrl(url); });
      if (disposed) { await urlListener.remove(); return; }
      listeners.push(urlListener);

      if (Capacitor.getPlatform() === 'android') {
        const backListener = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) navigateRef.current(-1);
          else void App.minimizeApp();
        });
        if (disposed) { await backListener.remove(); return; }
        listeners.push(backListener);
      }

      const launch = await App.getLaunchUrl();
      if (launch?.url) await handleUrl(launch.url);
    };

    void register().catch((error) => console.error('Unable to initialize mobile navigation', error));
    return () => {
      disposed = true;
      listeners.forEach((listener) => { void listener.remove(); });
    };
  }, []);

  return null;
}
