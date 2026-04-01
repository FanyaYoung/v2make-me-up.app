import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

interface OpenExternalUrlOptions {
  preferSameTab?: boolean;
}

export const openExternalUrl = async (
  url: string,
  options: OpenExternalUrlOptions = {},
) => {
  if (!url) {
    throw new Error('Missing external URL');
  }

  const { preferSameTab = false } = options;

  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }
  } catch (error) {
    console.error('Native browser open failed, falling back to web navigation.', error);
  }

  if (preferSameTab) {
    window.location.assign(url);
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
};
