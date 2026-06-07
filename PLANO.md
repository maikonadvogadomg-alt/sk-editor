# PLANO DO PROJETO: assistente-juridico-v107 (3)

> Gerado automaticamente pelo SK Code Editor em 07/06/2026, 13:08:56
> **42 arquivo(s)** | **~10.287 linhas de codigo**

---

## RESUMO EXECUTIVO

- **Tipo de aplicacao:** Aplicacao Web Frontend (React)
- **Frontend / Stack principal:** React, TypeScript

**Para rodar o projeto:**
```bash
# Abra index.html no Preview (botao Play)
```

---

## ESTRUTURA DE ARQUIVOS

```
assistente-juridico-v107 (3)/
└── mobile/
    ├── .replit-artifact/
    │   └── artifact.toml
    ├── app/
    │   ├── (tabs)/
    │   │   ├── _layout.tsx
    │   │   ├── campo-livre.tsx
    │   │   ├── comunicacoes.tsx
    │   │   ├── config.tsx
    │   │   ├── index.tsx
    │   │   ├── pdpj.tsx
    │   │   ├── playground.tsx
    │   │   └── tramitacao.tsx
    │   ├── _layout.tsx
    │   ├── +not-found.tsx
    │   ├── config-inicial.tsx
    │   └── login.tsx
    ├── components/
    │   ├── CodeBlock.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── ErrorFallback.tsx
    │   ├── HtmlViewer.tsx
    │   ├── KeyboardAwareScrollViewCompat.tsx
    │   ├── ResultCard.tsx
    │   ├── SideMenu.tsx
    │   └── StatusModal.tsx
    ├── constants/
    │   ├── colors.ts
    │   └── prompts.ts
    ├── hooks/
    │   └── useColors.ts
    ├── scripts/
    │   └── build.js
    ├── server/
    │   ├── templates/
    │   │   └── landing-page.html
    │   └── serve.js
    ├── services/
    │   ├── ai.ts
    │   ├── fileImport.ts
    │   ├── neon.ts
    │   ├── storage.ts
    │   └── voice.ts
    ├── .gitignore
    ├── .npmrc
    ├── app.json
    ├── babel.config.js
    ├── eas.json
    ├── expo-env.d.ts
    ├── metro.config.js
    ├── package.json
    ├── SQL_SETUP.sql
    └── tsconfig.json
```

---

## STACK TECNOLOGICO DETECTADO

- **Frontend:** React, TypeScript

---

## VARIAVEIS DE AMBIENTE NECESSARIAS

Crie um arquivo `.env` na raiz com estas variaveis:

```env
BASE_PATH=seu_valor_aqui
REPLIT_INTERNAL_APP_DOMAIN=seu_valor_aqui
REPLIT_DEV_DOMAIN=seu_valor_aqui
EXPO_PUBLIC_DOMAIN=seu_valor_aqui
REPL_ID=seu_valor_aqui
EXPO_PUBLIC_REPL_ID=seu_valor_aqui
PORT=seu_valor_aqui
```

---

## ARQUIVOS PRINCIPAIS

- `mobile/app/(tabs)/index.tsx` — Arquivo principal

---

## GUIA COMPLETO — O QUE CADA PARTE DO PROJETO FAZ

> Esta secao explica, em linguagem simples, o que e para que serve cada pasta e cada arquivo.

### 📁 `mobile/`
> Pasta 'mobile' — agrupamento de arquivos relacionados.

**`.gitignore`** _(42 linhas)_
Lista de arquivos/pastas que o Git deve IGNORAR (nao versionar). Ex: node_modules, .env

**`.npmrc`** _(3 linhas)_
Arquivo NPMRC — parte do projeto.

**`SQL_SETUP.sql`** _(66 linhas)_
Script SQL — contem comandos para criar tabelas, inserir ou consultar dados no banco.

**`app.json`** _(64 linhas)_
Arquivo de dados ou configuracao no formato JSON (chave: valor).

**`babel.config.js`** _(7 linhas)_
Arquivo de CONSTANTES/CONFIGURACAO — valores fixos usados em varios lugares do projeto.

**`eas.json`** _(33 linhas)_
Arquivo de dados ou configuracao no formato JSON (chave: valor).

