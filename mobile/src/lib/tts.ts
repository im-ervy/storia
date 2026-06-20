// Narração da frase via expo-speech (substitui a Web Speech API do web).
import * as Speech from 'expo-speech';

export function speak(text: string, language: string, onDone?: () => void): void {
  Speech.stop();
  Speech.speak(text, {
    language,
    rate: 0.95,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
