# 📋 Plano do projeto: sk-editor

_Gerado em 13/10/2026, 17:34:12 — sem IA, lendo os arquivos._

## 📊 Visão geral
| Item | Valor |
|---|---|
| Arquivos | 404 |
| Linhas | 33.803 |
| Telas/páginas | 17 |
| Rotas do backend | 1 |
| Chamadas do app | 16 |
| Tabelas do banco | 25 |
| Variáveis de ambiente | 12 |

**Linguagens:** Outros (200), TypeScript (React) (54), JSON (40), TypeScript (35), JavaScript (17), Markdown (17), YAML (16), Imagem (15), Imagem SVG (3), HTML (3), Ícone (1), SQL (1), CSS (1), Shell (1)

## 🧩 Apps dentro deste projeto
- .base-sample
- artifacts/api-server (@workspace/api-server)
- authenticationprovider-sample
- basic-multi-root-sample
- dist-electron/linux-unpacked/resources/lib/db (@workspace/db)
- dist-electron/win-unpacked/resources/lib/db (@workspace/db)
- mobile (@workspace/mobile)

## 💡 O que fazer (em ordem)
1. 🧹 Tirar a Replit de 3 arquivo(s) (🏗️ Preparar → Fazer tudo)
2. 🖥️ O projeto tem backend próprio: para funcionar fora da Replit ele precisa ficar ligado num servidor (Render, Railway, Vercel) ou virar funções
3. 🔐 Criar um .env.example com: BASE_PATH, DATABASE_URL, DATA_DIR, EXPO_PUBLIC_DOMAIN, EXPO_PUBLIC_REPL_ID, MONGODB_URI, NODE_ENV, PORT, REPLIT_DEV_DOMAIN, REPLIT_INTERNAL_APP_DOMAIN, REPL_ID, STORAGE_PATH (os valores você coloca no servidor, nunca no código)
4. 🗄️ Precisa de banco de dados (25 tabela(s)) — Neon ou Supabase servem, grátis

## 🚀 Por onde começa
- `artifacts/api-server/src/app.ts`
- `artifacts/api-server/src/index.ts`
- `index.html`
- `main.js`
- `mobile/app/(tabs)/index.tsx`
- `www/lib/db/index.ts`

## ⌨️ Comandos (package.json)
| Pasta | Comando | O que roda |
|---|---|---|
| artifacts/api-server | `npm run dev` | `export NODE_ENV=development && pnpm run build && pnpm run start` |
| artifacts/api-server | `npm run build` | `node ./build.mjs` |
| artifacts/api-server | `npm run start` | `node --enable-source-maps ./dist/index.mjs` |
| artifacts/api-server | `npm run typecheck` | `tsc -p tsconfig.json --noEmit` |
| dist-electron/linux-unpacked/resources/lib/db | `npm run push` | `drizzle-kit push --config ./drizzle.config.ts` |
| dist-electron/linux-unpacked/resources/lib/db | `npm run push-force` | `drizzle-kit push --force --config ./drizzle.config.ts` |
| dist-electron/win-unpacked/resources/lib/db | `npm run push` | `drizzle-kit push --config ./drizzle.config.ts` |
| dist-electron/win-unpacked/resources/lib/db | `npm run push-force` | `drizzle-kit push --force --config ./drizzle.config.ts` |
| mobile | `npm run dev` | `EXPO_PACKAGER_PROXY_URL=https://$REPLIT_EXPO_DEV_DOMAIN EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOM` |
| mobile | `npm run build` | `node scripts/build.js` |
| mobile | `npm run serve` | `node server/serve.js` |
| mobile | `npm run typecheck` | `tsc -p tsconfig.json --noEmit` |
| mobile | `npm run build:apk` | `eas build --platform android --profile preview --non-interactive` |
| mobile | `npm run build:apk:local` | `eas build --platform android --profile preview --local` |
| . | `npm run desktop` | `electron .` |
| . | `npm run exe` | `electron-builder --win portable --publish never` |
| . | `npm run start` | `electron .` |
| . | `npm run build` | `electron-builder --publish=never` |
| . | `npm run build:win` | `electron-builder --win --x64 --publish=never` |
| . | `npm run build:mac` | `electron-builder --mac --x64 --arm64 --publish=never` |
| . | `npm run build:linux` | `electron-builder --linux --x64 --publish=never` |

