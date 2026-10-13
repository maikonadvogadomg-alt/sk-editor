# Plano do projeto: CodeLens-local-09-10-c

_Gerado pelo Mini SK em 13/10/2026, 11:08:47_

## Resumo

- Arquivos: **132** (825.4 KB)
- Tipo: projeto Node com 1 package.json
- Arquivos por tipo: TSX 77, TypeScript 32, PNG 4, JSON 3, JavaScript 3, YAML 2, Batch 2, Shell 2, Git 1, NPMRC 1, HTML 1, Markdown 1, SVG 1, JPG 1, CSS 1
- Dependências diferentes: **95** (79 obrigatórias, 16 só para montar)
- Restos da Replit: **2 arquivo(s)**

## 📦 codelens-local — `package.json`


**Comandos (scripts):**

| Comando | O que faz | Executa |
|---|---|---|
| `iniciar` | — | `node scripts/iniciar.mjs` |
| `start` | Liga a versão final | `tsx server/index.ts` |
| `build` | Gera a versão final (pasta dist) | `vite build` |
| `dev` | Liga o app em modo de teste (atualiza sozinho) | `concurrently -k -n servidor,tela -c blue,magenta "npm:dev:servidor" "npm:dev:tela"` |
| `dev:servidor` | — | `tsx watch --clear-screen=false server/index.ts` |
| `dev:tela` | — | `vite` |
| `checar` | — | `tsc --noEmit -p tsconfig.json` |

**Dependências (o app precisa) — 79:**

| Pacote | Versão | Pra que serve | Tipo |
|---|---|---|---|
| `@codemirror/autocomplete` | ^6.18.0 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/commands` | ^6.7.0 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/lang-css` | ^6.3.0 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/lang-html` | ^6.4.9 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/lang-javascript` | ^6.2.2 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/lang-json` | ^6.0.1 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/lang-markdown` | ^6.3.0 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/lang-python` | ^6.1.6 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/lang-rust` | ^6.0.1 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/lang-sql` | ^6.8.0 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/language` | ^6.10.0 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/state` | ^6.4.1 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/theme-one-dark` | ^6.1.2 | Peça do editor de código CodeMirror | 🖥 Tela |
| `@codemirror/view` | ^6.34.0 | Editor de código | 🖥 Tela |
| `@electric-sql/pglite` | ^0.3.0 | (sem descrição — toque no nome para ver no npm) | ❔ |
| `@google/genai` | ^1.0.0 | IA Gemini | 🤖 IA |
| `@octokit/rest` | ^21.0.0 | (sem descrição — toque no nome para ver no npm) | ❔ |
| `@radix-ui/react-accordion` | ^1.2.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-alert-dialog` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-aspect-ratio` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-avatar` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-checkbox` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-collapsible` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-context-menu` | ^2.2.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-dialog` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-dropdown-menu` | ^2.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-hover-card` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-label` | ^2.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-menubar` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-navigation-menu` | ^1.2.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-popover` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-progress` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-radio-group` | ^1.2.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-scroll-area` | ^1.2.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-select` | ^2.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-separator` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-slider` | ^1.2.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-slot` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-switch` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-tabs` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-toast` | ^1.2.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-toggle` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-toggle-group` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@radix-ui/react-tooltip` | ^1.1.0 | Peça de interface pronta (botão, menu, janela) usada pelo shadcn/ui | 🖥 Tela |
| `@tanstack/react-query` | ^5.59.0 | Busca e guarda dados do servidor nas telas | 🖥 Tela |
| `adm-zip` | ^0.5.16 | (sem descrição — toque no nome para ver no npm) | ❔ |
| `class-variance-authority` | ^0.7.0 | Variações de botões/estilos (shadcn/ui) | 🎨 Estilo |
| `clsx` | ^2.1.1 | Monta listas de classes CSS | 🎨 Estilo |
| `cmdk` | ^1.0.0 | Caixa de comandos/busca rápida | 🖥 Tela |
| `cors` | ^2.8.5 | Deixa a tela falar com o servidor de outro endereço | 🗄 Servidor |
| `date-fns` | ^4.1.0 | Datas (formatar, somar dias, prazos) | 🧰 Utilidade |
| `drizzle-orm` | ^0.44.0 | Conversa com o banco de dados (Postgres) | 🛢 Banco |
| `embla-carousel-react` | ^8.3.0 | Carrossel de imagens/cartões | 🖥 Tela |
| `express` | ^5.1.0 | Servidor (recebe os pedidos das telas: salvar, IA, banco) | 🗄 Servidor |
| `highlight.js` | ^11.10.0 | Cores em código | 🖥 Tela |
| `input-otp` | ^1.2.4 | Campo de código (tipo SMS) | 🖥 Tela |
| `lucide-react` | ^0.460.0 | Ícones (desenhos dos botões) | 🖥 Tela |
| `mime-types` | ^2.1.35 | (sem descrição — toque no nome para ver no npm) | ❔ |
| `msedge-tts` | >=1.3.4 | (sem descrição — toque no nome para ver no npm) | ❔ |
| `multer` | ^2.0.0 | Recebe arquivos enviados (upload) | 🗄 Servidor |
| `next-themes` | ^0.4.3 | Tema claro/escuro | 🖥 Tela |
| `pino` | ^9.5.0 | Escreve o log do servidor | 🗄 Servidor |
| `pino-http` | ^10.3.0 | Log de cada pedido ao servidor | 🗄 Servidor |
| `pino-pretty` | ^13.0.0 | Deixa o log legível | 🗄 Servidor |
| `react` | ^19.0.0 | Biblioteca que monta as telas do app | 🖥 Tela |
| `react-day-picker` | ^9.4.0 | Calendário para escolher datas | 🖥 Tela |
| `react-dom` | ^19.0.0 | Coloca as telas do React no navegador | 🖥 Tela |
| `react-hook-form` | ^7.53.0 | Formulários (campos, validação) | 🖥 Tela |
| `react-markdown` | ^9.0.1 | Mostra texto Markdown formatado | 🖥 Tela |
| `react-resizable-panels` | ^2.1.7 | Painéis que mudam de tamanho | 🖥 Tela |
| `recharts` | ^2.13.0 | Gráficos | 🖥 Tela |
| `rehype-highlight` | ^7.0.1 | (sem descrição — toque no nome para ver no npm) | ❔ |
| `remark-gfm` | ^4.0.0 | Tabelas e listas no Markdown | 🖥 Tela |
| `sonner` | ^1.7.0 | Avisos que aparecem no canto da tela | 🖥 Tela |
| `tailwind-merge` | ^2.5.4 | Junta classes do Tailwind sem conflito | 🎨 Estilo |
| `tsx` | ^4.19.0 | Roda arquivos TypeScript direto (servidor em modo teste) | 🔧 Montagem |
| `vaul` | ^1.1.1 | Gaveta que sobe de baixo (celular) | 🖥 Tela |
| `wouter` | ^3.3.5 | Troca de páginas dentro do app (rotas) — leve | 🖥 Tela |
| `zod` | ^3.23.8 | Confere se os dados estão no formato certo | 🧰 Utilidade |

