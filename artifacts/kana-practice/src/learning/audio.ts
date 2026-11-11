import { useEffect, useState } from 'react';
const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
function voices() { return supported() ? window.speechSynthesis.getVoices().filter((v) => /^ja(?:-|_)/i.test(v.lang)).sort((a, b) => Number(b.localService) - Number(a.localService)) : []; }
export function useJapaneseVoice() {
  const [state, setState] = useState({ available: voices().length > 0, loading: supported() && voices().length === 0 });
  useEffect(() => {
    if (!supported()) return;
    const update = () => setState({ available: voices().length > 0, loading: false });
    window.speechSynthesis.addEventListener('voiceschanged', update);
    const timer = window.setTimeout(update, 2000);
    if (voices().length) update();
    return () => { window.clearTimeout(timer); window.speechSynthesis.removeEventListener('voiceschanged', update); };
  }, []);
  return state;
}
export function stopSpeech() { if (supported()) window.speechSynthesis.cancel(); }
export function speakJapanese(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const voice = voices()[0];
    if (!voice) { reject(new Error('No Japanese speech voice is available on this device. Install a ja-JP system voice, then reopen the app. Text practice still works.')); return; }
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice; utterance.lang = 'ja-JP'; utterance.rate = 0.85;
    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') resolve();
      else reject(new Error(`Japanese audio failed: ${event.error}`));
    };
    window.speechSynthesis.speak(utterance);
  });
}
