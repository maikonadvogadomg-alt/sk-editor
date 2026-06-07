import { getConfig } from "./storage";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResult {
  texto: string;
  provedor: string;
  modelo: string;
  erro?: string;
}

export function autoDetectProvider(key: string): { url: string; modelo: string; nome: string } {
  const k = key.trim();
  if (k.startsWith("gsk_"))    return { url: "https://api.groq.com/openai/v1",            modelo: "llama-3.3-70b-versatile",                      nome: "Groq" };
  if (k.startsWith("AIza"))    return { url: "https://generativelanguage.googleapis.com/v1beta/openai", modelo: "gemini-2.0-flash",              nome: "Gemini" };
  if (k.startsWith("sk-or-"))  return { url: "https://openrouter.ai/api/v1",               modelo: "meta-llama/llama-3.3-70b-instruct:free",       nome: "OpenRouter" };
  if (k.startsWith("sk-ant-")) return { url: "https://api.anthropic.com/v1",               modelo: "claude-haiku-4-20250514",                      nome: "Claude" };
  if (k.startsWith("pplx-"))   return { url: "https://api.perplexity.ai",                  modelo: "sonar-pro",                                    nome: "Perplexity" };
  if (k.startsWith("xai-"))    return { url: "https://api.x.ai/v1",                        modelo: "grok-2",                                       nome: "xAI Grok" };
  if (k.startsWith("sk-"))     return { url: "https://api.openai.com/v1",                  modelo: "gpt-4o-mini",                                  nome: "OpenAI" };
  return                               { url: "https://api.groq.com/openai/v1",            modelo: "llama-3.3-70b-versatile",                      nome: "Groq" };
}

function maxTokensParaProvedor(url: string): number {
  if (url.includes("groq.com"))                          return 32768;
  if (url.includes("anthropic.com"))                     return 16000;
  if (url.includes("openrouter.ai"))                     return 16000;
  if (url.includes("openai.com"))                        return 16384;
  if (url.includes("generativelanguage.googleapis.com")) return 8192;
  if (url.includes("perplexity.ai"))                     return 8000;
  if (url.includes("x.ai"))                              return 16384;
  return 16000;
}

