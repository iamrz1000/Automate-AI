import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.automateai.app',
  appName: 'Automate AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    allowNavigation: [
      '*.firebaseapp.com',
      '*.googleapis.com',
      '*.google.com',
      'accounts.google.com',
      'github.com',
      'ais-pre-vtowivipoo5oo4ojwcooaz-190037377446.asia-east1.run.app',
      'ais-dev-vtowivipoo5oo4ojwcooaz-190037377446.asia-east1.run.app',
    ],
  },
  android: {
    backgroundColor: '#090a14',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    backgroundColor: '#090a14',
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
    preferredContentMode: 'mobile',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#090a14',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_launcher',
      iconColor: '#7c3aed',
    },
  },
};

export default config;
