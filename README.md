# Kanokphan Sirithienthong — Personal Portfolio

A personal portfolio built with **Next.js 14**, **Tailwind CSS**, and **MDX**. Content is managed through a password-protected admin panel that writes directly to the GitHub repository via the GitHub Contents API, triggering automatic Vercel redeploys. All infrastructure runs within Vercel's free tier.

---

## Architecture overview

```
Browser ──► Next.js on Vercel (SSR, force-dynamic)
               │
               ├── /admin          Password-protected CMS panel
               │     ├── Author profile (photo, bio, contact)
               │     ├── Collections CRUD (Projects, Work, Publications, Books)
               │     └── CV / Portfolio PDF upload
               │
               ├── /api/auth       Token validation with rate limiting (5 attempts → 15 min lock)
               ├── /api/collections GitHub Contents API commit/delete for MDX files
               ├── /api/author     GitHub Contents API commit for author.json
               ├── /api/export     On-demand DOCX (+ PDF via LibreOffice) portfolio generation
               ├── /api/upload     Vercel Blob for binary file uploads
               └── /api/redeploy   Optional Vercel deploy hook trigger
```

**Content flow:** Admin saves entry → API route commits MDX to GitHub → Vercel auto-redeploys in ~30 s → page reflects new content. A 5-second in-process cache (`src/lib/cache.ts`) also reads live from GitHub for zero-downtime updates without waiting for redeploy.

**Translation:** Google Translate widget loaded lazily on demand. Clicking the Translate button in the navbar loads the script, renders the language picker, and triggers it — no page-level meta tag interference.

**Export:** Portfolio button downloads a `.docx` file built server-side from live `author.json` + MDX collections using the `docx` npm package. Cover page → bio overview → work timeline → projects → publications → contact. PDF conversion attempted via LibreOffice if available on the server.

---

## Project structure

```
portfolio/
├── collections/
│   ├── collections.config.js   Master field schema for all collections
│   ├── projects/               *.mdx files — one per project entry
│   ├── work/                   *.mdx files — one per work experience
│   ├── publications/           *.mdx files — one per publication
│   └── books/                  *.mdx files — one per book
│
├── content/
│   ├── author.json             Name, bio, photo, degrees, social links
│   └── contact.json            Email, GitHub, LinkedIn, location, Formspree ID
│
├── public/
│   └── cv.pdf                  Downloadable CV (replace with your own)
│
└── src/
    ├── app/
    │   ├── page.tsx            About
    │   ├── work/               Work experience
    │   ├── projects/           Projects
    │   ├── publications/       Publications
    │   ├── books/              Reading list
    │   ├── contact/            Contact form
    │   ├── admin/              CMS panel (auth-gated)
    │   └── api/                API routes (auth, collections, author, export, upload, redeploy)
    ├── components/
    │   ├── Navbar.tsx          Sticky nav with CV/Portfolio download, Translate button, dark mode
    │   ├── StatusBadge.tsx     Green / Yellow / Red status indicator
    │   ├── AvatarUpload.tsx    Click-to-upload image component (admin only)
    │   └── GoogleTranslate.tsx Lazy Google Translate loader + hidden mount point
    ├── lib/
    │   ├── auth.ts             Token validation + in-memory rate limiter
    │   ├── cache.ts            5 s in-process cache with GitHub fallback reads
    │   ├── collections.ts      MDX reader with array normalisation
    │   ├── export.ts           DOCX portfolio builder (docx npm)
    │   ├── github.ts           GitHub Contents API (commit, delete, local write + cache evict)
    │   └── mdx.ts              Frontmatter serialiser + slugify
    └── types/index.ts          TypeScript interfaces for all collection entries
```

---

## Setup

### Prerequisites

- Node.js 18+
- A GitHub repository (public or private) where this code lives
- A Vercel account (free tier)

### 1 — Clone and install

```bash
git clone https://github.com/Blackl1stV35/portfolio.git
cd portfolio
npm install
```

