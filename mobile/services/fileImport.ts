/**
 * fileImport.ts — Importador universal de arquivos
 *
 * Sem chave API:   TXT · HTML · CSV · JSON · XML · DOCX · XLSX · XLS · PDF (texto)
 * Com chave Gemini: PDF escaneado · Imagens (JPG/PNG/WebP/HEIC) · qualquer doc visual
 */

import * as FileSystem from "expo-file-system/legacy";
import pako from "pako";
import * as XLSX from "xlsx";
import Papa from "papaparse";

const FS = FileSystem as any;

// ─── Utilitários ────────────────────────────────────────────────────────────

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

// ─── TXT / HTML / CSV / JSON / XML ──────────────────────────────────────────

async function lerTexto(uri: string): Promise<string> {
  try {
    return await (await fetch(uri)).text();
  } catch {
    return await FS.readAsStringAsync(uri, { encoding: "utf8" });
  }
}

// ─── CSV com PapaParse ───────────────────────────────────────────────────────

function parsearCsv(texto: string): string {
  const result = Papa.parse<Record<string, string>>(texto, {
    header: true,
    skipEmptyLines: true,
  });
  if (!result.data.length) return texto;
  const cabecalho = result.meta.fields?.join("\t") ?? "";
  const linhas = result.data.map(row =>
    (result.meta.fields ?? []).map(f => row[f] ?? "").join("\t")
  );
  return [cabecalho, ...linhas].join("\n");
}

// ─── DOCX via JSZip ─────────────────────────────────────────────────────────

async function extrairDocx(b64: string): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(b64, { base64: true });
  const xmlFile = zip.files["word/document.xml"];
  if (!xmlFile) throw new Error("Formato DOCX inválido");
  const xml = await xmlFile.async("string");
  return xml
    .replace(/<w:p[ >][^>]*>/g, "\n")
    .replace(/<\/w:p>/g, "")
    .replace(/<w:t[ >][^>]*>/g, "")
    .replace(/<\/w:t>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .split("\n").map(l => l.trim()).filter(Boolean).join("\n");
}

// ─── XLSX / XLS via SheetJS ──────────────────────────────────────────────────

function extrairXlsx(b64: string): string {
  const wb = XLSX.read(b64, { type: "base64" });
  const linhas: string[] = [];
  for (const nome of wb.SheetNames) {
    const ws = wb.Sheets[nome];
    const csv = XLSX.utils.sheet_to_csv(ws);
    if (csv.trim()) {
      if (wb.SheetNames.length > 1) linhas.push(`=== Aba: ${nome} ===`);
      linhas.push(csv);
    }
  }
  return linhas.join("\n");
}

// ─── PDF com texto (pako / FlateDecode) ──────────────────────────────────────

function extrairTextoDeStream(stream: string): string {
  const partes: string[] = [];
  const tjRe  = /\(([^)]*)\)\s*Tj/g;
  const tjArr = /\[([^\]]*)\]\s*TJ/g;
  const qRe   = /\(([^)]*)\)\s*'/g;
  let m: RegExpExecArray | null;

  while ((m = tjRe.exec(stream)) !== null)
    partes.push(m[1].replace(/\\n/g, "\n").replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\\/g, "\\"));
  while ((m = tjArr.exec(stream)) !== null) {
    const strRe = /\(([^)]*)\)/g;
    let s: RegExpExecArray | null;
    while ((s = strRe.exec(m[1])) !== null)
      partes.push(s[1]);
  }
  while ((m = qRe.exec(stream)) !== null)
    partes.push("\n" + m[1]);

  return partes.join("").replace(/ {2,}/g, " ").trim();
}

function extrairPdfLocal(b64: string): string {
  const bytes = base64ToUint8Array(b64);
  const raw = new TextDecoder("latin1").decode(bytes);
  const textos: string[] = [];
  const re = /<<([^>]*)>>\s*stream\r?\n?([\s\S]*?)endstream/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(raw)) !== null) {
    const dict = m[1];
    const data = m[2];

    if (dict.includes("FlateDecode") || dict.includes("Fl ")) {
      const buf = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) buf[i] = data.charCodeAt(i) & 0xff;
      try {
        const dec = pako.inflate(buf);
        const txt = extrairTextoDeStream(new TextDecoder("latin1").decode(dec));
        if (txt.trim()) textos.push(txt);
      } catch { /* stream inválido */ }
    } else if (!dict.includes("Filter")) {
      const txt = extrairTextoDeStream(data);
      if (txt.trim()) textos.push(txt);
    }
  }

  const resultado = textos.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  // Verificação: texto legível tem > 60% de caracteres imprimíveis
  if (resultado.length > 10) {
    const legivel = (resultado.match(/[\u0020-\u007E\u00C0-\u024F\n]/g) ?? []).length;
    if (legivel / resultado.length > 0.6) return resultado;
  }

  throw new Error("PDF comprimido com codificação de fonte customizada.");
}

// ─── Gemini Vision (PDF escaneado + imagens) ─────────────────────────────────

const MIME_GEMINI: Record<string, string> = {
  pdf:  "application/pdf",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  gif:  "image/gif",
  bmp:  "image/bmp",
  tiff: "image/tiff",
};

