import * as Speech from "expo-speech";

let isSpeaking = false;

export async function falar(texto: string, velocidade = 1.1): Promise<void> {
  if (isSpeaking) await pararVoz();

  const limpo = texto
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "conteúdo de código omitido.")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[-•]\s/g, "")
    .trim();

  if (!limpo) return;

  isSpeaking = true;

  return new Promise((resolve) => {
    Speech.speak(limpo, {
      language: "pt-BR",
      rate: velocidade,
      pitch: 1.05,
      onDone: () => { isSpeaking = false; resolve(); },
      onError: () => { isSpeaking = false; resolve(); },
      onStopped: () => { isSpeaking = false; resolve(); },
    });
  });
}

export async function pararVoz(): Promise<void> {
  isSpeaking = false;
  await Speech.stop();
}

export function estaFalando(): boolean {
  return isSpeaking;
}
