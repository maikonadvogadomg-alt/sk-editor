import * as FileSystem from "expo-file-system/legacy";
import * as WebBrowser from "expo-web-browser";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { Alert, Platform } from "react-native";

const FS = FileSystem as any;

export function detectarHtml(texto: string): boolean {
  if (!texto || texto.length < 30) return false;
  const padroes = [
    /<!DOCTYPE\s+html/i,
    /<html[\s>]/i,
    /<head[\s>]/i,
    /<body[\s>]/i,
  ];
  if (padroes.some(p => p.test(texto))) return true;
  const contagem = [/<div[\s/>]/gi, /<p[\s/>]/gi, /<span[\s/>]/gi, /<table[\s>]/gi, /<h[1-6][\s>]/gi];
  const tags = contagem.filter(p => p.test(texto)).length;
  return tags >= 3;
}

export function extrairHtml(texto: string): string {
  const blocoMd = texto.match(/```html\n?([\s\S]*?)```/i);
  if (blocoMd) return blocoMd[1];
  const start = texto.search(/<!DOCTYPE\s+html/i);
  if (start >= 0) return texto.slice(start);
  const startHtml = texto.search(/<html[\s>]/i);
  if (startHtml >= 0) return texto.slice(startHtml);
  return texto;
}

export async function abrirHtmlNoBrowser(texto: string, titulo?: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      const html = extrairHtml(texto);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o HTML.");
    }
    return;
  }

  const html = extrairHtml(texto);

  // Estratégia 1: data URI (funciona em iOS e Android sem precisar de file://)
  // Limite: ~2MB de HTML codificado como URL
  if (html.length < 600000) {
    try {
      const encoded = encodeURIComponent(html);
      const dataUri = `data:text/html;charset=utf-8,${encoded}`;
      await WebBrowser.openBrowserAsync(dataUri, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
      return;
    } catch {
      // cai para estratégia 2
    }
  }

  // Estratégia 2: salvar arquivo e compartilhar (Android bloqueia file:// no Chrome)
  try {
    const path = `${FS.cacheDirectory}preview_${Date.now()}.html`;
    await FS.writeAsStringAsync(path, html, { encoding: "utf8" });

    if (Platform.OS === "android") {
      // No Android, Chrome bloqueia file:// de outras apps → usar compartilhamento
      await Sharing.shareAsync(path, {
        mimeType: "text/html",
        dialogTitle: titulo || "Visualizar HTML",
      });
    } else {
      await WebBrowser.openBrowserAsync(`file://${path}`, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    }
  } catch (e: any) {
    Alert.alert(
      "Não foi possível abrir o preview",
      "Tente a opção de compartilhamento para enviar o HTML.",
      [
        { text: "Cancelar" },
        {
          text: "Compartilhar", onPress: () => compartilharHtml(texto, titulo),
        },
      ]
    );
  }
}

export async function compartilharHtml(texto: string, titulo?: string): Promise<void> {
  if (Platform.OS === "web") {
    await Clipboard.setStringAsync(extrairHtml(texto));
    Alert.alert("Copiado!", "HTML copiado para a área de transferência.");
    return;
  }
  try {
    const html = extrairHtml(texto);
    const path = `${FS.documentDirectory}pagina_${Date.now()}.html`;
    await FS.writeAsStringAsync(path, html, { encoding: "utf8" });
    await Sharing.shareAsync(path, {
      mimeType: "text/html",
      dialogTitle: titulo || "Compartilhar HTML",
      UTI: "public.html",
    });
  } catch {
    Alert.alert("Erro", "Não foi possível compartilhar o arquivo HTML.");
  }
}

export default { detectarHtml, extrairHtml, abrirHtmlNoBrowser, compartilharHtml };
