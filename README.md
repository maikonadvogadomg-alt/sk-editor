# codelens-local — App Desktop

Aplicativo gerado pelo **APK Builder** usando Electron.
Funciona em **Windows**, **Mac** e **Linux** sem precisar de browser.

## Estrutura do projeto

```
├── main.js          ← Processo principal do Electron
├── preload.js       ← Bridge segura entre Electron e web
├── package.json     ← Dependências e config do electron-builder
├── www/             ← Seus arquivos web (HTML/CSS/JS)
│   └── index.html
└── .github/
    └── workflows/
        └── build-desktop.yml  ← CI automático
```

## Opções para compilar

### ✅ Opção 1 — GitHub Actions (Gratuito, Automático)

```bash
git init
git add .
git commit -m "init: desktop app"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

Aguarde ~15 min → **Repositório → Releases** → baixe:
- `codelens-local-Setup-1.0.4.exe` → Windows
- `codelens-local-1.0.4.AppImage` → Linux
- `codelens-local-1.0.4.dmg` → Mac

### 💻 Opção 2 — Compilar localmente

**Pré-requisitos:** Node.js 20+

```bash
npm install
npm run build:win    # Gera .exe para Windows
npm run build:linux  # Gera .AppImage para Linux
npm run build:mac    # Gera .dmg para Mac (precisa de Mac)
```

### 🖥️ Opção 3 — Testar sem compilar

```bash
npm install
npm start            # Abre o app em modo desenvolvimento
```

## Por que o build falha?

- **Code signing**: O `.exe` não está assinado digitalmente — normal para distribuição privada.
  No Windows pode aparecer aviso do SmartScreen → clique "Mais informações → Executar assim mesmo".
- **Mac Gatekeeper**: Clique direito no app → Abrir (primeira vez).
- **Linux**: Execute `chmod +x codelens-local*.AppImage` antes de rodar.

## Versões

- Electron: 33.x
- electron-builder: 25.x
- Node.js: 20+
