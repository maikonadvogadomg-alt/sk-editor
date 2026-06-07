import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AppConfig {
  senhaLogin: string;
  loginConfigurado: boolean;
  primeiroAcesso: boolean;
  chave1: string;
  chave1Url?: string;
  chave1Modelo?: string;
  chave2: string;
  chave2Url?: string;
  chave2Modelo?: string;
  chave3: string;
  chave3Url?: string;
  chave3Modelo?: string;
  chave4: string;
  chave4Url?: string;
  chave4Modelo?: string;
  chaveDemo: string;
  chaveDemoModelo: string;
  chaveDemoUrl: string;
  chavePerplexity: string;
  driveToken: string;
  easToken: string;
  databaseUrl: string;
  temaEscuro: boolean;
  vozAtiva: boolean;
  vozVelocidade: number;
  vozId?: string;
  nomeAssistente?: string;
  modeloAtivo: "chave1" | "chave2" | "chave3" | "chave4" | "demo";
}

const CONFIG_KEY = "@aj_config";
const HISTORY_KEY = "@aj_history";
const SNIPPETS_KEY = "@aj_snippets";
const CONVERSA_KEY = "@aj_conversa";
const WORD_FORMAT_KEY = "@aj_word_format";
const PROMPTS_LIB_KEY = "@aj_prompts_lib";

export interface WordFormat {
  fonte: string;
  tamanho: number;
  espacamento: number;
  recuoParagrafo: number;
  margemSuperior: number;
  margemInferior: number;
  margemEsquerda: number;
  margemDireita: number;
}

export const DEFAULT_WORD_FORMAT: WordFormat = {
  fonte: "Times New Roman",
  tamanho: 12,
  espacamento: 1.5,
  recuoParagrafo: 4,
  margemSuperior: 3,
  margemInferior: 2,
  margemEsquerda: 3,
  margemDireita: 2,
};

export async function getWordFormat(): Promise<WordFormat> {
  try {
    const raw = await AsyncStorage.getItem(WORD_FORMAT_KEY);
    return raw ? { ...DEFAULT_WORD_FORMAT, ...JSON.parse(raw) } : { ...DEFAULT_WORD_FORMAT };
  } catch { return { ...DEFAULT_WORD_FORMAT }; }
}

export async function saveWordFormat(fmt: Partial<WordFormat>): Promise<void> {
  const current = await getWordFormat();
  await AsyncStorage.setItem(WORD_FORMAT_KEY, JSON.stringify({ ...current, ...fmt }));
}

export interface PromptLib {
  id: string;
  nome: string;
  texto: string;
  data: number;
}

export async function getPromptsLib(): Promise<PromptLib[]> {
  try {
    const raw = await AsyncStorage.getItem(PROMPTS_LIB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function savePromptLib(nome: string, texto: string): Promise<void> {
  const list = await getPromptsLib();
  list.unshift({ id: Date.now().toString(), nome, texto, data: Date.now() });
  await AsyncStorage.setItem(PROMPTS_LIB_KEY, JSON.stringify(list.slice(0, 100)));
}

export async function deletePromptLib(id: string): Promise<void> {
  const list = await getPromptsLib();
  await AsyncStorage.setItem(PROMPTS_LIB_KEY, JSON.stringify(list.filter(p => p.id !== id)));
}

const DEFAULT_CONFIG: AppConfig = {
  senhaLogin: "",
  loginConfigurado: false,
  primeiroAcesso: true,
  chave1: "",
  chave1Url: "",
  chave1Modelo: "",
  chave2: "",
  chave2Url: "",
  chave2Modelo: "",
  chave3: "",
  chave3Url: "",
  chave3Modelo: "",
  chave4: "",
  chave4Url: "",
  chave4Modelo: "",
  chaveDemo: "",
  chaveDemoModelo: "llama-3.3-70b-versatile",
  chaveDemoUrl: "https://api.groq.com/openai/v1",
  chavePerplexity: "",
  driveToken: "",
  easToken: "",
  databaseUrl: "",
  temaEscuro: true,
  vozAtiva: false,
  vozVelocidade: 1.1,
  modeloAtivo: "demo",
};

export async function getConfig(): Promise<AppConfig> {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(partial: Partial<AppConfig>): Promise<void> {
  const current = await getConfig();
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify({ ...current, ...partial }));
}

export async function isPrimeiroAcesso(): Promise<boolean> {
  const cfg = await getConfig();
  return cfg.primeiroAcesso;
}

export async function verificarSenha(senha: string): Promise<boolean> {
  const cfg = await getConfig();
  if (!cfg.loginConfigurado || !cfg.senhaLogin) return true;
  return cfg.senhaLogin === senha;
}

export async function autoDetectProvider(_key: string): Promise<string> {
  return "";
}

export interface HistoricoItem {
  id: string;
  tipo: string;
  entrada: string;
  saida: string;
  data: number;
  provedor?: string;
}

export async function getHistorico(): Promise<HistoricoItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addHistorico(item: Omit<HistoricoItem, "id" | "data">): Promise<void> {
  const hist = await getHistorico();
  const novo: HistoricoItem = {
    ...item,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    data: Date.now(),
  };
  const updated = [novo, ...hist].slice(0, 100);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function clearHistorico(): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]));
}

export interface Snippet {
  id: string;
  titulo: string;
  conteudo: string;
  data: number;
}

