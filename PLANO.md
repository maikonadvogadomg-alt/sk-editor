# PLANO DO PROJETO: HTML/CSS/JS

> Gerado automaticamente pelo SK Code Editor em 08/06/2026, 22:30:09
> **22 arquivo(s)** | **~1.740 linhas de codigo**

---

## RESUMO EXECUTIVO

- **Tipo de aplicacao:** Projeto de Codigo
- **Frontend / Stack principal:** TypeScript
- **Versao:** 1.5.0
- **Descricao:** SK Jurídico IA — Executável Desktop (Windows/macOS/Linux)

**Para rodar o projeto:**
```bash
npm install && npm run dev
```

---

## ESTRUTURA DE ARQUIVOS

```
HTML/CSS/JS/
├── dist-electron/
│   ├── linux-unpacked/
│   │   ├── resources/
│   │   │   └── lib/
│   │   │       └── db/
│   │   │           ├── src/
│   │   │           │   ├── schema/
│   │   │           │   │   └── index.ts
│   │   │           │   └── index.ts
│   │   │           └── package.json
│   │   ├── LICENSE.electron.txt
│   │   └── vk_swiftshader_icd.json
│   ├── win-unpacked/
│   │   ├── resources/
│   │   │   └── lib/
│   │   │       └── db/
│   │   │           ├── src/
│   │   │           │   ├── schema/
│   │   │           │   │   └── index.ts
│   │   │           │   └── index.ts
│   │   │           └── package.json
│   │   ├── LICENSE.electron.txt
│   │   └── vk_swiftshader_icd.json
│   ├── builder-debug.yml
│   └── builder-effective-config.yaml
├── .env
├── .env.example
├── .gitignore
├── db.js
├── main.js
├── package.json
├── PLANO.md
├── preload.js
├── SISTEMA.md
└── terminal.md
```

---

## STACK TECNOLOGICO DETECTADO

- **Frontend:** TypeScript
- **Todos os pacotes (4):** electron-updater, concurrently, electron, electron-builder

---

## SCRIPTS DISPONIVEIS (package.json)

```bash
npm run start         # electron .
npm run dev           # concurrently "node server.js" "electron . --dev"
npm run build:win     # electron-builder --win --x64
npm run build:mac     # electron-builder --mac
npm run build:linux   # electron-builder --linux AppImage deb
npm run build:all     # electron-builder --win --mac --linux
```

---

## VARIAVEIS DE AMBIENTE NECESSARIAS

Crie um arquivo `.env` na raiz com estas variaveis:

```env
MONGODB_URI=seu_valor_aqui
DATABASE_URL=seu_valor_aqui
NODE_ENV=seu_valor_aqui
PORT=seu_valor_aqui
```

---

## ARQUIVOS PRINCIPAIS

- `dist-electron/linux-unpacked/resources/lib/db/src/index.ts` — Arquivo principal
- `dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts` — Arquivo principal
- `dist-electron/win-unpacked/resources/lib/db/src/index.ts` — Arquivo principal
- `dist-electron/win-unpacked/resources/lib/db/src/schema/index.ts` — Arquivo principal

---

## GUIA COMPLETO — O QUE CADA PARTE DO PROJETO FAZ

> Esta secao explica, em linguagem simples, o que e para que serve cada pasta e cada arquivo.

### 📁 Raiz do Projeto (pasta principal)
> Arquivos de configuracao e pontos de entrada ficam aqui.

**`.env`** _(2 linhas)_
Arquivo de variaveis secretas (senhas, chaves de API). NUNCA suba este arquivo para o GitHub.

**`.env.example`** _(4 linhas)_
Arquivo de variaveis secretas (senhas, chaves de API). NUNCA suba este arquivo para o GitHub.

**`.gitignore`** _(5 linhas)_
Lista de arquivos/pastas que o Git deve IGNORAR (nao versionar). Ex: node_modules, .env

**`PLANO.md`** _(232 linhas)_
Este documento! Gerado automaticamente pelo SK Code Editor com toda a estrutura do projeto.