### 2 — Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Description | How to get it |
|---|---|---|
| `ADMIN_TOKEN` | Secret for the admin panel | `openssl rand -base64 32` |
| `GITHUB_TOKEN` | Personal Access Token with `repo` scope | [github.com/settings/tokens](https://github.com/settings/tokens) |
| `GITHUB_OWNER` | Your GitHub username | e.g. `Blackl1stV35` |
| `GITHUB_REPO` | Repository name | e.g. `portfolio` |
| `GITHUB_BRANCH` | Default branch | `master` (or `main`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for file uploads | Vercel dashboard → Storage → Blob |
| `VERCEL_DEPLOY_HOOK` | Optional — triggers redeploy from admin | Vercel dashboard → Settings → Git → Deploy Hooks |

### 3 — Run locally

```bash
npm run dev
# → http://localhost:3000
# Admin panel → http://localhost:3000/admin
```

### 4 — Deploy to Vercel

```bash
npx vercel --prod
```

Then add all environment variables in the **Vercel dashboard → Settings → Environment Variables**. GitHub API calls and Blob uploads will not work until these are set.

### 5 — Set up Vercel Blob (for file uploads from admin)

In the Vercel dashboard:
1. Go to **Storage** → **Create** → **Blob Store**
2. Connect it to your project
3. Copy the generated `BLOB_READ_WRITE_TOKEN` into your environment variables

---

## Content management

### Via admin panel (recommended)

Visit `/admin`, enter your `ADMIN_TOKEN`. The panel provides:

- **Author profile** — name, title, bio, photo, degrees, social links (written to `content/author.json`)
- **Collections** — create and delete entries for Projects, Work, Publications, and Books (written as MDX files to `collections/`)
- **CV & PDFs** — upload a new CV (commits to `public/cv.pdf`) or Portfolio PDF (uploads to Vercel Blob)

Every save commits directly to GitHub and triggers a Vercel redeploy. The in-process cache also updates immediately so content reflects within seconds even before the redeploy completes.

### Via GitHub directly

Drop `.mdx` files into the appropriate collection folder. Frontmatter fields are defined per-collection in `collections/collections.config.js`. Status values:

| Value | Meaning | Colour |
|---|---|---|
| `green` | Active / Published / Current / Read | 🟢 |
| `yellow` | In Progress / Under Review / Reading | 🟡 |
| `red` | Archived / Retracted / Interested | 🔴 |

**Example — new project entry** (`collections/projects/my-project.mdx`):

```yaml
---
title: "My Project"
type: "github"
status: "green"
repo: "https://github.com/Blackl1stV35/my-project"
description: "A short description of what this does."
tags: ["Python", "ML"]
date: "2025-01-15"
---

Extended description or notes in Markdown here.
```

### Contact details

Edit `content/contact.json` directly or via the Admin → Author panel:

```json
{
  "email": "you@example.com",
  "github": "yourusername",
  "linkedin": "https://linkedin.com/in/you",
  "location": "City, Country",
  "formAction": "https://formspree.io/f/YOUR_ID"
}
```

---

## Portfolio export

The **Portfolio** button in the navbar opens a modal with DOCX and PDF download options.

- **DOCX** — always available; built on-demand at `/api/export?format=docx` using the `docx` npm package. Contains: cover page (name, title, date), bio overview, work timeline, projects, publications, contact.
- **PDF** — attempts conversion from DOCX via LibreOffice (`/api/export?format=pdf`). Falls back to returning the DOCX if LibreOffice is unavailable on the server.

---

## Translation

Click the **Translate** button in the navbar. This lazily loads the Google Translate widget script and opens the language picker. No full page reload. The widget is mounted in a hidden `div` to avoid layout interference; the language picker appears inline on trigger.

---

## Dark mode

Click the 🌞 / 🌙 button in the navbar. Preference is persisted to `localStorage`. Dark mode applies a set of CSS overrides defined in `src/app/globals.css` under the `.dark` class on `<html>`.

---

## Customisation

- **Personal info** — edit `content/author.json` or use the admin panel
- **Contact details** — edit `content/contact.json` or use the admin panel  
- **Collection field schemas** — edit `collections/collections.config.js`
- **Nav labels / translations** — edit the `translations` object in `src/components/Navbar.tsx`
- **Status colour definitions** — edit `src/components/StatusBadge.tsx`
- **Export template** — edit `src/lib/export.ts`
- **CV** — replace `public/cv.pdf` with your own file and commit

---

## Development notes

- All content pages export `revalidate = 0` or use `dynamic = 'force-dynamic'` so they never serve stale cached HTML.
- `src/lib/cache.ts` provides a 5-second in-process cache that first tries reading from GitHub (live source of truth) and falls back to the local filesystem. This means content updates are visible within seconds of an admin commit, even on a cold Vercel instance.
- Arrays in MDX frontmatter (`tags`, `stack`) are normalised in `src/lib/collections.ts` — they can be written as YAML arrays or comma-separated strings and will always arrive as `string[]` in components.
- The GitHub Personal Access Token needs `repo` scope (read + write to repository contents). Fine-grained tokens also work — grant `Contents: Read and write` on the target repository.