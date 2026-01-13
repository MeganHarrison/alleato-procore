# Alleato Docs Site

Standalone documentation viewer for the Alleato project. It renders Markdown from `../../documentation/docs` (or a custom path via `DOCS_ROOT`) with static generation.

## Commands

- `npm run dev --workspace apps/docs-site` – start local dev server
- `npm run build --workspace apps/docs-site` – production build
- `npm run start --workspace apps/docs-site` – run the built output

## Configuration

- `DOCS_ROOT` (optional): override the docs folder. Defaults to `../../documentation/docs` relative to this app directory.

## Deploying to a separate repo

1. From the monorepo root, export the docs app and docs content:
   ```bash
   rsync -av apps/docs-site/ /tmp/alleato-doc-site --exclude=node_modules
   rsync -av documentation/docs/ /tmp/alleato-doc-site/documentation/docs
   ```
2. Initialize and point to your remote:
   ```bash
   cd /tmp/alleato-doc-site
   git init
   git remote add origin https://github.com/MeganHarrison/alleato-doc-site.git
   git add .
   git commit -m "Initial docs site"
   git push -u origin main
   ```
3. On Vercel/Netlify/Cloudflare, set the project root to the repo root, build command `npm run build`, and output `.next`.

The deployed site will be available at `/` (landing) and `/docs/...` for the markdown browser.