**Dependências de montagem (dev) — 16:**

| Pacote | Versão | Pra que serve | Tipo |
|---|---|---|---|
| `@tailwindcss/typography` | ^0.5.15 | Estilo bonito para textos longos | 🎨 Estilo |
| `@tailwindcss/vite` | ^4.0.0 | Liga o Tailwind no Vite | 🎨 Estilo |
| `@types/adm-zip` | ^0.5.5 | Tipos para o TypeScript — só para montar, pode ignorar | 📐 Tipos |
| `@types/cors` | ^2.8.17 | Tipos para o TypeScript — só para montar, pode ignorar | 📐 Tipos |
| `@types/express` | ^5.0.0 | Tipos do Express (só para montar) | 📐 Tipos |
| `@types/mime-types` | ^2.1.4 | Tipos para o TypeScript — só para montar, pode ignorar | 📐 Tipos |
| `@types/multer` | ^1.4.12 | Tipos para o TypeScript — só para montar, pode ignorar | 📐 Tipos |
| `@types/node` | ^22.9.0 | Tipos para o TypeScript — só para montar, pode ignorar | 📐 Tipos |
| `@types/react` | ^19.0.0 | Tipos para o TypeScript — só para montar, pode ignorar | 📐 Tipos |
| `@types/react-dom` | ^19.0.0 | Tipos para o TypeScript — só para montar, pode ignorar | 📐 Tipos |
| `@vitejs/plugin-react` | ^4.3.3 | Faz o Vite entender React | 🔧 Montagem |
| `concurrently` | ^9.1.0 | Liga servidor e tela ao mesmo tempo | 🔧 Montagem |
| `tailwindcss` | ^4.0.0 | Estilos prontos por classes (cores, espaços, tamanhos) | 🎨 Estilo |
| `tw-animate-css` | ^1.2.0 | Animações prontas para Tailwind | 🎨 Estilo |
| `typescript` | ^5.6.3 | JavaScript com tipos — só para montar, não vai pro app final | 🔧 Montagem |
| `vite` | ^6.0.0 | Monta (builda) o app e roda o modo de teste rápido | 🔧 Montagem |

