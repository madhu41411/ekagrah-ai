# Deployment Guide — Ekagrah-AI

This guide covers deploying both the **Marketing Site** (static HTML) and **HRMS Portal** (Next.js) to the public internet.

---

## 🐳 Local Docker Setup

### Run Everything Together

```bash
cd /Users/madhu/Documents/ekagrah-project
docker-compose up --build
```

This starts:
- **Marketing Site:** `http://localhost:8080`
- **HRMS Portal:** `http://localhost:3000`
- **PostgreSQL:** `localhost:5432`

---

## 🌐 Deploy to Public Internet

### **Option 1: Netlify (Easiest — Marketing Site Only)**

**Best for:** Static HTML marketing website, automatic deployments

1. **Drag & Drop (Instant)**
   ```bash
   # Open https://app.netlify.com/drop
   # Drag the public/ folder onto the page
   # Get a live URL in seconds
   ```

2. **Connect GitHub (Auto-Deploy)**
   ```bash
   # 1. Push to GitHub
   git push origin main
   
   # 2. Go to https://app.netlify.com
   # 3. Click "Add new site → Import from Git"
   # 4. Connect your repo
   # 5. Set Publish directory: public/
   # 6. Deploy!
   ```

   **Every push to main = auto-deploy** ✓

---

### **Option 2: Railway (Marketing + HRMS Full Stack)**

**Best for:** Complete solution (marketing + API + database)

1. **Sign up:** https://railway.app

2. **Create new project**
   ```bash
   # Push your repo to GitHub first
   git push origin main
   ```

3. **Connect GitHub repo in Railway dashboard**

4. **Create services:**
   - **Marketing Site:** 
     - Use Dockerfile from root
     - Port: `8080`
   - **HRMS Portal:**
     - Use Dockerfile from `hrms-portal/`
     - Port: `3000`
   - **PostgreSQL:**
     - Create from Railway's template
     - Link to HRMS via env vars

5. **Set Environment Variables:**
   ```
   DATABASE_URL=postgresql://user:pass@db-host:5432/hrms_portal
   JWT_SECRET=your-secure-random-secret
   APP_URL=https://your-hrms-domain.com
   ```

6. **Deploy:** Railway auto-deploys on every GitHub push

---

### **Option 3: Render (Recommended — Free Tier Available)**

**Best for:** Easy full-stack deployment, good free tier

1. **Sign up:** https://render.com

2. **Create Web Service**
   - Connect GitHub
   - Select this repo
   - Build command: `npm run build` (for HRMS)
   - Start command: `npm run start`
   - Port: `3000`

3. **Create PostgreSQL Database**
   - Add PostgreSQL service from Render
   - Note the `DATABASE_URL`

4. **Create second Web Service for Marketing**
   - Dockerfile: `./Dockerfile`
   - Port: `8080`

5. **Link Services**
   - Set DATABASE_URL env var in HRMS service

6. **Custom Domain**
   - Go to Service Settings → Custom Domain
   - Add your domain (e.g., `portal.ekagrah-ai.com`)

---

### **Option 4: Docker Hub + Any Cloud (AWS, GCP, Azure, DigitalOcean)**

**Best for:** Full control, scaling, enterprise deployments

```bash
# 1. Build and tag images
docker build -t username/ekagrah-marketing:latest .
docker build -t username/ekagrah-hrms:latest ./hrms-portal

# 2. Push to Docker Hub
docker login
docker push username/ekagrah-marketing:latest
docker push username/ekagrah-hrms:latest

# 3. Deploy on any cloud provider
# DigitalOcean App Platform, AWS ECS, GCP Cloud Run, Azure Container Instances, etc.
```

---

## 🔒 Production Checklist

Before deploying to public internet:

- [ ] Update `JWT_SECRET` with a secure random string (use `openssl rand -base64 32`)
- [ ] Update database credentials (don't use `postgres:postgres`)
- [ ] Set `APP_URL` to your production domain
- [ ] Enable HTTPS (all modern hosts do this automatically)
- [ ] Set up database backups
- [ ] Configure monitoring/logging
- [ ] Add security headers in nginx/load balancer
- [ ] Update domain DNS to point to your deployment

---

## 📊 Quick Comparison

| Platform | Cost | Ease | Scalability | Best For |
|----------|------|------|-------------|----------|
| **Netlify** | Free/Pro | ⭐⭐⭐⭐⭐ | Static only | Marketing site |
| **Railway** | Free/Pay | ⭐⭐⭐⭐ | Good | Full stack |
| **Render** | Free/Pay | ⭐⭐⭐⭐ | Good | Full stack |
| **Docker Hub + Cloud** | Varies | ⭐⭐⭐ | Excellent | Enterprise |

---

## 🚀 Recommended Path

**For simplicity:**
1. Deploy **marketing site** to **Netlify** (free, instant)
2. Deploy **HRMS + DB** to **Railway** or **Render** (free tier available)
3. Connect them via API (marketing links to portal)

**Result:**
- Marketing: `ekagrah-ai.com` (Netlify)
- HRMS Portal: `portal.ekagrah-ai.com` (Railway/Render)

---

## 🔗 Useful Links

- Netlify Docs: https://docs.netlify.com/
- Railway Docs: https://docs.railway.app/
- Render Docs: https://render.com/docs
- Docker Docs: https://docs.docker.com/
- Environment Variables Best Practices: https://12factor.net/config

---

## ❓ Troubleshooting

**"Port already in use"**
```bash
docker ps
docker stop container-id
```

**"Database connection refused"**
- Wait 10 seconds for PostgreSQL to start
- Check DATABASE_URL environment variable
- Verify credentials match

**"Build fails"**
```bash
docker-compose down -v
docker-compose up --build
```

---

Need help with deployment? Let me know which platform you prefer! 🚀