## 📱 Telas e páginas
| Endereço | Arquivo |
|---|---|
| `/ai` | app/(tabs)/ai.tsx |
| `/browser` | app/(tabs)/browser.tsx |
| `/editor` | app/(tabs)/editor.tsx |
| `/pwa` | app/(tabs)/pwa.tsx |
| `/tasks` | app/(tabs)/tasks.tsx |
| `/terminal` | app/(tabs)/terminal.tsx |
| `index.html` | index.html |
| `/campo-livre` | mobile/app/(tabs)/campo-livre.tsx |
| `/comunicacoes` | mobile/app/(tabs)/comunicacoes.tsx |
| `/config` | mobile/app/(tabs)/config.tsx |
| `/` | mobile/app/(tabs)/index.tsx |
| `/pdpj` | mobile/app/(tabs)/pdpj.tsx |
| `/playground` | mobile/app/(tabs)/playground.tsx |
| `/tramitacao` | mobile/app/(tabs)/tramitacao.tsx |
| `/config-inicial` | mobile/app/config-inicial.tsx |
| `/login` | mobile/app/login.tsx |
| `mobile/server/templates/landing-page.html` | mobile/server/templates/landing-page.html |

## 🖥️ Rotas do backend
| Método | Rota | Arquivo |
|---|---|---|
| USE | `/api` | artifacts/api-server/src/app.ts |

## 📡 O que o app pede ao servidor
| Método | Endereço | Onde |
|---|---|---|
| POST | `/db/test-connection` | app/(tabs)/editor.tsx |
| POST | `/db/execute` | app/(tabs)/editor.tsx |
| POST | `/api/db/execute` | components/DatabasePanel.tsx |
| POST | `/api/db/test-connection` | components/DatabasePanel.tsx |
| POST | `/v1/messages` | components/FloatingAI.tsx |
| POST | `/models/${model}:generateContent?key=${provider.apiKey}` | components/FloatingAI.tsx |
| POST | `/v1/chat/completions` | components/FloatingAI.tsx |
| GET | `/preview/check?port=${p}` | components/PreviewPanel.tsx |
| GET | `/api/terminal/stream?sessionId=X` | components/ProjectOverviewModal.tsx |
| POST | `/exec` | components/SystemStatus.tsx |
| GET | `/healthz` | components/SystemStatus.tsx |
| POST | `/ai/chat` | components/SystemStatus.tsx |
| POST | `/write` | components/Terminal.tsx |
| GET | `/read?sessionId=${encodeURIComponent(sessionId)}` | components/Terminal.tsx |
| POST | `/interrupt` | components/Terminal.tsx |
| POST | `/chat/completions` | mobile/services/ai.ts |

## 🔌 O que falta no backend
✅ Tudo que o app chama tem rota no projeto (ou o app não usa servidor).

## 🗄️ Banco de dados
- **User** — db.js
- **Post** — db.js
- **users** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **snippets** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **custom_actions** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **ementas** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **ai_history** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **prompt_templates** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **doc_templates** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **shared_pareceres** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **processos_monitorados** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **app_settings** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **tramitacao_publicacoes** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **escritorios** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **escritorio_users** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **prazos** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **fcm_tokens** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **docs_sincronizados** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **assinaturas_digitais** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **template_var_defs** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **conversations** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **messages** — dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
- **projects** — www/lib/db/index.ts
- **project_files** — www/lib/db/index.ts
- **settings** — www/lib/db/index.ts

## 🔐 Variáveis de ambiente (configurar no servidor)
- `BASE_PATH`
- `DATABASE_URL`
- `DATA_DIR`
- `EXPO_PUBLIC_DOMAIN`
- `EXPO_PUBLIC_REPL_ID`
- `MONGODB_URI`
- `NODE_ENV`
- `PORT`
- `REPLIT_DEV_DOMAIN`
- `REPLIT_INTERNAL_APP_DOMAIN`
- `REPL_ID`
- `STORAGE_PATH`

_Só os nomes. Os valores (chaves, senhas) nunca vão no código nem no GitHub._

## 🤖 IA usada
- Google Gemini
- chat.openai.com
- api.anthropic.com
- generativelanguage.googleapis.com
- api.openai.com
- console.groq.com
- openrouter.ai
- platform.openai.com
- console.anthropic.com
- api.groq.com