async function chatOpenAICompatible(
  key: string,
  url: string,
  modelo: string,
  messages: AIMessage[],
): Promise<string> {
  const maxTokens = maxTokensParaProvedor(url);
  const base = url.endsWith("/") ? url.slice(0, -1) : url;
  const resp = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: modelo,
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`[${resp.status}] ${err.slice(0, 400)}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

async function chatAnthropic(
  key: string,
  modelo: string,
  messages: AIMessage[],
): Promise<string> {
  const maxTokens = 16000;
  const systemMsg = messages.find((m) => m.role === "system")?.content || "";
  const userMsgs = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: maxTokens,
      system: systemMsg || undefined,
      messages: userMsgs,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`[Claude ${resp.status}] ${err.slice(0, 400)}`);
  }

  const data = await resp.json();
  return data.content?.[0]?.text || "";
}

async function chamarIA(
  key: string,
  url: string,
  modelo: string,
  messages: AIMessage[],
): Promise<string> {
  if (url.includes("anthropic.com")) {
    return chatAnthropic(key, modelo, messages);
  }
  return chatOpenAICompatible(key, url, modelo, messages);
}

function resolveChave(n: 1 | 2 | 3 | 4, cfg: any): { key: string; url: string; modelo: string; nome: string } | null {
  const key = cfg[`chave${n}`] as string;
  if (!key) return null;
  const detected = autoDetectProvider(key);
  return {
    key,
    url: cfg[`chave${n}Url`] || detected.url,
    modelo: cfg[`chave${n}Modelo`] || detected.modelo,
    nome: detected.nome,
  };
}

export async function enviarParaIA(
  system: string,
  userMsg: string,
  historicoMsgs: AIMessage[] = [],
): Promise<AIResult> {
  const cfg = await getConfig();

  let key = "";
  let url = "";
  let modelo = "";
  let nome = "";

  if (cfg.modeloAtivo === "chave1") {
    const r = resolveChave(1, cfg);
    if (r) { key = r.key; url = r.url; modelo = r.modelo; nome = r.nome; }
  } else if (cfg.modeloAtivo === "chave2") {
    const r = resolveChave(2, cfg);
    if (r) { key = r.key; url = r.url; modelo = r.modelo; nome = r.nome; }
  } else if (cfg.modeloAtivo === "chave3") {
    const r = resolveChave(3, cfg);
    if (r) { key = r.key; url = r.url; modelo = r.modelo; nome = r.nome; }
  } else if (cfg.modeloAtivo === "chave4") {
    const r = resolveChave(4, cfg);
    if (r) { key = r.key; url = r.url; modelo = r.modelo; nome = r.nome; }
  } else {
    key = cfg.chaveDemo;
    url = cfg.chaveDemoUrl;
    modelo = cfg.chaveDemoModelo;
    nome = "Groq (Demo)";
  }

  // Se ainda sem chave, tenta qualquer chave configurada como fallback
  if (!key) {
    for (const n of [1, 2, 3, 4] as const) {
      const r = resolveChave(n, cfg);
      if (r) { key = r.key; url = r.url; modelo = r.modelo; nome = `${r.nome} (fallback)`; break; }
    }
  }

  if (!key) {
    return {
      texto: "",
      provedor: "",
      modelo: "",
      erro: "Nenhuma chave de IA configurada.\n\nVá em ☰ → Configurações → aba Chaves e adicione uma chave Groq ou Gemini (ambas gratuitas).",
    };
  }

  try {
    const messages: AIMessage[] = [
      { role: "system", content: system },
      ...historicoMsgs,
    ];
    if (userMsg) messages.push({ role: "user", content: userMsg });

    const texto = await chamarIA(key, url, modelo, messages);
    return { texto, provedor: nome, modelo };
  } catch (e: any) {
    return { texto: "", provedor: nome, modelo, erro: e.message || "Erro ao chamar a IA" };
  }
}

export interface StatusChave {
  slot: string;
  nome: string;
  modelo: string;
  status: "ok" | "erro" | "sem_chave" | "testando";
  mensagem: string;
}

export async function testarTodasChaves(): Promise<StatusChave[]> {
  const cfg = await getConfig();
  const resultados: StatusChave[] = [];

  for (const n of [1, 2, 3, 4] as const) {
    const r = resolveChave(n, cfg);
    if (!r) {
      resultados.push({ slot: `Chave ${n}`, nome: "—", modelo: "—", status: "sem_chave", mensagem: "Não configurada" });
      continue;
    }
    const item: StatusChave = { slot: `Chave ${n}`, nome: r.nome, modelo: r.modelo, status: "testando", mensagem: "Testando..." };
    resultados.push(item);
    try {
      const res = await chamarIA(r.key, r.url, r.modelo, [
        { role: "user", content: "Responda apenas: OK" },
      ]);
      item.status = res ? "ok" : "erro";
      item.mensagem = res ? "Funcionando ✓" : "Resposta vazia";
    } catch (e: any) {
      item.status = "erro";
      item.mensagem = e.message?.slice(0, 100) || "Erro desconhecido";
    }
  }

  const demoItem: StatusChave = {
    slot: "Demo (Groq)",
    nome: "Groq",
    modelo: cfg.chaveDemoModelo,
    status: "testando",
    mensagem: "Testando...",
  };
  resultados.push(demoItem);
  try {
    if (!cfg.chaveDemo) {
      demoItem.status = "sem_chave";
      demoItem.mensagem = "Usando chave embutida (limitada)";
    } else {
      const res = await chamarIA(cfg.chaveDemo, cfg.chaveDemoUrl, cfg.chaveDemoModelo, [
        { role: "user", content: "Responda apenas: OK" },
      ]);
      demoItem.status = res ? "ok" : "erro";
      demoItem.mensagem = res ? "Funcionando ✓" : "Resposta vazia";
    }
  } catch (e: any) {
    demoItem.status = "erro";
    demoItem.mensagem = e.message?.slice(0, 100) || "Erro";
  }

  return resultados;
}
