# 📋 Plano do projeto: codelens-local-desktop (1)

_Gerado em 13/10/2026, 15:15:13 — sem IA, lendo os arquivos._

## 📊 Visão geral
| Item | Valor |
|---|---|
| Arquivos | 1193 |
| Linhas | 39.830 |
| Telas/páginas | 13 |
| Rotas do backend | 58 |
| Chamadas do app | 14 |
| Tabelas do banco | 4 |
| Variáveis de ambiente | 17 |

**Linguagens:** Outros (999), TypeScript (React) (77), Imagem (35), TypeScript (32), JSON (11), JavaScript (11), YAML (9), Imagem SVG (5), Markdown (4), HTML (3), Ícone (2), Batch (Windows) (2), Shell (2), CSS (1)

## 🧩 Apps dentro deste projeto
- www (codelens-local)

## 💡 O que fazer (em ordem)
1. 🧹 Tirar a Replit de 12 arquivo(s) (🏗️ Preparar → Fazer tudo)
2. 🔌 O app chama 1 endereço(s) que o backend deste projeto NÃO tem — veja "O que falta no backend"
3. 🔐 Criar um .env.example com: AI_INTEGRATIONS_GEMINI_API_KEY, AI_INTEGRATIONS_GEMINI_BASE_URL, BASE_URL, C, DATA_DIR, DEV, LOG_LEVEL, NODE_ENV, NO_BROWSER, PATH, PORT, PREFIX… (os valores você coloca no servidor, nunca no código)
4. 🗄️ Precisa de banco de dados (4 tabela(s)) — Neon ou Supabase servem, grátis

## 🚀 Por onde começa
- `index.html`
- `main.js`
- `www/index.html`
- `www/lib/api-client-react/index.ts`
- `www/lib/api-zod/index.ts`
- `www/lib/db/index.ts`
- `www/server/app.ts`
- `www/server/index.ts`
- `www/server/routes/index.ts`
- `www/src/App.tsx`
- `www/src/main.tsx`

## ⌨️ Comandos (package.json)
| Pasta | Comando | O que roda |
|---|---|---|
| . | `npm run desktop` | `electron .` |
| . | `npm run exe` | `electron-builder --win portable --publish never` |
| . | `npm run start` | `electron .` |
| . | `npm run build` | `electron-builder --publish=never` |
| . | `npm run build:win` | `electron-builder --win --x64 --publish=never` |
| . | `npm run build:mac` | `electron-builder --mac --x64 --arm64 --publish=never` |
| . | `npm run build:linux` | `electron-builder --linux --x64 --publish=never` |
| www | `npm run desktop` | `electron .` |
| www | `npm run exe` | `electron-builder --win portable --publish never` |
| www | `npm run iniciar` | `node scripts/iniciar.mjs` |
| www | `npm run start` | `tsx server/index.ts` |
| www | `npm run build` | `vite build` |
| www | `npm run dev` | `concurrently -k -n servidor,tela -c blue,magenta "npm:dev:servidor" "npm:dev:tela"` |
| www | `npm run dev:servidor` | `tsx watch --clear-screen=false server/index.ts` |
| www | `npm run dev:tela` | `vite` |
| www | `npm run checar` | `tsc --noEmit -p tsconfig.json` |

## 📱 Telas e páginas
| Endereço | Arquivo |
|---|---|
| `/` | www/src/App.tsx |
| `/projects/:id` | www/src/App.tsx |
| `/settings` | www/src/App.tsx |
| `/playground` | www/src/App.tsx |
| `/assistant` | www/src/App.tsx |
| `index.html` | index.html |
| `www/index.html` | www/index.html |
| `/assistant` | www/src/pages/assistant.tsx |
| `/home` | www/src/pages/home.tsx |
| `/not-found` | www/src/pages/not-found.tsx |
| `/playground` | www/src/pages/playground.tsx |
| `/project-explorer` | www/src/pages/project-explorer.tsx |
| `/settings` | www/src/pages/settings.tsx |