async function extrairComGemini(
  b64: string,
  mimeType: string,
  geminiKey: string,
  prompt = "Extraia todo o texto deste documento preservando parágrafos e formatação. Retorne apenas o texto extraído, sem comentários."
): Promise<string> {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: b64 } },
            { text: prompt },
          ],
        }],
      }),
    }
  );
  const json = await resp.json();
  const txt: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!txt.trim()) throw new Error("Gemini não conseguiu extrair conteúdo deste arquivo.");
  return txt;
}

// ─── Exportação principal ────────────────────────────────────────────────────

export interface ImportResult {
  nome: string;
  conteudo: string;
  metodo: string;
}

export async function importarArquivoLocal(
  asset: { uri: string; name?: string | null; mimeType?: string | null },
  geminiKey?: string
): Promise<ImportResult> {
  const mime = (asset.mimeType ?? "").toLowerCase();
  const nome = (asset.name ?? "arquivo").toLowerCase();
  const ext  = nome.split(".").pop() ?? "";

  // ── Texto puro ───────────────────────────────────────────────────────────
  const isTexto =
    mime.startsWith("text/") ||
    ["application/json", "application/xml", "application/javascript"].includes(mime) ||
    mime === "" ||
    ["txt","md","html","htm","json","xml","css","js","ts"].includes(ext);

  if (isTexto) {
    let txt = await lerTexto(asset.uri);
    if (ext === "csv" || mime === "text/csv") txt = parsearCsv(txt);
    return { nome: asset.name ?? "arquivo", conteudo: txt, metodo: "texto" };
  }

  // ── CSV ──────────────────────────────────────────────────────────────────
  if (ext === "csv" || mime === "text/csv") {
    const txt = parsearCsv(await lerTexto(asset.uri));
    return { nome: asset.name ?? "arquivo", conteudo: txt, metodo: "CSV (papaparse)" };
  }

  const b64 = await FS.readAsStringAsync(asset.uri, { encoding: "base64" });

  // ── DOCX ─────────────────────────────────────────────────────────────────
  if (mime.includes("wordprocessingml") || ext === "docx") {
    const txt = await extrairDocx(b64);
    return { nome: asset.name ?? "arquivo", conteudo: txt, metodo: "Word (local)" };
  }

  // ── XLSX / XLS (SheetJS suporta ambos) ───────────────────────────────────
  if (mime.includes("spreadsheetml") || mime.includes("excel") || ["xlsx","xls"].includes(ext)) {
    const txt = extrairXlsx(b64);
    return { nome: asset.name ?? "arquivo", conteudo: txt, metodo: "Excel (SheetJS)" };
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  if (mime === "application/pdf" || ext === "pdf") {
    // 1ª tentativa: extração local com pako (sem chave)
    try {
      const txt = extrairPdfLocal(b64);
      return { nome: asset.name ?? "arquivo", conteudo: txt, metodo: "PDF (local)" };
    } catch {
      // 2ª tentativa: Gemini Vision
      if (!geminiKey) {
        throw new Error(
          "Este PDF é escaneado ou usa codificação especial.\n\n" +
          "Configure uma chave Gemini (AIza...) em ☰ → Configurações → Chaves para extração por OCR.\n\n" +
          "Gratuita em: aistudio.google.com/app/apikey"
        );
      }
      const txt = await extrairComGemini(b64, "application/pdf", geminiKey);
      return { nome: asset.name ?? "arquivo", conteudo: txt, metodo: "PDF (Gemini OCR)" };
    }
  }

  // ── Imagens (JPG, PNG, WebP, HEIC…) via Gemini Vision ────────────────────
  if (MIME_GEMINI[ext] || mime.startsWith("image/")) {
    const imgMime = MIME_GEMINI[ext] ?? mime;
    if (!geminiKey) {
      throw new Error(
        "Para extrair texto de imagens, configure uma chave Gemini (AIza...).\n\n" +
        "Gratuita em: aistudio.google.com/app/apikey"
      );
    }
    const txt = await extrairComGemini(
      b64,
      imgMime,
      geminiKey,
      "Esta é uma imagem de um documento jurídico. Transcreva TODO o texto visível, preservando a estrutura original (parágrafos, listas, tabelas). Retorne apenas o texto, sem comentários."
    );
    return { nome: asset.name ?? "arquivo", conteudo: txt, metodo: "Imagem (Gemini OCR)" };
  }

  // ── .DOC antigo ───────────────────────────────────────────────────────────
  if (ext === "doc") {
    throw new Error("Formato .DOC (Word antigo) não é suportado.\n\nSalve como .DOCX e importe novamente.");
  }

  // ── Qualquer outro: tenta como texto ──────────────────────────────────────
  try {
    const txt = await lerTexto(asset.uri);
    return { nome: asset.name ?? "arquivo", conteudo: txt, metodo: "texto" };
  } catch {
    throw new Error(
      `Formato não suportado: "${asset.name}".\n\n` +
      "Sem chave: TXT · HTML · CSV · JSON · XML · DOCX · XLSX · XLS · PDF com texto\n" +
      "Com chave Gemini: PDF escaneado · JPG · PNG · WebP · HEIC"
    );
  }
}
