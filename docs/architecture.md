# Architecture

## In one sentence
A static website: Vercel serves the files in this repo exactly as they are. There is no server code and no database.

```
Visitor's browser
   │  loads
   ▼
Vercel (static hosting, jeankevin.vercel.app)
   │  serves files from the main branch of GitHub
   ▼
index.html  ── fonts from Google Fonts, Three.js r128 from cdnjs
images, certificates, resume PDF, case study pages
```

## How the home page is built
`index.html` contains HTML, CSS and one script. The top of the script is the **data block**
(`ME`, `PROJECTS`, `CERTS`, …). The rest of the script reads that data and builds every section.
So changing content means changing data, not layout code.

| Part of the script | What it does |
|---|---|
| Data block (`EDIT YOUR DETAILS HERE`) | All text, links and file names |
| Night mode | Saves the visitor's choice in `localStorage` (`bc-theme`) |
| Section builders (`/* projects */`, `/* certificates */` …) | Turn the data into cards |
| `ISOMETRIC BLOCK FIELD` | The Three.js 3D block background; the pattern changes per section |

## External services (all free)
- **Vercel**: hosting and preview links for pull requests.
- **Google Fonts**: Big Shoulders Display, Hanken Grotesk.
- **cdnjs**: Three.js r128.
- **WhatsApp / email links**: contact (no form backend).

## Database
None. If one is ever added, follow the project standard:
- separate databases for local, staging and production;
- changes only as numbered migration files in `database/migrations/` (`001_…sql`, `002_…sql`);
- migrations are **run by hand**, never automatically; any file that deletes data starts with a clear `-- WARNING: deletes data` line;
- take a backup before running a migration.

## Tests and checks
| Command | What it checks |
|---|---|
| `npm run lint` | JavaScript syntax inside every page, page basics (title, lang, viewport, description), alt text, duplicate ids, links to missing files, `http://` links |
| `npm run secrets` | No keys, tokens, passwords, `.env` or key files in the repo |
| `npm run build:check` | Copies what Vercel will publish into `dist/` and checks key files exist and nothing is over 2 MB |
| `npm test` | The data block: projects, images, case studies, certificates, skills, links |
