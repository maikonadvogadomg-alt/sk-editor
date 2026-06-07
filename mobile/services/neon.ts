import { getConfig } from "./storage";

export interface NeonResult {
  rows: Record<string, any>[];
  rowCount: number;
  command?: string;
  fields?: { name: string; dataTypeID: number }[];
}

export interface NeonError {
  error: string;
  query?: string;
}

function parseConnectionString(url: string): { host: string; password: string } | null {
  try {
    const u = new URL(url);
    return { host: u.hostname, password: decodeURIComponent(u.password) };
  } catch {
    return null;
  }
}

export async function executarQueryNeon(
  query: string,
  params: any[] = [],
  databaseUrl?: string
): Promise<NeonResult> {
  const url = databaseUrl ?? (await getConfig()).databaseUrl;
  if (!url?.trim()) throw new Error("URL do banco não configurada. Acesse Configurações → Dados → Banco Neon.");

  const conn = parseConnectionString(url.trim());
  if (!conn) throw new Error("URL do banco inválida. Use o formato postgresql://user:senha@host.neon.tech/banco");

  const resp = await fetch(`https://${conn.host}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${conn.password}`,
      "Neon-Connection-String": url.trim(),
    },
    body: JSON.stringify({ query: query.trim(), params }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    const msg = data?.message ?? data?.error ?? JSON.stringify(data);
    throw new Error(`Neon erro ${resp.status}: ${msg}`);
  }

  return {
    rows: data.rows ?? [],
    rowCount: data.rowCount ?? 0,
    command: data.command,
    fields: data.fields,
  };
}

function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map(s => s.replace(/--[^\n]*/g, "").trim())
    .filter(s => s.length > 0);
}

export async function executarScriptNeon(
  script: string,
  databaseUrl?: string
): Promise<{ ok: number; errors: NeonError[] }> {
  const url = databaseUrl ?? (await getConfig()).databaseUrl;
  const statements = splitStatements(script);
  let ok = 0;
  const errors: NeonError[] = [];

  for (const stmt of statements) {
    try {
      await executarQueryNeon(stmt, [], url);
      ok++;
    } catch (e: any) {
      errors.push({ error: e.message ?? String(e), query: stmt.slice(0, 120) });
    }
  }
  return { ok, errors };
}

export async function testarConexaoNeon(databaseUrl?: string): Promise<string> {
  const result = await executarQueryNeon("SELECT version()", [], databaseUrl);
  const ver: string = result.rows?.[0]?.version ?? "PostgreSQL";
  return ver.split(" ").slice(0, 2).join(" ");
}

export const SQL_SETUP = `
CREATE TABLE IF NOT EXISTS historico (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tipo TEXT NOT NULL,
  entrada TEXT,
  saida TEXT,
  provedor TEXT,
  data BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  device_id TEXT
);

CREATE TABLE IF NOT EXISTS snippets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  data BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  device_id TEXT
);

CREATE TABLE IF NOT EXISTS conversa (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  data BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  device_id TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
  chave TEXT PRIMARY KEY,
  valor TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prompt_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nome TEXT NOT NULL,
  prompt TEXT NOT NULL,
  categoria TEXT DEFAULT 'geral',
  data BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

CREATE INDEX IF NOT EXISTS idx_historico_data ON historico(data DESC);
CREATE INDEX IF NOT EXISTS idx_historico_device ON historico(device_id);
CREATE INDEX IF NOT EXISTS idx_conversa_data ON conversa(data ASC);
CREATE INDEX IF NOT EXISTS idx_conversa_device ON conversa(device_id);
CREATE INDEX IF NOT EXISTS idx_snippets_data ON snippets(data DESC)
`;
