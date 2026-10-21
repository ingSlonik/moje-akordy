# Fílův zpěvník (moje-akordy) 🎸📖

Moderní, rychlý a responzivní webový zpěvník a sbírka poezie s interaktivním zobrazením akordů, plynulým autoscrollem, osobním hodnocením a editorem písní.

Aplikace běží na Reactu 19, TypeScriptu, Expressu se Server-Side Renderingem (SSR) a lokální JSON databází (`easy-db-node`).

---

## Hlavní funkce

* **Písně a akordy**: Přes 50 písní s přesným umístěním akordů přímo nad slabikami textu (`[C]`, `[Am]`, `// komentáře`, `\`\`\`tabulatury\`\`\``).
* **Sbírka básní**: Přes 150 básní organizovaných do sbírek (např. *Jako kůl v plotě*).
* **Plynulý AutoScroll**: Automatické posouvání textu s nastavitelnou rychlostí, tlačítky pro zrychlení, zpomalení a pozastavení.
* **Osobní hodnocení**:
  * Nepřihlášení návštěvníci vidí výchozí doporučené hodnocení písně.
  * Přihlášení uživatelé mají vlastní personalizované hodnocení (0–100 %), které neovlivňuje hodnocení ostatních.
* **Správa písní & Editor**:
  * Přidávání nových písní a úprava stávajících písní přímo v prohlížeči.
  * Oprávnění: autor může své písně libovolně upravovat a mazat; administrátor má plný přístup.
* **Uživatelské účty a autentizace**:
  * Registrace, přihlášení, správa profilu a obnova hesla přes e-mail pomocí [`easy-user-auth`](https://www.npmjs.com/package/easy-user-auth).
  * Automatická kaskádová aktualizace jména autora napříč všemi jeho písněmi.
* **Administrace a analytika**:
  * Statistiky návštěvnosti, zdroje provozu, analýza zařízení a mapování uživatelských cest pomocí [`easy-analytics`](https://www.npmjs.com/package/easy-analytics).
  * Automatické zachycení chyb na frontendu s filtrováním.
* **SEO & Server-Side Rendering (SSR)**:
  * Plnohodnotný SSR s hydratací přes [`ssr-hook`](https://www.npmjs.com/package/ssr-hook).
  * Dynamická mapa stránek `/sitemap.xml` a `/robots.txt`.

---

## Architektura a technologie

* **Frontend**: React 19, TypeScript, [`easy-page-router`](https://www.npmjs.com/package/easy-page-router), centrální CSS (`src/styles.css`).
* **Backend**: Express 5, Node 24, produkční bundle přes `esbuild` (`dist-server/index.js`).
* **Kompilace klienta**: Vite 8 (`dist/`).
* **Typově bezpečné RPC API**: [`typed-client-server-api`](https://www.npmjs.com/package/typed-client-server-api) se společným kontraktem v `types.ts`.
* **Databáze**: Lokální dokumentová JSON databáze [`easy-db-node`](https://www.npmjs.com/package/easy-db-node):
  * `easy-db/song.json` – písně, akordy, rychlosti posunu a hodnocení.
  * `easy-db/poem.json` – sbírky básní.
  * `easy-db/user.json` – uživatelské účty a role.

---

## Rychlý start

### 1. Instalace závislostí
```bash
npm install
```

### 2. Nastavení prostředí (.env)
Vytvořte nebo upravte soubor `.env`:
```env
SERVER_PORT=1111
SERVER_URL=http://localhost:1111
JWT_SECRET=tajny-klic-pro-podepisovani-tokenu
MAIL_SMTP=smtp.example.com
MAIL_PORT=587
MAIL_USER=vas-email@example.com
MAIL_PASSWORD=heslo-k-emailu
```

### 3. Spuštění vývojového serveru
```bash
npm run dev
```
Tento příkaz spustí Express backend (port `1111`) a Vite dev server (port `5173`) s hot reloadem.

---

## Produkční sestavení & Spuštění

```bash
# Sestavení klienta (Vite) i serveru (esbuild)
npm run build

# Spuštění produkčního serveru
npm start
```

---

## Testování

Projekt obsahuje sadu testů pokrývajících parser akordů, hodnocení, analytiku, SSR a kompletní end-to-end integraci:

```bash
npm test
```

### Přehled testovacích modulů:
* `tests/parser.test.ts` – tokenizace akordů, komentářů, tabulatur a slugifikace.
* `tests/song-api.test.ts` – integrita databáze a algoritmus rozlišení hodnocení.
* `tests/errorFilters.test.ts` – filtrování chyb v administraci.
* `tests/analytics-user.test.ts` – obohacování analytiky o identitu uživatelů.
* `tests/ssr-routes.test.ts` – vykreslování SSR HTML bez chyb.
* `tests/songbook-e2e.test.ts` – end-to-end integrační testy (API, registrace, CRUD písní, 403 kontroly, izolace hodnocení a SSR).

---

## API Rozhraní (`types.ts`)

Všechna volání mezi Reactem a Expressem používají RPC kontrakt:
* `getSongs({})` -> seznam všech písní a básní s vypočítaným hodnocením.
* `getSong({ file })` -> detail písně s tokenizovanými slokami a akordy.
* `getPoem({ file, title })` -> detail básně.
* `addSong({ ... })` -> vytvoření nové písně (přihlášený uživatel).
* `updateSong({ ... })` -> úprava písně (autor nebo admin).
* `removeSong({ file })` -> smazání písně (autor nebo admin).
* `updateSongRating({ file, rating })` -> uložení osobního hodnocení písně.
* `getUsers({})`, `updateUserRole({ ... })` -> správa uživatelů v administraci.
* `getEasyAnalyticsData({ month })` -> statistiky návštěvnosti.

---

## Struktura projektu

```text
├── easy-db/                # JSON databáze písní (song.json) a básní (poem.json)
├── public/                 # Statické soubory, manifest, ikony
│   └── images/             # Optimalizované obrázky přes easy-image-resizer
├── server/
│   ├── index.tsx           # Express server, SSR handler, API endpointy, SEO
│   └── mail.tsx            # Šablony e-mailů pro obnovu hesla
├── src/
│   ├── components/         # Song, SongTable, AutoScroll, Ranking, NextSong, Img
│   ├── pages/              # Index, Song, Poem, Editor, Admin, ResetPassword, NotFound
│   ├── services/           # api.ts (useSSRApi, useApi, api RPC klient)
│   ├── utils/              # parser.ts (akordy, texty), errorFilters.ts
│   ├── App.tsx             # Kořenová komponenta s lokalizací a navigací
│   ├── Router.tsx          # Klientský router (easy-page-router) s animacemi
│   └── styles.css          # Centrální styly zpěvníku
├── tests/                  # Integrační a jednotkové testy
├── types.ts                # TypeScript definice API, databáze a modelů
└── .cursorrules            # Pravidla a konvence pro AI asistenty
```