## 🖥️ Rotas do backend
| Método | Rota | Arquivo |
|---|---|---|
| USE | `/api` | www/server/app.ts |
| GET | `/` | www/server/app.ts |
| POST | `/ai/chat` | www/server/routes/ai.ts |
| POST | `/ai/analyze-file` | www/server/routes/ai.ts |
| POST | `/ai/analyze-folder` | www/server/routes/ai.ts |
| POST | `/ai/tts` | www/server/routes/ai.ts |
| POST | `/code-assistant` | www/server/routes/code-assistant.ts |
| POST | `/code/run` | www/server/routes/code-run.ts |
| POST | `/projects/:projectId/dev-server/start` | www/server/routes/dev-server.ts |
| DELETE | `/projects/:projectId/dev-server/stop` | www/server/routes/dev-server.ts |
| GET | `/projects/:projectId/dev-server/status` | www/server/routes/dev-server.ts |
| ALL | `/projects/:projectId/dev-proxy` | www/server/routes/dev-server.ts |
| ALL | `/projects/:projectId/dev-proxy/` | www/server/routes/dev-server.ts |
| ALL | `/projects/:projectId/dev-proxy/*path` | www/server/routes/dev-server.ts |
| ALL | `/projects/:projectId/port-proxy/:port{/*path}` | www/server/routes/dev-server.ts |
| POST | `/projects/:projectId/exec-stream` | www/server/routes/exec.ts |
| POST | `/projects/:projectId/exec` | www/server/routes/exec.ts |
| GET | `/projects/:projectId/files` | www/server/routes/files.ts |
| PUT | `/projects/:projectId/files` | www/server/routes/files.ts |
| DELETE | `/projects/:projectId/files` | www/server/routes/files.ts |
| POST | `/projects/:projectId/files/mkdir` | www/server/routes/files.ts |
| PATCH | `/projects/:projectId/files` | www/server/routes/files.ts |
| POST | `/projects/:projectId/files/copy` | www/server/routes/files.ts |
| GET | `/projects/:projectId/git/info` | www/server/routes/git.ts |
| GET | `/projects/:projectId/git/log` | www/server/routes/git.ts |
| GET | `/projects/:projectId/git/procurar` | www/server/routes/git.ts |
| GET | `/projects/:projectId/git/mudancas` | www/server/routes/git.ts |
| GET | `/projects/:projectId/git/arquivos` | www/server/routes/git.ts |
| GET | `/projects/:projectId/git/ver` | www/server/routes/git.ts |
| GET | `/projects/:projectId/git/diferencas` | www/server/routes/git.ts |
| POST | `/projects/:projectId/git/restaurar` | www/server/routes/git.ts |
| GET | `/projects/:projectId/git/zip` | www/server/routes/git.ts |
| GET | `/projects/:projectId/git/relatorio` | www/server/routes/git.ts |
| POST | `/projects/:projectId/git/importar-bundle` | www/server/routes/git.ts |
| POST | `/github/create-repo` | www/server/routes/github.ts |
| GET | `/github/conta` | www/server/routes/github.ts |
| POST | `/github/token` | www/server/routes/github.ts |
| DELETE | `/github/token` | www/server/routes/github.ts |
| GET | `/github/repos` | www/server/routes/github.ts |
| POST | `/github/enviar` | www/server/routes/github.ts |
| GET | `/healthz` | www/server/routes/health.ts |
| POST | `/projects/import-github` | www/server/routes/import-github.ts |
| GET | `/projects/:projectId/preview/status` | www/server/routes/preview.ts |
| GET | `/projects/:projectId/preview{/*path}` | www/server/routes/preview.ts |
| GET | `/projects` | www/server/routes/projects.ts |
| POST | `/projects` | www/server/routes/projects.ts |
| GET | `/` | www/server/routes/projects.ts |
| GET | `/api/hello` | www/server/routes/projects.ts |
| POST | `/projects/blank` | www/server/routes/projects.ts |
| GET | `/projects/:projectId` | www/server/routes/projects.ts |
| GET | `/projects/:projectId/download` | www/server/routes/projects.ts |
| DELETE | `/projects/:projectId` | www/server/routes/projects.ts |
| GET | `/settings` | www/server/routes/settings.ts |
| PUT | `/settings` | www/server/routes/settings.ts |
| GET | `/snippets` | www/server/routes/snippets.ts |
| POST | `/snippets` | www/server/routes/snippets.ts |
| PATCH | `/snippets/:id` | www/server/routes/snippets.ts |
| DELETE | `/snippets/:id` | www/server/routes/snippets.ts |

