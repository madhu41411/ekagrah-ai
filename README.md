# Ekagrah-AI — Full Project

Marketing website + HRMS Employee Portal for Ekagrah-AI.

```
ekagrah-ai/
├── public/                 ← Marketing website (static HTML)
│   ├── index.html          ← Main site (all CSS + JS + logo embedded)
│   └── logo.png            ← Company logo
├── hrms-portal/            ← Your HRMS app (copy from local)
│   └── ...                 ← Next.js / React / your existing code
├── package.json
├── netlify.toml            ← Marketing site deployment config
├── .gitignore
└── README.md
```

---

## Quick Start (Local Dev)

### 1. Marketing site
Just open `public/index.html` in any browser — no server needed.

Or serve it locally:
```bash
npx serve public -p 8080
# → http://localhost:8080
```

### 2. HRMS Portal
```bash
cd hrms-portal
npm install
npm run dev
# → http://localhost:3000/dashboard
```

The **Employee Login** button on the marketing site automatically detects the environment:
- **Local** (`localhost` / `file://`) → opens `http://localhost:3000/dashboard`
- **Production** → opens `https://hrms.ekagrah-ai.com/dashboard`

To change the production HRMS URL, edit this line in `public/index.html`:
```js
return 'https://hrms.ekagrah-ai.com/dashboard';
```

---

## Push to GitHub

### First time setup
```bash
# 1. Create a new repo on github.com → copy the repo URL

# 2. In this project folder:
git init
git add .
git commit -m "Initial commit: Ekagrah-AI website + HRMS portal"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ekagrah-ai.git
git push -u origin main
```

### Adding your HRMS portal
```bash
# Copy your local HRMS code into the hrms-portal/ folder
cp -r /Users/madhu/Documents/Codex/hrms-portal ./hrms-portal

# Then commit it
git add hrms-portal/
git commit -m "Add HRMS portal"
git push
```

---

## Deploy Marketing Site to Netlify

### Option A — Drag & Drop (instant)
1. Go to https://app.netlify.com/drop
2. Drag the `public/` folder onto the page
3. Live in seconds

### Option B — Connect GitHub (auto-deploy on push)
1. Go to https://app.netlify.com → **Add new site → Import from Git**
2. Connect your GitHub repo
3. Set **Publish directory** to `public`
4. Every `git push` to `main` auto-deploys the site ✓

---

## Deploy HRMS Portal

Once your HRMS app is ready, deploy it separately to:
- **Vercel** (recommended for Next.js): `vercel` from `hrms-portal/`
- **Railway / Render** for full-stack apps with a backend
- **Netlify** with a second site

Then update the production URL in `public/index.html`:
```js
return 'https://YOUR-DEPLOYED-HRMS-URL.com/dashboard';
```

---

## Connect Custom Domain

| Site | Suggested Domain |
|------|-----------------|
| Marketing | `ekagrah-ai.com` |
| HRMS Portal | `hrms.ekagrah-ai.com` or `portal.ekagrah-ai.com` |

Set up in Netlify/Vercel → Domain Settings → Add custom domain.
