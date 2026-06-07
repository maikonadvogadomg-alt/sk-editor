-- ═══════════════════════════════════════════════════════════
-- ASSISTENTE JURÍDICO — Setup do Banco Neon (PostgreSQL)
-- Execute este SQL no painel do Neon: neon.tech → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Tabela de histórico de processamentos
CREATE TABLE IF NOT EXISTS historico (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tipo TEXT NOT NULL,
  entrada TEXT,
  saida TEXT,
  provedor TEXT,
  data BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  device_id TEXT
);

-- Tabela de trechos salvos (snippets)
CREATE TABLE IF NOT EXISTS snippets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  data BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  device_id TEXT
);

-- Tabela de conversa (Campo Livre)
CREATE TABLE IF NOT EXISTS conversa (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  data BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  device_id TEXT
);

-- Tabela de configurações sincronizadas (opcional)
CREATE TABLE IF NOT EXISTS app_settings (
  chave TEXT PRIMARY KEY,
  valor TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de templates de prompts personalizados
CREATE TABLE IF NOT EXISTS prompt_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nome TEXT NOT NULL,
  prompt TEXT NOT NULL,
  categoria TEXT DEFAULT 'geral',
  data BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico(data DESC);
CREATE INDEX IF NOT EXISTS idx_historico_device ON historico(device_id);
CREATE INDEX IF NOT EXISTS idx_conversa_data ON conversa(data ASC);
CREATE INDEX IF NOT EXISTS idx_conversa_device ON conversa(device_id);
CREATE INDEX IF NOT EXISTS idx_snippets_data ON snippets(data DESC);

-- Verificar criação
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) AS colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('historico', 'snippets', 'conversa', 'app_settings', 'prompt_templates')
ORDER BY table_name;