## 📡 O que o app pede ao servidor
| Método | Endereço | Onde |
|---|---|---|
| GET | `/api${path}` | www/lib/api-client-react/index.ts |
| POST | `/chat/completions` | www/server/routes/code-assistant.ts |
| GET | `/api/hello` | www/server/routes/projects.ts |
| POST | `/api/ai/tts` | www/src/components/ai-panel.tsx |
| GET | `/api/projects/${projectId}/files` | www/src/components/ai-panel.tsx |
| GET | `/api/projects/${projectId}/preview/status` | www/src/components/preview-panel.tsx |
| GET | `/api/projects/${projectId}/dev-server/status` | www/src/components/preview-panel.tsx |
| POST | `/api/projects/${projectId}/dev-server/start` | www/src/components/preview-panel.tsx |
| DELETE | `/api/projects/${projectId}/dev-server/stop` | www/src/components/preview-panel.tsx |
| POST | `/api/projects/${projectId}/exec-stream` | www/src/components/terminal-panel.tsx |
| POST | `/api/code-assistant` | www/src/pages/assistant.tsx |
| POST | `/api/projects/blank` | www/src/pages/home.tsx |
| GET | `/api/snippets` | www/src/pages/playground.tsx |
| GET | `/api/projects/${projectId}/download` | www/src/pages/project-explorer.tsx |

## 🔌 O que falta no backend
O app chama estes endereços, mas **nenhuma rota deste projeto responde**. Ou o backend ficou na Replit, ou está em outro projeto. Para recriar, cada linha vira uma rota:

| Método | Endereço | Quem chama |
|---|---|---|
| GET | `/api${path}` | www/lib/api-client-react/index.ts |

## 💤 Rotas que o app não usa
- GET `/` — www/server/app.ts
- POST `/ai/chat` — www/server/routes/ai.ts
- POST `/ai/analyze-file` — www/server/routes/ai.ts
- POST `/ai/analyze-folder` — www/server/routes/ai.ts
- POST `/code/run` — www/server/routes/code-run.ts
- ALL `/projects/:projectId/dev-proxy` — www/server/routes/dev-server.ts
- ALL `/projects/:projectId/dev-proxy/` — www/server/routes/dev-server.ts
- ALL `/projects/:projectId/dev-proxy/*path` — www/server/routes/dev-server.ts
- ALL `/projects/:projectId/port-proxy/:port{/*path}` — www/server/routes/dev-server.ts
- POST `/projects/:projectId/exec` — www/server/routes/exec.ts
- POST `/projects/:projectId/files/mkdir` — www/server/routes/files.ts
- POST `/projects/:projectId/files/copy` — www/server/routes/files.ts
- GET `/projects/:projectId/git/info` — www/server/routes/git.ts
- GET `/projects/:projectId/git/log` — www/server/routes/git.ts
- GET `/projects/:projectId/git/procurar` — www/server/routes/git.ts
- GET `/projects/:projectId/git/mudancas` — www/server/routes/git.ts
- GET `/projects/:projectId/git/arquivos` — www/server/routes/git.ts
- GET `/projects/:projectId/git/ver` — www/server/routes/git.ts
- GET `/projects/:projectId/git/diferencas` — www/server/routes/git.ts
- POST `/projects/:projectId/git/restaurar` — www/server/routes/git.ts
- GET `/projects/:projectId/git/zip` — www/server/routes/git.ts
- GET `/projects/:projectId/git/relatorio` — www/server/routes/git.ts
- POST `/projects/:projectId/git/importar-bundle` — www/server/routes/git.ts
- POST `/github/create-repo` — www/server/routes/github.ts
- GET `/github/conta` — www/server/routes/github.ts
- POST `/github/token` — www/server/routes/github.ts
- DELETE `/github/token` — www/server/routes/github.ts
- GET `/github/repos` — www/server/routes/github.ts
- POST `/github/enviar` — www/server/routes/github.ts
- GET `/healthz` — www/server/routes/health.ts
- POST `/projects/import-github` — www/server/routes/import-github.ts
- GET `/projects/:projectId/preview{/*path}` — www/server/routes/preview.ts
- GET `/projects` — www/server/routes/projects.ts
- POST `/projects` — www/server/routes/projects.ts
- GET `/` — www/server/routes/projects.ts
- GET `/projects/:projectId` — www/server/routes/projects.ts
- DELETE `/projects/:projectId` — www/server/routes/projects.ts
- GET `/settings` — www/server/routes/settings.ts
- PUT `/settings` — www/server/routes/settings.ts
- PATCH `/snippets/:id` — www/server/routes/snippets.ts
- DELETE `/snippets/:id` — www/server/routes/snippets.ts