**`SISTEMA.md`** _(98 linhas)_
Arquivo de documentacao em Markdown (texto formatado com #titulos, **negrito**, listas).

**`db.js`** _(29 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

**`main.js`** _(335 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

**`package.json`** _(85 linhas)_
Registro de dependencias e scripts do projeto. Aqui ficam os comandos (npm run dev, npm start) e os pacotes instalados.

**`preload.js`** _(61 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

**`terminal.md`** _(173 linhas)_
Arquivo de documentacao em Markdown (texto formatado com #titulos, **negrito**, listas).

---

### 📁 `dist-electron/`
> Pasta 'dist-electron' — agrupamento de arquivos relacionados.

**`builder-debug.yml`** _(15 linhas)_
Arquivo YML — parte do projeto.

**`builder-effective-config.yaml`** _(61 linhas)_
Arquivo YAML — parte do projeto.

---

### 📁 `dist-electron/linux-unpacked/`
> Pasta 'linux-unpacked' — agrupamento de arquivos relacionados.

**`LICENSE.electron.txt`** _(22 linhas)_
Arquivo TXT — parte do projeto.

**`vk_swiftshader_icd.json`** _(1 linha)_
Arquivo de dados ou configuracao no formato JSON (chave: valor).

---

### 📁 `dist-electron/win-unpacked/`
> Pasta 'win-unpacked' — agrupamento de arquivos relacionados.

**`LICENSE.electron.txt`** _(22 linhas)_
Arquivo TXT — parte do projeto.

**`vk_swiftshader_icd.json`** _(1 linha)_
Arquivo de dados ou configuracao no formato JSON (chave: valor).

---

### 📁 `dist-electron/linux-unpacked/resources/lib/db/`
> Pasta 'db' — agrupamento de arquivos relacionados.

**`package.json`** _(26 linhas)_
Registro de dependencias e scripts do projeto. Aqui ficam os comandos (npm run dev, npm start) e os pacotes instalados.

---

### 📁 `dist-electron/win-unpacked/resources/lib/db/`
> Pasta 'db' — agrupamento de arquivos relacionados.

**`package.json`** _(26 linhas)_
Registro de dependencias e scripts do projeto. Aqui ficam os comandos (npm run dev, npm start) e os pacotes instalados.

---

### 📁 `dist-electron/linux-unpacked/resources/lib/db/src/`
> Codigo-fonte principal do projeto. Nao apague esta pasta.

**`index.ts`** _(17 linhas)_
Arquivo INDEX — ponto de entrada da pasta, exporta tudo que esta dentro.

---

### 📁 `dist-electron/win-unpacked/resources/lib/db/src/`
> Codigo-fonte principal do projeto. Nao apague esta pasta.

**`index.ts`** _(17 linhas)_
Arquivo INDEX — ponto de entrada da pasta, exporta tudo que esta dentro.

---

### 📁 `dist-electron/linux-unpacked/resources/lib/db/src/schema/`
> Pasta 'schema' — agrupamento de arquivos relacionados.

**`index.ts`** _(254 linhas)_
Arquivo INDEX — ponto de entrada da pasta, exporta tudo que esta dentro.

---

### 📁 `dist-electron/win-unpacked/resources/lib/db/src/schema/`
> Pasta 'schema' — agrupamento de arquivos relacionados.

**`index.ts`** _(254 linhas)_
Arquivo INDEX — ponto de entrada da pasta, exporta tudo que esta dentro.

---

## CONTEXTO PARA IA (copie e cole para continuar o projeto)

> Use este bloco para explicar o projeto para qualquer IA ou desenvolvedor:

```
Projeto: HTML/CSS/JS
Tipo: Projeto de Codigo
Stack: TypeScript
Arquivos: 22 | Linhas: ~1.740
Variaveis de ambiente necessarias: MONGODB_URI, DATABASE_URL, NODE_ENV, PORT

Estrutura principal:
  .env
  .env.example
  .gitignore
  PLANO.md
  SISTEMA.md
  db.js
  dist-electron/builder-debug.yml
  dist-electron/builder-effective-config.yaml
  dist-electron/linux-unpacked/LICENSE.electron.txt
  dist-electron/linux-unpacked/resources/lib/db/package.json
  dist-electron/linux-unpacked/resources/lib/db/src/index.ts
  dist-electron/linux-unpacked/resources/lib/db/src/schema/index.ts
  dist-electron/linux-unpacked/vk_swiftshader_icd.json
  dist-electron/win-unpacked/LICENSE.electron.txt
  dist-electron/win-unpacked/resources/lib/db/package.json
  dist-electron/win-unpacked/resources/lib/db/src/index.ts
  dist-electron/win-unpacked/resources/lib/db/src/schema/index.ts
  dist-electron/win-unpacked/vk_swiftshader_icd.json
  main.js
  package.json
  preload.js
  terminal.md
```

---

*Plano gerado pelo SK Code Editor — 08/06/2026, 22:30:09*