## 🌐 Serviços de fora que ele acessa
- aistudio.google.com
- api.anthropic.com
- api.groq.com
- api.openai.com
- api.perplexity.ai
- api.telegram.org
- api.x.ai
- cdn.jsdelivr.net
- chat.openai.com
- codespaces.new
- comunicaapi.pje.jus.br
- console.anthropic.com
- console.groq.com
- consulta.trt3.jus.br
- consultaprocessual.tst.jus.br
- deb.nodesource.com
- dev.to
- developers.google.com
- expo.dev
- generativelanguage.googleapis.com
- github.com
- github.dev
- gitpod.io
- gonative.io
- httpbin.org
- m.reddit.com
- m.youtube.com
- meusite.com
- minha-api.com
- neon.tech
- openrouter.ai
- painel.cnj.jus.br
- pdpj.jus.br
- pje.cloud.cnj.jus.br
- platform.openai.com
- portal.stf.jus.br
- processo.stj.jus.br
- processual.trf1.jus.br
- projudi.tjmg.jus.br
- pwa2apk.com
- pypi.org
- raw.githubusercontent.com
- react.dev
- registry.npmjs.org
- seu-servidor.com
- snack.expo.dev
- stackblitz.com
- support.google.com
- t.me
- unpkg.com
- vscode.dev
- www.apkmirror.com
- www.google.com
- www.pwabuilder.com
- www.tjmg.jus.br
- www4.tjmg.jus.br

## 📦 Peças principais (dependências)
`@capacitor/android` · `@capacitor/core` · `@google/genai` · `@octokit/rest` · `@types/adm-zip` · `@types/mime-types` · `@types/multer` · `@workspace/api-zod` · `@workspace/db` · `adm-zip` · `cookie-parser` · `cors` · `drizzle-orm` · `drizzle-zod` · `expo-av` · `expo-clipboard` · `expo-document-picker` · `expo-file-system` · `expo-mail-composer` · `expo-print` · `expo-sharing` · `expo-speech` · `express` · `jszip` · `mime-types` · `multer` · `pako` · `papaparse` · `pg` · `pino` · `pino-http` · `xlsx` · `zod`

## 🧹 Arquivos com coisa da Replit
- mobile/scripts/build.js
- service-worker.js
- www/lib/db/index.ts

## 🔁 Roteiro para recriar fora da Replit
1. Importar o projeto no Mini SK e tocar em 🏗️ Preparar → ✅ Fazer tudo (tira a Replit, cria os arquivos que faltam).
2. Backend: escolher onde ele vai ficar ligado (Render/Railway grátis) — ou pedir à IA para transformar as rotas em funções do Netlify/Vercel, usando a tabela "O que falta no backend".
3. Banco: criar no Neon ou Supabase e colocar o endereço na variável de ambiente do servidor.
4. Variáveis: cadastrar 12 variável(is) no servidor (lista acima).
5. Testar a prévia; se der erro, 🤖 Mandar os erros para a IA.
6. App: 📲 Instalável (PWA), 📦 APK ou 🖥️ Desktop (.exe) pelo 🏗️ Preparar.