## 🗄️ Banco de dados
- **projects** — www/lib/db/index.ts
- **project_files** — www/lib/db/index.ts
- **settings** — www/lib/db/index.ts
- **snippets** — www/lib/db/index.ts

## 🔐 Variáveis de ambiente (configurar no servidor)
- `AI_INTEGRATIONS_GEMINI_API_KEY`
- `AI_INTEGRATIONS_GEMINI_BASE_URL`
- `BASE_URL`
- `C`
- `DATA_DIR`
- `DEV`
- `LOG_LEVEL`
- `NODE_ENV`
- `NO_BROWSER`
- `PATH`
- `PORT`
- `PREFIX`
- `PROD`
- `STORAGE_PATH`
- `TTS_TOM`
- `TTS_VELOCIDADE`
- `TTS_VOZ`

_Só os nomes. Os valores (chaves, senhas) nunca vão no código nem no GitHub._

## 🤖 IA usada
- Google Gemini
- generativelanguage.googleapis.com
- api.anthropic.com
- api.groq.com
- api.openai.com
- openrouter.ai

## 🌐 Serviços de fora que ele acessa
- api.anthropic.com
- api.exemplo.com
- api.github.com
- api.groq.com
- api.mistral.ai
- api.openai.com
- api.perplexity.ai
- api.x.ai
- cdnjs.cloudflare.com
- generativelanguage.googleapis.com
- github.com
- nodejs.org
- openrouter.ai
- registry.npmjs.org
- unpkg.com

## 📦 Peças principais (dependências)
`@capacitor/android` · `@capacitor/core` · `@codemirror/autocomplete` · `@codemirror/commands` · `@codemirror/lang-css` · `@codemirror/lang-html` · `@codemirror/lang-javascript` · `@codemirror/lang-json` · `@codemirror/lang-markdown` · `@codemirror/lang-python` · `@codemirror/lang-rust` · `@codemirror/lang-sql` · `@codemirror/language` · `@codemirror/state` · `@codemirror/theme-one-dark` · `@codemirror/view` · `@electric-sql/pglite` · `@google/genai` · `@octokit/rest` · `@radix-ui/react-accordion` · `@radix-ui/react-alert-dialog` · `@radix-ui/react-aspect-ratio` · `@radix-ui/react-avatar` · `@radix-ui/react-checkbox` · `@radix-ui/react-collapsible` · `@radix-ui/react-context-menu` · `@radix-ui/react-dialog` · `@radix-ui/react-dropdown-menu` · `@radix-ui/react-hover-card` · `@radix-ui/react-label` · `@radix-ui/react-menubar` · `@radix-ui/react-navigation-menu` · `@radix-ui/react-popover` · `@radix-ui/react-progress` · `@radix-ui/react-radio-group` · `@radix-ui/react-scroll-area` · `@radix-ui/react-select` · `@radix-ui/react-separator` · `@radix-ui/react-slider` · `@radix-ui/react-slot` · `@radix-ui/react-switch` · `@radix-ui/react-tabs` · `@radix-ui/react-toast` · `@radix-ui/react-toggle` · `@radix-ui/react-toggle-group` · `@radix-ui/react-tooltip` · `@tanstack/react-query` · `adm-zip` · `class-variance-authority` · `clsx` · `cmdk` · `cors` · `date-fns` · `drizzle-orm` · `embla-carousel-react` · `express` · `highlight.js` · `input-otp` · `lucide-react` · `mime-types` · `msedge-tts` · `multer` · `next-themes` · `pino` · `pino-http` · `pino-pretty` · `react` · `react-day-picker` · `react-dom` · `react-hook-form` · `react-markdown` · `react-resizable-panels` · `recharts` · `rehype-highlight` · `remark-gfm` · `sonner` · `tailwind-merge` · `tsx` · `vaul` · `wouter` · `zod`

## 🧹 Arquivos com coisa da Replit
- service-worker.js
- www/lib/api-client-react/index.ts
- www/lib/api-zod/index.ts
- www/lib/db/index.ts
- www/server/lib/storage.ts
- www/server/lib/tar.ts
- www/server/routes/code-assistant.ts
- www/server/routes/projects.ts
- www/service-worker.js
- www/src/components/ui/badge.tsx
- www/src/components/ui/button.tsx
- www/vite.config.ts