## ⛔ Restos da Replit (tirar ou trocar)

- server/routes/ai.ts — 2 menção(ões)
- server/routes/code-assistant.ts — 2 menção(ões)

## Arquivos importantes (27) — mandar estes para a IA

- `.github/workflows/teste.yml`
- `.github/workflows/windows.yml`
- `lib/api-client-react/index.ts`
- `lib/api-zod/index.ts`
- `lib/db/index.ts`
- `package.json`
- `public/manifest.json`
- `server/index.ts`
- `server/routes/ai.ts`
- `server/routes/code-assistant.ts`
- `server/routes/code-run.ts`
- `server/routes/dev-server.ts`
- `server/routes/exec.ts`
- `server/routes/files.ts`
- `server/routes/git.ts`
- `server/routes/github.ts`
- `server/routes/health.ts`
- `server/routes/import-github.ts`
- `server/routes/index.ts`
- `server/routes/preview.ts`
- `server/routes/projects.ts`
- `server/routes/settings.ts`
- `server/routes/snippets.ts`
- `src/App.tsx`
- `src/main.tsx`
- `tsconfig.json`
- `vite.config.ts`

## Estrutura completa (132 arquivos)

```
├── .github/
│   └── workflows/
│       ├── teste.yml
│       └── windows.yml
├── lib/
│   ├── api-client-react/
│   │   └── index.ts
│   ├── api-zod/
│   │   └── index.ts
│   └── db/
│       └── index.ts
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   ├── icon.ico.png
│   │   └── icon.png
│   ├── favicon.svg
│   ├── manifest.json
│   ├── opengraph.jpg
│   └── sw.js
├── scripts/
│   ├── abrir-pronto.mjs
│   └── iniciar.mjs
├── server/
│   ├── lib/
│   │   ├── devServerRegistry.ts
│   │   ├── gemini-ponte.ts
│   │   ├── logger.ts
│   │   ├── persistFiles.ts
│   │   ├── shell.ts
│   │   ├── storage.ts
│   │   ├── tar.ts
│   │   └── tts.ts
│   ├── routes/
│   │   ├── ai.ts
│   │   ├── code-assistant.ts
│   │   ├── code-run.ts
│   │   ├── dev-server.ts
│   │   ├── exec.ts
│   │   ├── files.ts
│   │   ├── git.ts
│   │   ├── github.ts
│   │   ├── health.ts
│   │   ├── import-github.ts
│   │   ├── index.ts
│   │   ├── preview.ts
│   │   ├── projects.ts
│   │   ├── settings.ts
│   │   └── snippets.ts
│   ├── app.ts
│   └── index.ts
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button-group.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── empty.tsx
│   │   │   ├── field.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── input-group.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── input.tsx
│   │   │   ├── item.tsx
│   │   │   ├── kbd.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── resizable.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── spinner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── toggle.tsx
│   │   │   └── tooltip.tsx
│   │   ├── ai-panel.tsx
│   │   ├── code-editor.tsx
│   │   ├── code-viewer.tsx
│   │   ├── error-boundary.tsx
│   │   ├── file-tree.tsx
│   │   ├── git-history-modal.tsx
│   │   ├── github-conta.tsx
│   │   ├── github-deploy-modal.tsx
│   │   ├── layout.tsx
│   │   ├── packages-panel.tsx
│   │   ├── preview-panel.tsx
│   │   ├── terminal-panel.tsx
│   │   └── theme-provider.tsx
│   ├── hooks/
│   │   ├── use-file-ops.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── pages/
│   │   ├── assistant.tsx
│   │   ├── home.tsx
│   │   ├── not-found.tsx
│   │   ├── playground.tsx
│   │   ├── project-explorer.tsx
│   │   └── settings.tsx
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── windows/
│   └── Abrir-CodeLens.bat
├── .gitignore
├── .npmrc
├── index.html
├── iniciar.bat
├── iniciar.sh
├── LEIA-ME.md
├── package.json
├── termux-atalho.sh
├── tsconfig.json
└── vite.config.ts
```