**`expo-env.d.ts`** _(3 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

**`metro.config.js`** _(4 linhas)_
Arquivo de CONSTANTES/CONFIGURACAO — valores fixos usados em varios lugares do projeto.

**`package.json`** _(59 linhas)_
Registro de dependencias e scripts do projeto. Aqui ficam os comandos (npm run dev, npm start) e os pacotes instalados.

**`tsconfig.json`** _(24 linhas)_
Configuracao do TypeScript. Diz para o computador como interpretar o codigo .ts e .tsx.

---

### 📁 `mobile/.replit-artifact/`
> Pasta '.replit-artifact' — agrupamento de arquivos relacionados.

**`artifact.toml`** _(28 linhas)_
Arquivo TOML — parte do projeto.

---

### 📁 `mobile/app/`
> Pasta 'app' — agrupamento de arquivos relacionados.

**`+not-found.tsx`** _(46 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`_layout.tsx`** _(18 linhas)_
Componente de LAYOUT — define a estrutura visual da pagina (cabecalho, sidebar, rodape). Envolve outros componentes.

**`config-inicial.tsx`** _(192 linhas)_
Componente de CONFIGURACOES — tela onde o usuario ajusta preferencias do app.

**`login.tsx`** _(149 linhas)_
Componente de LOGIN/AUTENTICACAO — tela de entrada com usuario e senha.

---

### 📁 `mobile/components/`
> Pecas visuais reutilizaveis da interface (botoes, cards, formularios...).

**`CodeBlock.tsx`** _(87 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`ErrorBoundary.tsx`** _(55 linhas)_
Componente de ERRO — exibido quando algo da errado, com mensagem explicativa.

**`ErrorFallback.tsx`** _(279 linhas)_
Componente de ERRO — exibido quando algo da errado, com mensagem explicativa.

**`HtmlViewer.tsx`** _(114 linhas)_
Componente de PAGINA/TELA — representa uma tela completa navegavel no app.

**`KeyboardAwareScrollViewCompat.tsx`** _(18 linhas)_
Componente de PAGINA/TELA — representa uma tela completa navegavel no app.

**`ResultCard.tsx`** _(612 linhas)_
Componente CARD (cartao) — exibe uma informacao em um bloco visual com borda e sombra. Muito usado para listas de items.

**`SideMenu.tsx`** _(303 linhas)_
Componente de MENU/DROPDOWN — lista de opcoes que aparece ao clicar em um botao.

**`StatusModal.tsx`** _(193 linhas)_
Componente MODAL — janela/popup que aparece sobre a tela pedindo uma acao ou mostrando uma informacao importante.

---

### 📁 `mobile/constants/`
> Pasta 'constants' — agrupamento de arquivos relacionados.

**`colors.ts`** _(30 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

**`prompts.ts`** _(101 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

---

### 📁 `mobile/hooks/`
> Hooks React customizados — logica reutilizavel de estado e efeitos.

**`useColors.ts`** _(6 linhas)_
HOOK React personalizado para gerenciar estado/comportamento de 'colors'.

---

### 📁 `mobile/scripts/`
> Pasta 'scripts' — agrupamento de arquivos relacionados.

**`build.js`** _(574 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

---

### 📁 `mobile/server/`
> Pasta 'server' — agrupamento de arquivos relacionados.

**`serve.js`** _(136 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

---

### 📁 `mobile/services/`
> Comunicacao com servidor, banco de dados ou APIs externas.

**`ai.ts`** _(248 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

**`fileImport.ts`** _(289 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

**`neon.ts`** _(139 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

**`storage.ts`** _(365 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

**`voice.ts`** _(42 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

---

### 📁 `mobile/app/(tabs)/`
> Pasta '(tabs)' — agrupamento de arquivos relacionados.

**`_layout.tsx`** _(52 linhas)_
Componente de LAYOUT — define a estrutura visual da pagina (cabecalho, sidebar, rodape). Envolve outros componentes.

**`campo-livre.tsx`** _(405 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`comunicacoes.tsx`** _(893 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`config.tsx`** _(1178 linhas)_
Componente de CONFIGURACOES — tela onde o usuario ajusta preferencias do app.

**`index.tsx`** _(1531 linhas)_
Ponto de entrada do React — monta o componente App na pagina HTML.

**`pdpj.tsx`** _(181 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`playground.tsx`** _(795 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`tramitacao.tsx`** _(462 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

---

### 📁 `mobile/server/templates/`
> Pasta 'templates' — agrupamento de arquivos relacionados.

**`landing-page.html`** _(461 linhas)_
Arquivo HTML — parte do projeto.

---

## CONTEXTO PARA IA (copie e cole para continuar o projeto)

> Use este bloco para explicar o projeto para qualquer IA ou desenvolvedor:

```
Projeto: assistente-juridico-v107 (3)
Tipo: Aplicacao Web Frontend (React)
Stack: React, TypeScript
Arquivos: 42 | Linhas: ~10.287
Variaveis de ambiente necessarias: BASE_PATH, REPLIT_INTERNAL_APP_DOMAIN, REPLIT_DEV_DOMAIN, EXPO_PUBLIC_DOMAIN, REPL_ID, EXPO_PUBLIC_REPL_ID, PORT

Estrutura principal:
  mobile/.gitignore
  mobile/.npmrc
  mobile/.replit-artifact/artifact.toml
  mobile/SQL_SETUP.sql
  mobile/app.json
  mobile/app/(tabs)/_layout.tsx
  mobile/app/(tabs)/campo-livre.tsx
  mobile/app/(tabs)/comunicacoes.tsx
  mobile/app/(tabs)/config.tsx
  mobile/app/(tabs)/index.tsx
  mobile/app/(tabs)/pdpj.tsx
  mobile/app/(tabs)/playground.tsx
  mobile/app/(tabs)/tramitacao.tsx
  mobile/app/+not-found.tsx
  mobile/app/_layout.tsx
  mobile/app/config-inicial.tsx
  mobile/app/login.tsx
  mobile/babel.config.js
  mobile/components/CodeBlock.tsx
  mobile/components/ErrorBoundary.tsx
  mobile/components/ErrorFallback.tsx
  mobile/components/HtmlViewer.tsx
  mobile/components/KeyboardAwareScrollViewCompat.tsx
  mobile/components/ResultCard.tsx
  mobile/components/SideMenu.tsx
  mobile/components/StatusModal.tsx
  mobile/constants/colors.ts
  mobile/constants/prompts.ts
  mobile/eas.json
  mobile/expo-env.d.ts
  mobile/hooks/useColors.ts
  mobile/metro.config.js
  mobile/package.json
  mobile/scripts/build.js
  mobile/server/serve.js
  mobile/server/templates/landing-page.html
  mobile/services/ai.ts
  mobile/services/fileImport.ts
  mobile/services/neon.ts
  mobile/services/storage.ts
  mobile/services/voice.ts
  mobile/tsconfig.json
```

---

*Plano gerado pelo SK Code Editor — 07/06/2026, 13:08:56*