export async function getSnippets(): Promise<Snippet[]> {
  try {
    const raw = await AsyncStorage.getItem(SNIPPETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveSnippet(titulo: string, conteudo: string): Promise<void> {
  const snips = await getSnippets();
  snips.unshift({ id: Date.now().toString() + Math.random().toString(36).substr(2, 9), titulo, conteudo, data: Date.now() });
  await AsyncStorage.setItem(SNIPPETS_KEY, JSON.stringify(snips.slice(0, 50)));
}

export async function updateSnippet(id: string, partial: Partial<Snippet>): Promise<void> {
  const snips = await getSnippets();
  await AsyncStorage.setItem(SNIPPETS_KEY, JSON.stringify(snips.map(s => s.id === id ? { ...s, ...partial } : s)));
}

export async function deleteSnippet(id: string): Promise<void> {
  const snips = await getSnippets();
  await AsyncStorage.setItem(SNIPPETS_KEY, JSON.stringify(snips.filter(s => s.id !== id)));
}

// ─── Ementas / Jurisprudências (biblioteca com CRUD) ─────────────────
const EMENTAS_KEY = "@aj_ementas";

export interface Ementa {
  id: string;
  titulo: string;
  categoria: string;
  texto: string;
  data: number;
}

export async function getEmentas(): Promise<Ementa[]> {
  try {
    const raw = await AsyncStorage.getItem(EMENTAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveEmenta(titulo: string, categoria: string, texto: string): Promise<Ementa> {
  const ementas = await getEmentas();
  const nova: Ementa = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
    titulo, categoria, texto, data: Date.now(),
  };
  await AsyncStorage.setItem(EMENTAS_KEY, JSON.stringify([nova, ...ementas].slice(0, 200)));
  return nova;
}

export async function updateEmenta(id: string, partial: Partial<Ementa>): Promise<void> {
  const ementas = await getEmentas();
  await AsyncStorage.setItem(EMENTAS_KEY, JSON.stringify(ementas.map(e => e.id === id ? { ...e, ...partial } : e)));
}

export async function deleteEmenta(id: string): Promise<void> {
  const ementas = await getEmentas();
  await AsyncStorage.setItem(EMENTAS_KEY, JSON.stringify(ementas.filter(e => e.id !== id)));
}

// ─── Templates personalizados ────────────────────────────────────────
const TEMPLATES_KEY = "@aj_templates";

export interface Template {
  id: string;
  nome: string;
  conteudo: string;
  data: number;
}

export async function getTemplates(): Promise<Template[]> {
  try {
    const raw = await AsyncStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveTemplate(nome: string, conteudo: string): Promise<Template> {
  const templates = await getTemplates();
  const novo: Template = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    nome,
    conteudo,
    data: Date.now(),
  };
  await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify([novo, ...templates].slice(0, 20)));
  return novo;
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await getTemplates();
  await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates.filter(t => t.id !== id)));
}

export interface Mensagem {
  id: string;
  role: "user" | "assistant";
  content: string;
  data: number;
}

export async function getConversa(): Promise<Mensagem[]> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveConversa(msgs: Mensagem[]): Promise<void> {
  await AsyncStorage.setItem(CONVERSA_KEY, JSON.stringify(msgs.slice(-200)));
}

export async function clearConversa(): Promise<void> {
  await AsyncStorage.setItem(CONVERSA_KEY, JSON.stringify([]));
}

// ─── Playground Snippets ─────────────────────────────────────────────
const PLAYGROUND_KEY = "@aj_playground";

export interface PlaygroundSnippet {
  id: string;
  nome: string;
  codigo: string;
  data: number;
}

export async function getPlaygroundSnippets(): Promise<PlaygroundSnippet[]> {
  try {
    const raw = await AsyncStorage.getItem(PLAYGROUND_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function savePlaygroundSnippet(nome: string, codigo: string): Promise<PlaygroundSnippet> {
  const snips = await getPlaygroundSnippets();
  const novo: PlaygroundSnippet = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    nome, codigo, data: Date.now(),
  };
  await AsyncStorage.setItem(PLAYGROUND_KEY, JSON.stringify([novo, ...snips]));
  return novo;
}

export async function savePlaygroundSnippetsBatch(files: { nome: string; codigo: string }[]): Promise<void> {
  const existing = await getPlaygroundSnippets();
  const now = Date.now();
  const novos: PlaygroundSnippet[] = files.map((f, i) => ({
    id: (now + i).toString() + Math.random().toString(36).substr(2, 9),
    nome: f.nome,
    codigo: f.codigo,
    data: now,
  }));
  await AsyncStorage.setItem(PLAYGROUND_KEY, JSON.stringify([...novos, ...existing]));
}

export async function updatePlaygroundSnippet(id: string, partial: Partial<PlaygroundSnippet>): Promise<void> {
  const snips = await getPlaygroundSnippets();
  await AsyncStorage.setItem(
    PLAYGROUND_KEY,
    JSON.stringify(snips.map(s => s.id === id ? { ...s, ...partial } : s))
  );
}

export async function deletePlaygroundSnippet(id: string): Promise<void> {
  const snips = await getPlaygroundSnippets();
  await AsyncStorage.setItem(PLAYGROUND_KEY, JSON.stringify(snips.filter(s => s.id !== id)));
}