## 🌳 Árvore de arquivos
```
├─ 📁 .agents/
│  └─ agent_assets_metadata.toml
├─ 📁 .base-sample/
│  ├─ 📁 .vscode/
│  │  ├─ extensions.json
│  │  ├─ launch.json
│  │  ├─ settings.json
│  │  └─ tasks.json
│  ├─ 📁 src/
│  │  └─ extension.ts
│  ├─ .gitignore
│  ├─ .vscodeignore
│  ├─ eslint.config.mjs
│  ├─ package.json
│  ├─ README.md
│  └─ tsconfig.json
├─ 📁 .github/
│  ├─ 📁 ISSUE_TEMPLATE/
│  │  ├─ config.yml
│  │  └─ report-issue.yml
│  ├─ 📁 workflows/
│  │  ├─ apk-capacitor.yml
│  │  ├─ apk.yml
│  │  ├─ build-desktop.yml
│  │  ├─ ci.yml
│  │  ├─ deploy.yml
│  │  ├─ desktop-exe.yml
│  │  └─ triage.yml
│  ├─ CONTRIBUTING.md
│  └─ SAMPLE_GUIDELINE.md
├─ 📁 .scripts/
│  ├─ copy-into.ts
│  ├─ format.ts
│  ├─ run-command.ts
│  ├─ run-script.ts
│  ├─ samples.ts
│  ├─ tsconfig.json
│  ├─ update-dependency.ts
│  ├─ update-lsif.ts
│  ├─ update-readme.ts
│  └─ validate.ts
├─ 📁 .vscode/
│  └─ settings.json
├─ 📁 app/
│  ├─ 📁 (tabs)/
│  │  ├─ _layout.tsx
│  │  ├─ ai.tsx
│  │  ├─ browser.tsx
│  │  ├─ editor.tsx
│  │  ├─ pwa.tsx
│  │  ├─ tasks.tsx
│  │  └─ terminal.tsx
│  ├─ _layout.tsx
│  └─ +not-found.tsx
├─ 📁 artifacts/
│  └─ 📁 api-server/
│     ├─ 📁 .replit-artifact/
│     │  └─ artifact.toml
│     ├─ 📁 src/
│     │  ├─ 📁 lib/
│     │  │  └─ devServerRegistry.ts
│     │  ├─ app.ts
│     │  └─ index.ts
│     ├─ build.mjs
│     └─ package.json
├─ 📁 authenticationprovider-sample/
│  ├─ 📁 .vscode/
│  │  ├─ extensions.json
│  │  ├─ launch.json
│  │  ├─ settings.json
│  │  └─ tasks.json
│  ├─ 📁 src/
│  │  ├─ authProvider.ts
│  │  └─ extension.ts
│  ├─ .vscodeignore
│  ├─ CHANGELOG.md
│  ├─ eslint.config.mjs
│  ├─ package.json
│  ├─ README.md
│  └─ tsconfig.json
├─ 📁 basic-multi-root-sample/
│  ├─ 📁 .vscode/
│  │  ├─ extensions.json
│  │  ├─ launch.json
│  │  ├─ settings.json
│  │  └─ tasks.json
│  ├─ 📁 src/
│  │  └─ extension.ts
│  ├─ .gitignore
│  ├─ eslint.config.mjs
│  ├─ package.json
│  ├─ README.md
│  └─ tsconfig.json
├─ 📁 call-hierarchy-sample/
│  ├─ 📁 .vscode/
│  │  ├─ extensions.json
│  │  ├─ launch.json
│  │  ├─ settings.json
│  │  └─ tasks.json
│  ├─ 📁 src/
│  │  ├─ extension.ts
│  │  ├─ FoodPyramidHierarchyProvider.ts
│  │  └─ model.ts
│  ├─ .gitignore
│  └─ .vscodeignore
├─ 📁 components/
│  ├─ AIMemoryModal.tsx
│  ├─ APKBuilderModal.tsx
│  ├─ CheckpointsModal.tsx
│  ├─ CodeEditor.tsx
│  ├─ CombinarAppsModal.tsx
│  ├─ DatabasePanel.tsx
│  ├─ ErrorBoundary.tsx
│  ├─ ErrorFallback.tsx
│  ├─ FileSidebar.tsx
│  ├─ FloatingAI.tsx
│  ├─ GitHubModal.tsx
│  ├─ HtmlPlayground.tsx
│  ├─ KeyboardAwareScrollViewCompat.tsx
│  ├─ LibrarySearch.tsx
│  ├─ ManualModal.tsx
│  ├─ MessageRenderer.tsx
│  ├─ MonacoEditor.tsx
│  ├─ PreviewPanel.tsx
│  ├─ ProjectOverviewModal.tsx
│  ├─ ProjectPlanModal.tsx
│  ├─ SystemStatus.tsx
│  ├─ Terminal.tsx
│  ├─ VSCodeView.tsx
│  ├─ VSCodeWebModal.tsx
│  └─ XTermWebView.tsx
├─ 📁 dist-electron/
│  ├─ 📁 linux-unpacked/
│  │  ├─ 📁 resources/
│  │  │  └─ 📁 lib/
│  │  │     └─ 📁 db/
│  │  │        ├─ 📁 src/
│  │  │        │  ├─ 📁 schema/ …
│  │  │        │  └─ index.ts
│  │  │        └─ package.json
│  │  ├─ LICENSE.electron.txt
│  │  └─ vk_swiftshader_icd.json
│  ├─ 📁 win-unpacked/
│  │  ├─ 📁 resources/
│  │  │  └─ 📁 lib/
│  │  │     └─ 📁 db/
│  │  │        ├─ 📁 src/
│  │  │        │  ├─ 📁 schema/ …
│  │  │        │  └─ index.ts
│  │  │        └─ package.json
│  │  ├─ LICENSE.electron.txt
│  │  └─ vk_swiftshader_icd.json
│  ├─ builder-debug.yml
│  └─ builder-effective-config.yaml
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
├─ 📁 lsp-log-streaming-sample/
│  └─ 📁 client/
│     └─ 📁 testFixture/
│        └─ completion.txt
├─ 📁 lsp-sample/
│  └─ 📁 client/
│     └─ 📁 testFixture/
│        └─ completion.txt
├─ 📁 mobile/
│  ├─ 📁 .replit-artifact/
│  │  └─ artifact.toml
│  ├─ 📁 app/
│  │  ├─ 📁 (tabs)/
│  │  │  ├─ _layout.tsx
│  │  │  ├─ campo-livre.tsx
│  │  │  ├─ comunicacoes.tsx
│  │  │  ├─ config.tsx
│  │  │  ├─ index.tsx
│  │  │  ├─ pdpj.tsx
│  │  │  ├─ playground.tsx
│  │  │  └─ tramitacao.tsx
│  │  ├─ _layout.tsx
│  │  ├─ +not-found.tsx
│  │  ├─ config-inicial.tsx
│  │  └─ login.tsx
│  ├─ 📁 components/
│  │  ├─ CodeBlock.tsx
│  │  ├─ ErrorBoundary.tsx
│  │  ├─ ErrorFallback.tsx
│  │  ├─ HtmlViewer.tsx
│  │  ├─ KeyboardAwareScrollViewCompat.tsx
│  │  ├─ ResultCard.tsx
│  │  ├─ SideMenu.tsx
│  │  └─ StatusModal.tsx
│  ├─ 📁 constants/
│  │  ├─ colors.ts
│  │  └─ prompts.ts
│  ├─ 📁 hooks/
│  │  └─ useColors.ts
│  ├─ 📁 scripts/
│  │  └─ build.js
│  ├─ 📁 server/
│  │  ├─ 📁 templates/
│  │  │  └─ landing-page.html
│  │  └─ serve.js
│  ├─ 📁 services/
│  │  ├─ ai.ts
│  │  ├─ fileImport.ts
│  │  ├─ neon.ts
│  │  ├─ storage.ts
│  │  └─ voice.ts
│  ├─ .gitignore
│  ├─ .npmrc
│  ├─ app.json
│  ├─ babel.config.js
│  ├─ eas.json
│  ├─ expo-env.d.ts
│  ├─ metro.config.js
│  ├─ package.json
│  ├─ SQL_SETUP.sql
│  └─ tsconfig.json
├─ 📁 notebook-renderer-react-sample/
│  └─ 📁 src/
│     └─ 📁 client/
│        └─ style.css
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
│  │     │  │  ├─ 12599
│  │     │  │  ├─ 12604
│  │     │  │  ├─ 12609
│  │     │  │  ├─ 12614
│  │     │  │  ├─ 1417
│  │     │  │  ├─ 1418
│  │     │  │  ├─ 16385
│  │     │  │  ├─ 16392
│  │     │  │  ├─ 16397
│  │     │  │  ├─ 16402
│  │     │  │  ├─ 16413
│  │     │  │  ├─ 16418
│  │     │  │  ├─ 16423
│  │     │  │  ├─ 16433
│  │     │  │  ├─ 2328
│  │     │  │  ├─ 2336
│  │     │  │  ├─ 2611
│  │     │  │  ├─ 2613
│  │     │  │  ├─ 2830
│  │     │  │  ├─ 2832
│  │     │  │  ├─ 2834
│  │     │  │  ├─ 2995
│  │     │  │  ├─ 3118
│  │     │  │  ├─ 3256
│  │     │  │  ├─ 3350
│  │     │  │  ├─ 3381
│  │     │  │  ├─ 3429
│  │     │  │  ├─ 3430
│  │     │  │  ├─ 3439
│  │     │  │  ├─ 3466
│  │     │  │  ├─ 3501
│  │     │  │  ├─ 3576
│  │     │  │  ├─ 3596
│  │     │  │  ├─ 3598
│  │     │  │  ├─ 4143
│  │     │  │  ├─ 4145
│  │     │  │  ├─ 4147
│  │     │  │  ├─ 4149
│  │     │  │  ├─ 4151
│  │     │  │  ├─ 4153
│  │     │  │  ├─ 4155
│  │     │  │  ├─ 4157
│  │     │  │  ├─ 4159
│  │     │  │  ├─ 4163
│  │     │  │  ├─ 4165
│  │     │  │  ├─ 4167
│  │     │  │  ├─ 4169
│  │     │  │  ├─ 4171
│  │     │  │  ├─ 4173
│  │     │  │  ├─ 6102
│  │     │  │  ├─ 6104
│  │     │  │  ├─ 6106
│  │     │  │  ├─ 6175
│  │     │  │  ├─ 6228
│  │     │  │  ├─ 6237
│  │     │  │  └─ 826
│  │     │  ├─ 📁 4/
│  │     │  │  ├─ 12599
│  │     │  │  ├─ 12604
│  │     │  │  ├─ 12609
│  │     │  │  ├─ 12614
│  │     │  │  ├─ 1417
│  │     │  │  ├─ 1418
│  │     │  │  ├─ 2224
│  │     │  │  ├─ 2328
│  │     │  │  ├─ 2336
│  │     │  │  ├─ 2604
│  │     │  │  ├─ 2611
│  │     │  │  ├─ 2613
│  │     │  │  ├─ 2620
│  │     │  │  ├─ 2830
│  │     │  │  ├─ 2832
│  │     │  │  ├─ 2834
│  │     │  │  ├─ 2995
│  │     │  │  ├─ 3118
│  │     │  │  ├─ 3256
│  │     │  │  ├─ 3350
│  │     │  │  ├─ 3381
│  │     │  │  ├─ 3429
│  │     │  │  ├─ 3430
│  │     │  │  ├─ 3439
│  │     │  │  ├─ 3466
│  │     │  │  ├─ 3501
│  │     │  │  ├─ 3576
│  │     │  │  ├─ 3596
│  │     │  │  ├─ 3598
│  │     │  │  ├─ 4143
│  │     │  │  ├─ 4145
│  │     │  │  ├─ 4147
│  │     │  │  ├─ 4149
│  │     │  │  ├─ 4151
│  │     │  │  ├─ 4153
│  │     │  │  ├─ 4155
│  │     │  │  ├─ 4157
│  │     │  │  ├─ 4159
│  │     │  │  ├─ 4163
│  │     │  │  ├─ 4165
│  │     │  │  ├─ 4167
│  │     │  │  ├─ 4169
│  │     │  │  ├─ 4171
│  │     │  │  ├─ 4173
│  │     │  │  ├─ 6102
│  │     │  │  ├─ 6104
│  │     │  │  ├─ 6106
│  │     │  │  ├─ 6175
│  │     │  │  ├─ 6228
│  │     │  │  ├─ 6237
│  │     │  │  └─ 826
│  │     │  └─ 📁 5/
│  │     │     ├─ 12599
│  │     │     ├─ 12604
│  │     │     ├─ 12609
│  │     │     ├─ 12614
│  │     │     ├─ 1417
│  │     │     ├─ 1418
│  │     │     ├─ 2224
│  │     │     ├─ 2328
│  │     │     ├─ 2336
│  │     │     ├─ 2604
│  │     │     ├─ 2611
│  │     │     ├─ 2613
│  │     │     ├─ 2620
│  │     │     ├─ 2830
│  │     │     ├─ 2832
│  │     │     ├─ 2834
│  │     │     ├─ 2995
│  │     │     ├─ 3118
│  │     │     ├─ 3256
│  │     │     ├─ 3350
│  │     │     ├─ 3381
│  │     │     ├─ 3429
│  │     │     ├─ 3430
│  │     │     ├─ 3439
│  │     │     ├─ 3466
│  │     │     ├─ 3501
│  │     │     ├─ 3576
│  │     │     ├─ 3596
│  │     │     ├─ 3598
│  │     │     ├─ 4143
│  │     │     ├─ 4145
│  │     │     ├─ 4147
│  │     │     ├─ 4149
│  │     │     ├─ 4151
│  │     │     ├─ 4153
│  │     │     ├─ 4155
│  │     │     ├─ 4157
│  │     │     ├─ 4159
│  │     │     ├─ 4163
… (77 linhas a mais)
```