## 🔁 Roteiro para recriar fora da Replit
1. Importar o projeto no Mini SK e tocar em 🏗️ Preparar → ✅ Fazer tudo (tira a Replit, cria os arquivos que faltam).
2. Backend: escolher onde ele vai ficar ligado (Render/Railway grátis) — ou pedir à IA para transformar as rotas em funções do Netlify/Vercel, usando a tabela "O que falta no backend".
3. Banco: criar no Neon ou Supabase e colocar o endereço na variável de ambiente do servidor.
4. Variáveis: cadastrar 17 variável(is) no servidor (lista acima).
5. Testar a prévia; se der erro, 🤖 Mandar os erros para a IA.
6. App: 📲 Instalável (PWA), 📦 APK ou 🖥️ Desktop (.exe) pelo 🏗️ Preparar.

## 🌳 Árvore de arquivos
```
├─ 📁 .github/
│  └─ 📁 workflows/
│     ├─ apk-capacitor.yml
│     ├─ apk.yml
│     ├─ build-desktop.yml
│     └─ desktop-exe.yml
├─ 📁 electron/
│  ├─ main.cjs
│  └─ preload.cjs
├─ 📁 icons/
│  ├─ apple-touch-icon.png
│  ├─ icon-128.png
│  ├─ icon-144.png
│  ├─ icon-152.png
│  ├─ icon-16.png
│  ├─ icon-180.png
│  ├─ icon-192.png
│  ├─ icon-32.png
│  ├─ icon-384.png
│  ├─ icon-48.png
│  ├─ icon-512.png
│  ├─ icon-72.png
│  ├─ icon-96.png
│  ├─ icon.svg
│  ├─ maskable-192.png
│  ├─ maskable-512.png
│  └─ maskable.svg
├─ 📁 www/
│  ├─ 📁 .github/
│  │  └─ 📁 workflows/
│  │     ├─ apk-capacitor.yml
│  │     ├─ apk.yml
│  │     ├─ desktop-exe.yml
│  │     ├─ teste.yml
│  │     └─ windows.yml
│  ├─ 📁 dados/
│  │  └─ 📁 banco/
│  │     ├─ 📁 base/
│  │     │  ├─ 📁 1/
│  │     │  │  ├─ 112
│  │     │  │  ├─ 113
│  │     │  │  ├─ 1247
│  │     │  │  ├─ 1247_fsm
│  │     │  │  ├─ 1247_vm
│  │     │  │  ├─ 1249
│  │     │  │  ├─ 1249_fsm
│  │     │  │  ├─ 1249_vm
│  │     │  │  ├─ 1255
│  │     │  │  ├─ 1255_fsm
│  │     │  │  ├─ 1255_vm
│  │     │  │  ├─ 1259
│  │     │  │  ├─ 1259_fsm
│  │     │  │  ├─ 1259_vm
│  │     │  │  ├─ 12596
│  │     │  │  ├─ 12596_fsm
│  │     │  │  ├─ 12596_vm
│  │     │  │  ├─ 12599
│  │     │  │  ├─ 12600
│  │     │  │  ├─ 12601
│  │     │  │  ├─ 12601_fsm
│  │     │  │  ├─ 12601_vm
│  │     │  │  ├─ 12604
│  │     │  │  ├─ 12605
│  │     │  │  ├─ 12606
│  │     │  │  ├─ 12606_fsm
│  │     │  │  ├─ 12606_vm
│  │     │  │  ├─ 12609
│  │     │  │  ├─ 12610
│  │     │  │  ├─ 12611
│  │     │  │  ├─ 12611_fsm
│  │     │  │  ├─ 12611_vm
│  │     │  │  ├─ 12614
│  │     │  │  ├─ 12615
│  │     │  │  ├─ 1417
│  │     │  │  ├─ 1418
│  │     │  │  ├─ 16384
│  │     │  │  ├─ 16385
│  │     │  │  ├─ 16392
│  │     │  │  ├─ 16393
│  │     │  │  ├─ 16394
│  │     │  │  ├─ 16396
│  │     │  │  ├─ 16397
│  │     │  │  ├─ 16402
│  │     │  │  ├─ 16403
│  │     │  │  ├─ 16404
│  │     │  │  ├─ 16411
│  │     │  │  ├─ 16412
│  │     │  │  ├─ 16413
│  │     │  │  ├─ 16418
│  │     │  │  ├─ 16419
│  │     │  │  ├─ 16420
│  │     │  │  ├─ 16422
│  │     │  │  ├─ 16423
│  │     │  │  ├─ 16433
│  │     │  │  ├─ 16434
│  │     │  │  ├─ 16435
│  │     │  │  ├─ 174
│  │     │  │  ├─ 175
│  │     │  │  ├─ 2187
│  │     │  │  ├─ 2224
│  │     │  │  ├─ 2228
│  │     │  │  ├─ 2328
│  │     │  │  ├─ 2336
│  │     │  │  ├─ 2337
│  │     │  │  ├─ 2579
│  │     │  │  ├─ 2600
│  │     │  │  ├─ 2600_fsm
│  │     │  │  ├─ 2600_vm
│  │     │  │  ├─ 2601
│  │     │  │  ├─ 2601_fsm
│  │     │  │  ├─ 2601_vm
│  │     │  │  ├─ 2602
│  │     │  │  ├─ 2602_fsm
│  │     │  │  ├─ 2602_vm
│  │     │  │  ├─ 2603
│  │     │  │  ├─ 2603_fsm
│  │     │  │  ├─ 2603_vm
│  │     │  │  ├─ 2604
│  │     │  │  ├─ 2605
│  │     │  │  ├─ 2605_fsm
│  │     │  │  ├─ 2605_vm
│  │     │  │  ├─ 2606
│  │     │  │  ├─ 2606_fsm
│  │     │  │  ├─ 2606_vm
│  │     │  │  ├─ 2607
│  │     │  │  ├─ 2607_fsm
│  │     │  │  ├─ 2607_vm
│  │     │  │  ├─ 2608
│  │     │  │  ├─ 2608_fsm
│  │     │  │  ├─ 2608_vm
│  │     │  │  ├─ 2609
│  │     │  │  ├─ 2609_fsm
│  │     │  │  ├─ 2609_vm
│  │     │  │  ├─ 2610
│  │     │  │  ├─ 2610_fsm
│  │     │  │  ├─ 2610_vm
│  │     │  │  ├─ 2611
│  │     │  │  ├─ 2612
│  │     │  │  ├─ 2612_fsm
│  │     │  │  ├─ 2612_vm
│  │     │  │  ├─ 2613
│  │     │  │  ├─ 2615
│  │     │  │  ├─ 2615_fsm
│  │     │  │  ├─ 2615_vm
│  │     │  │  ├─ 2616
│  │     │  │  ├─ 2616_fsm
│  │     │  │  ├─ 2616_vm
│  │     │  │  ├─ 2617
│  │     │  │  ├─ 2617_fsm
│  │     │  │  ├─ 2617_vm
│  │     │  │  ├─ 2618
│  │     │  │  ├─ 2618_fsm
│  │     │  │  ├─ 2618_vm
│  │     │  │  ├─ 2619
│  │     │  │  ├─ 2619_fsm
│  │     │  │  ├─ 2619_vm
│  │     │  │  ├─ 2620
│  │     │  │  ├─ 2650
│  │     │  │  ├─ 2651
│  │     │  │  ├─ 2652
│  │     │  │  ├─ 2653
│  │     │  │  ├─ 2654
│  │     │  │  ├─ 2655
│  │     │  │  ├─ 2656
│  │     │  │  ├─ 2657
│  │     │  │  ├─ 2658
│  │     │  │  ├─ 2659
│  │     │  │  ├─ 2660
│  │     │  │  ├─ 2661
│  │     │  │  ├─ 2662
│  │     │  │  ├─ 2663
│  │     │  │  ├─ 2664
│  │     │  │  ├─ 2665
│  │     │  │  ├─ 2666
│  │     │  │  ├─ 2667
│  │     │  │  ├─ 2668
│  │     │  │  ├─ 2669
│  │     │  │  ├─ 2670
│  │     │  │  ├─ 2673
│  │     │  │  ├─ 2674
│  │     │  │  ├─ 2675
│  │     │  │  ├─ 2678
│  │     │  │  ├─ 2679
│  │     │  │  ├─ 2680
│  │     │  │  ├─ 2681
│  │     │  │  ├─ 2682
│  │     │  │  ├─ 2683
│  │     │  │  ├─ 2684
│  │     │  │  ├─ 2685
│  │     │  │  ├─ 2686
│  │     │  │  ├─ 2687
│  │     │  │  ├─ 2688
│  │     │  │  ├─ 2689
│  │     │  │  ├─ 2690
│  │     │  │  ├─ 2691
│  │     │  │  ├─ 2692
│  │     │  │  ├─ 2693
│  │     │  │  ├─ 2696
│  │     │  │  ├─ 2699
│  │     │  │  ├─ 2701
│  │     │  │  ├─ 2702
│  │     │  │  ├─ 2703
│  │     │  │  ├─ 2704
│  │     │  │  ├─ 2753
│  │     │  │  ├─ 2753_fsm
│  │     │  │  ├─ 2753_vm
│  │     │  │  ├─ 2754
│  │     │  │  ├─ 2755
│  │     │  │  ├─ 2756
│  │     │  │  ├─ 2757
│  │     │  │  ├─ 2830
│  │     │  │  ├─ 2831
│  │     │  │  ├─ 2832
│  │     │  │  ├─ 2833
│  │     │  │  ├─ 2834
│  │     │  │  ├─ 2835
│  │     │  │  ├─ 2836
│  │     │  │  ├─ 2836_fsm
│  │     │  │  ├─ 2836_vm
│  │     │  │  ├─ 2837
│  │     │  │  ├─ 2838
│  │     │  │  ├─ 2838_fsm
│  │     │  │  ├─ 2838_vm
│  │     │  │  ├─ 2839
│  │     │  │  ├─ 2840
│  │     │  │  ├─ 2840_fsm
│  │     │  │  ├─ 2840_vm
│  │     │  │  ├─ 2841
│  │     │  │  ├─ 2995
│  │     │  │  ├─ 2996
│  │     │  │  ├─ 3079
│  │     │  │  ├─ 3079_fsm
│  │     │  │  ├─ 3079_vm
│  │     │  │  ├─ 3080
│  │     │  │  ├─ 3081
│  │     │  │  ├─ 3085
│  │     │  │  ├─ 3118
│  │     │  │  ├─ 3119
│  │     │  │  ├─ 3164
│  │     │  │  ├─ 3256
│  │     │  │  ├─ 3257
│  │     │  │  ├─ 3258
│  │     │  │  ├─ 3350
│  │     │  │  ├─ 3351
│  │     │  │  ├─ 3379
│  │     │  │  ├─ 3380
│  │     │  │  ├─ 3381
│  │     │  │  ├─ 3394
│  │     │  │  ├─ 3394_fsm
│  │     │  │  ├─ 3394_vm
│  │     │  │  ├─ 3395
│  │     │  │  ├─ 3429
│  │     │  │  ├─ 3430
│  │     │  │  ├─ 3431
│  │     │  │  ├─ 3433
│  │     │  │  ├─ 3439
│  │     │  │  ├─ 3440
│  │     │  │  ├─ 3455
│  │     │  │  ├─ 3456
│  │     │  │  ├─ 3456_fsm
│  │     │  │  ├─ 3456_vm
│  │     │  │  ├─ 3466
│  │     │  │  ├─ 3467
│  │     │  │  ├─ 3468
│  │     │  │  ├─ 3501
│  │     │  │  ├─ 3502
│  │     │  │  ├─ 3503
│  │     │  │  ├─ 3534
│  │     │  │  ├─ 3541
│  │     │  │  ├─ 3541_fsm
│  │     │  │  ├─ 3541_vm
│  │     │  │  ├─ 3542
│  │     │  │  ├─ 3574
│  │     │  │  ├─ 3575
│  │     │  │  ├─ 3576
│  │     │  │  ├─ 3596
│  │     │  │  ├─ 3597
│  │     │  │  ├─ 3598
│  │     │  │  ├─ 3599
│  │     │  │  ├─ 3600
│  │     │  │  ├─ 3600_fsm
│  │     │  │  ├─ 3600_vm
│  │     │  │  ├─ 3601
│  │     │  │  ├─ 3601_fsm
│  │     │  │  ├─ 3601_vm
│  │     │  │  ├─ 3602
│  │     │  │  ├─ 3602_fsm
│  │     │  │  ├─ 3602_vm
│  │     │  │  ├─ 3603
│  │     │  │  ├─ 3603_fsm
│  │     │  │  ├─ 3603_vm
│  │     │  │  ├─ 3604
│  │     │  │  ├─ 3605
│  │     │  │  ├─ 3606
│  │     │  │  ├─ 3607
│  │     │  │  ├─ 3608
│  │     │  │  ├─ 3609
│  │     │  │  ├─ 3712
│  │     │  │  ├─ 3764
│  │     │  │  ├─ 3764_fsm
│  │     │  │  ├─ 3764_vm
│  │     │  │  ├─ 3766
│  │     │  │  ├─ 3767
│  │     │  │  ├─ 3997
│  │     │  │  ├─ 4143
│  │     │  │  ├─ 4144
│  │     │  │  ├─ 4145
│  │     │  │  ├─ 4146
│  │     │  │  ├─ 4147
│  │     │  │  ├─ 4148
│  │     │  │  ├─ 4149
│  │     │  │  ├─ 4150
│  │     │  │  ├─ 4151
│  │     │  │  ├─ 4152
│  │     │  │  ├─ 4153
│  │     │  │  ├─ 4154
│  │     │  │  ├─ 4155
│  │     │  │  ├─ 4156
│  │     │  │  ├─ 4157
│  │     │  │  ├─ 4158
│  │     │  │  ├─ 4159
│  │     │  │  ├─ 4160
│  │     │  │  ├─ 4163
│  │     │  │  ├─ 4164
│  │     │  │  ├─ 4165
│  │     │  │  ├─ 4166
│  │     │  │  ├─ 4167
│  │     │  │  ├─ 4168
│  │     │  │  ├─ 4169
│  │     │  │  ├─ 4170
│  │     │  │  ├─ 4171
│  │     │  │  ├─ 4172
│  │     │  │  ├─ 4173
│  │     │  │  ├─ 4174
│  │     │  │  ├─ 5002
│  │     │  │  ├─ 548
│  │     │  │  ├─ 549
│  │     │  │  ├─ 6102
│  │     │  │  ├─ 6104
│  │     │  │  ├─ 6106
│  │     │  │  ├─ 6110
│  │     │  │  ├─ 6111
│  │     │  │  ├─ 6112
│  │     │  │  ├─ 6113
│  │     │  │  ├─ 6116
│  │     │  │  ├─ 6117
│  │     │  │  ├─ 6175
│  │     │  │  ├─ 6176
│  │     │  │  ├─ 6228
│  │     │  │  ├─ 6229
│  │     │  │  ├─ 6237
│  │     │  │  ├─ 6238
│  │     │  │  ├─ 6239
│  │     │  │  ├─ 826
│  │     │  │  ├─ 827
│  │     │  │  ├─ 828
│  │     │  │  ├─ pg_filenode.map
│  │     │  │  ├─ pg_internal.init
│  │     │  │  └─ PG_VERSION
│  │     │  ├─ 📁 4/
│  │     │  │  ├─ 112
│  │     │  │  ├─ 113
│  │     │  │  ├─ 1247
│  │     │  │  ├─ 1247_fsm
│  │     │  │  ├─ 1247_vm
│  │     │  │  ├─ 1249
│  │     │  │  ├─ 1249_fsm
│  │     │  │  ├─ 1249_vm
│  │     │  │  ├─ 1255
│  │     │  │  ├─ 1255_fsm
│  │     │  │  ├─ 1255_vm
│  │     │  │  ├─ 1259
│  │     │  │  ├─ 1259_fsm
│  │     │  │  ├─ 1259_vm
│  │     │  │  ├─ 12596
│  │     │  │  ├─ 12596_fsm
│  │     │  │  ├─ 12596_vm
│  │     │  │  ├─ 12599
│  │     │  │  ├─ 12600
│  │     │  │  ├─ 12601
│  │     │  │  ├─ 12601_fsm
│  │     │  │  ├─ 12601_vm
│  │     │  │  ├─ 12604
│  │     │  │  ├─ 12605
│  │     │  │  ├─ 12606
│  │     │  │  ├─ 12606_fsm
│  │     │  │  ├─ 12606_vm
│  │     │  │  ├─ 12609
│  │     │  │  ├─ 12610
│  │     │  │  ├─ 12611
│  │     │  │  ├─ 12611_fsm
│  │     │  │  ├─ 12611_vm
│  │     │  │  ├─ 12614
│  │     │  │  ├─ 12615
│  │     │  │  ├─ 1417
│  │     │  │  ├─ 1418
│  │     │  │  ├─ 174
│  │     │  │  ├─ 175
│  │     │  │  ├─ 2187
│  │     │  │  ├─ 2224
… (833 linhas a mais)
```
