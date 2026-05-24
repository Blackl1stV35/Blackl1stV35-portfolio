# Personal Portfolio

A personal portfolio site for showcasing work, projects, publications, activity, achievements, and reading.

**Live:** [your-domain.vercel.app](https://your-domain.vercel.app)

---

## Stack

Next.js 14 · Tailwind CSS · MDX · Vercel · GitHub API

---

## Sections

| Route | Content |
|---|---|
| `/` | About — bio, photo, tags |
| `/work` | Work experience timeline |
| `/projects` | Projects — GitHub, university, generic |
| `/publications` | Papers, articles, preprints |
| `/activity` | Talks, conferences, volunteering |
| `/achievement` | Awards, certifications, honours |
| `/books` | Reading list |
| `/contact` | Contact form + links |
| `/admin` | Content management (password-protected) |

---

## Setup

```bash
git clone https://github.com/Blackl1stV35/portfolio.git
cd portfolio
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

**Required environment variables** (add to Vercel dashboard and `.env.local`):

| Variable | Value |
|---|---|
| `ADMIN_TOKEN` | Any secret string — used to log in to `/admin` |
| `GITHUB_TOKEN` | Personal Access Token with `repo` scope |
| `GITHUB_OWNER` | Your GitHub username |
| `GITHUB_REPO` | This repository name |
| `GITHUB_BRANCH` | `master` |
| `BLOB_READ_WRITE_TOKEN` | From Vercel dashboard → Storage → Blob |

Deploy: `npx vercel --prod`

---

## Content

All content lives in two places:

- `collections/` — MDX files, one per entry, organised by type
- `content/author.json` and `content/contact.json` — profile and contact details

The easiest way to manage content is through `/admin`. Changes commit directly to GitHub and the site redeploys automatically (~30 s).

To add an entry manually, drop an `.mdx` file into the relevant folder. Fields for each collection type are defined in `collections/collections.config.js`.

**Status values:**

| Value | Meaning |
|---|---|
| `green` | Active / Current / Published / Read |
| `yellow` | In Progress / Upcoming / Under Review |
| `red` | Archived / Expired / Interested |

---

## Downloads

- **CV** — replace `public/cv.pdf` with your own file
- **Portfolio** — generated on demand at `/api/export?format=docx` from live content

---

## License

MIT — see [LICENSE](LICENSE)