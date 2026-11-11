import { registerSW } from 'virtual:pwa-register';

// Production only: precache the built app, never Vite's development modules.
// Updates wait until the next full close/open, avoiding interruptions mid-drill.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisterError(error: unknown) {
      console.error('Offline support could not be initialized:', error);
      window.dispatchEvent(new CustomEvent('kana-offline-error'));
    },
  });
}
