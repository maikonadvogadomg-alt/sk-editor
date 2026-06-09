╔══════════════════════════════════╗
║   SK Code Editor - Terminal v2.0 ║
╚══════════════════════════════════╝
Digite "help" para comandos · "db help" para banco de dados
/ $ npm run build
Script "build" nao encontrado em package.json
/ $ npm run dev
> sk-juridico-desktop dev
> concurrently "node server.js" "electron . --dev"
✓ Script "dev" iniciado (simulado)
/ $ HELP
━━━ COMANDOS DE ARQUIVO ━━━
  ls [dir]           Listar arquivos
  cd <dir>           Mudar diretorio
  pwd                Diretorio atual
  cat <arquivo>      Ver conteudo
  touch <arquivo>    Criar arquivo
  mkdir <dir>        Criar diretorio
  rm [-rf] <alvo>    Remover
  mv <orig> <dest>   Mover/renomear
  cp <orig> <dest>   Copiar
  find <padrao>      Buscar arquivos
  tree               Arvore
━━━ EXECUCAO ━━━
  node <arquivo>     Executar JavaScript
  python <arquivo>   Executar Python
  npm <comando>      Gerenciador npm
  pip install <pkg>  Instalar pacote Python
━━━ BANCO DE DADOS ━━━
  db help            Guia de banco de dados
  db sqlite          Template SQLite
  db postgres        Template PostgreSQL
  db mongo           Template MongoDB
  db neon            Template Neon (Postgres cloud gratis)
  db supabase        Template Supabase
━━━ YOUTUBE / MIDIA ━━━
  youtube            Guia de download do YouTube
  youtube setup      Criar projeto completo de download
  yt help            Mesmo que youtube
━━━ UTILITARIOS ━━━
  search <termo>     Buscar no projeto
  env                Variaveis de ambiente
  clear              Limpar terminal
  date               Data e hora
💡 100+ pacotes npm · 80+ pacotes pip · Use: npm install <nome>
/ $ db help

╔══════════════════════════════════════╗
║         GUIA DE BANCO DE DADOS       ║
╚══════════════════════════════════════╝

Para usar banco de dados no seu projeto:

📦 SQLite (mais simples - no arquivo):
   npm install better-sqlite3
   Crie db.js:
   ```
   const db = require('better-sqlite3')('app.db');
   db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)');
   const insert = db.prepare('INSERT INTO users (name) VALUES (?)');
   insert.run('Joao');
   const rows = db.prepare('SELECT * FROM users').all();
   console.log(rows);
   ```

🐘 PostgreSQL:
   npm install pg
   Crie db.js:
   ```
   const { Pool } = require('pg');
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   const res = await pool.query('SELECT NOW()');
   ```

🍃 MongoDB:
   npm install mongoose
   ```
   const mongoose = require('mongoose');
   await mongoose.connect(process.env.MONGODB_URI);
   ```

🔥 Firebase Firestore:
   npm install firebase
   ```
   import { initializeApp } from 'firebase/app';
   import { getFirestore, collection, addDoc } from 'firebase/firestore';
   ```

☁️ Neon (PostgreSQL na nuvem - gratuito):
   1. Crie conta em: console.neon.tech
   2. Crie um banco de dados
   3. Copie a connection string (DATABASE_URL)
   4. npm install pg
   5. Use: const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true })

💡 Use "db <tipo>" para criar template automatico:
   db sqlite | db postgres | db mongo | db firebase | db neon | db supabase
/ $ db sqlite
✓ db.js criado com template SQLite
Execute: npm install better-sqlite3
/ $ db neon
✓ Template Neon PostgreSQL criado!
  Proximos passos:
  1. Acesse: console.neon.tech e crie uma conta gratuita
  2. Crie um projeto e copie a Connection String
  3. Cole no arquivo .env como DATABASE_URL
  4. Execute: npm install pg
  5. Execute: node db.js
  Neon oferece: 512MB gratis, PostgreSQL gerenciado, branching de banco!
/ $ db postgres
✓ db.js e .env criados com template PostgreSQL
Execute: npm install pg
Configure DATABASE_URL no arquivo .env
/ $ db mongo
✓ db.js criado com template MongoDB
Execute: npm install mongoose
/ $ db superbase
db: tipo desconhecido: superbase
Tipos: sqlite, postgres, mongo, firebase
/ $ tree
.env
.env.example
.gitignore
PLANO.md
SISTEMA.md
db.js
│  ├─ builder-debug.yml
│  ├─ builder-effective-config.yaml
│  │  ├─ LICENSE.electron.txt
│  │  │  │  │  ├─ package.json
│  │  │  │  │  │  ├─ index.ts
│  │  │  │  │  │  │  ├─ index.ts
│  │  ├─ vk_swiftshader_icd.json
│  │  ├─ LICENSE.electron.txt
│  │  │  │  │  ├─ package.json
│  │  │  │  │  │  ├─ index.ts
│  │  │  │  │  │  │  ├─ index.ts
│  │  ├─ vk_swiftshader_icd.json
main.js
package.json
preload.js
/ $ ls
📁 dist-electron/
📄 .env
📄 .env.example
📄 .gitignore
📄 db.js
📄 main.js
📄 package.json
📄 PLANO.md
📄 preload.js
📄 SISTEMA.md
/ $ touch
touch: falta nome do arquivo
/ $ env
NODE_ENV=development
EDITOR=SK-Code-Editor
LANG=pt_BR.UTF-8
PATH=/usr/local/bin:/usr/bin:/bin
(Adicione variaveis em .env no projeto)
/ $ cp
cp: cp <origem> <destino>
/
$
Ln 85, Col 1
Sp: 2
JSON
LF
UTF-8



