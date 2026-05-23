# Personal Portfolio

Next.js 14 · Tailwind CSS · MDX · Vercel · Times New Roman

## Setup (5 steps)

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/portfolio.git
cd portfolio
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local with your values (see comments inside)
```

### 3. Run locally
```bash
npm run dev
# → http://localhost:3000
```

### 4. Deploy to Vercel
```bash
npx vercel
# Follow prompts — add env vars in Vercel dashboard
```

### 5. Enable Vercel Blob (for PDF uploads)
```bash
npx vercel blob
# Pastes BLOB_READ_WRITE_TOKEN into your Vercel project automatically
```

---

## Adding content

Drop `.mdx` files into `collections/{projects,work,publications,books}/`.

Frontmatter fields are defined in `collections/collections.config.js`.
Status colours: `green` = active/published/read, `yellow` = in-progress, `red` = archived.

Or use the admin panel at `/admin`.

## Customise

- **Your name / bio**: `src/app/page.tsx`
- **Nav links**: `src/components/Navbar.tsx`
- **Collection fields**: `collections/collections.config.js`
- **Contact form endpoint**: replace `YOUR_FORM_ID` in `src/app/contact/page.tsx`
- **CV / Portfolio PDF**: replace `public/cv.pdf` and `public/portfolio.pdf`
