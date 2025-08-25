import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.737420888eca4dbf8a9304d90827cedb',
  appName: 'production-make-me-up-app',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://73742088-8eca-4dbf-8a93-04d90827cedb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;