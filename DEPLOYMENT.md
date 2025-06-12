# 🚀 Life Manager Full Stack Deployment Guide

## 🏗️ Architecture Overview
- **Frontend**: SvelteKit (Vercel/Netlify)
- **Backend API**: Express.js (Railway)
- **Database**: PocketBase (Fly.io)

## 🗄️ Step 1: Deploy Database (PocketBase on Fly.io)

### Quick Deploy
```bash
cd database
./deploy.sh
```

### Manual Setup
```bash
# Install Fly.io CLI
curl -L https://fly.io/install.sh | sh

# Login and deploy
flyctl auth login
cd database
flyctl launch --no-deploy
flyctl volumes create pb_data --region dfw --size 3
flyctl deploy
```

**Your PocketBase will be available at**: `https://life-manager-pocketbase.fly.dev`

## 🚀 Step 2: Deploy API (Express.js on Railway)

### Quick Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy API
railway login
railway link
railway up
```

### Set Environment Variables in Railway Dashboard:
```env
PORT=3001
NODE_ENV=production
POCKETBASE_URL=https://life-manager-pocketbase.fly.dev
POCKETBASE_ADMIN_EMAIL=your_admin_email
POCKETBASE_ADMIN_PASSWORD=your_admin_password
OPENAI_API_KEY=your_openai_key
ALLOWED_ORIGINS=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🎨 Step 3: Deploy Frontend (SvelteKit)

### Option A: Vercel (Recommended)
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Option B: Netlify
```bash
npm install -g netlify-cli
cd frontend
netlify deploy --prod
```

## 🔗 Step 4: Connect Everything

### Update Frontend API URL
In `frontend/src/lib/api/index.ts`:
```typescript
const API_BASE_URL = 'https://your-railway-app.railway.app';
```

### Update Backend CORS
In Railway environment variables:
```env
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## 🛠️ Development Workflow

### Local Development (All Services)
```bash
# Terminal 1: Database (PocketBase)
cd database
flyctl proxy 8090:8080 -a life-manager-pocketbase

# Terminal 2: Backend API
cd backend
bun install
bun run dev:watch

# Terminal 3: Frontend
cd frontend
bun install
bun run dev
```

### Environment Setup
Create `backend/.env`:
```env
PORT=3001
NODE_ENV=development
POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your_password
OPENAI_API_KEY=your_key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
```

## 🎯 First-Time Setup Checklist

### 1. PocketBase Setup
- [ ] Deploy to Fly.io
- [ ] Visit admin panel: `https://life-manager-pocketbase.fly.dev/_/`
- [ ] Create admin account
- [ ] Database collections auto-create on first API call

### 2. Railway API Setup
- [ ] Connect GitHub repo
- [ ] Set environment variables
- [ ] Deploy and get URL

### 3. Frontend Setup
- [ ] Update API base URL
- [ ] Deploy to Vercel/Netlify
- [ ] Update CORS origins in Railway

## 💰 Free Tier Resources

### Fly.io (PocketBase)
- ✅ 3GB persistent storage
- ✅ 512MB RAM
- ✅ Always-on single machine

### Railway (API)
- ✅ 512MB RAM
- ✅ 500GB outbound bandwidth
- ✅ Custom domain

### Vercel (Frontend)
- ✅ 100GB bandwidth
- ✅ Unlimited deployments
- ✅ Custom domain

## 🔧 Common Commands

### Database Management
```bash
# Check PocketBase status
flyctl status -a life-manager-pocketbase

# View logs
flyctl logs -a life-manager-pocketbase

# SSH into database
flyctl ssh console -a life-manager-pocketbase
```

### API Management
```bash
# Railway logs
railway logs

# Railway status
railway status

# Local proxy to production DB
flyctl proxy 8090:8080 -a life-manager-pocketbase
```

### Frontend Management
```bash
# Vercel logs
vercel logs

# Redeploy
vercel --prod
```

## 🚨 Troubleshooting

### Database Connection Issues
1. Check PocketBase is running: `curl https://life-manager-pocketbase.fly.dev/api/health`
2. Verify Railway environment variables
3. Check CORS settings

### API Issues
1. Check Railway logs: `railway logs`
2. Verify environment variables are set
3. Test endpoints manually

### Frontend Issues
1. Check API URL in code
2. Verify CORS origins
3. Test API calls in browser dev tools

## 🔄 Deployment Updates

### Update Database
```bash
cd database
flyctl deploy
```

### Update API
```bash
git push  # Auto-deploys on Railway
```

### Update Frontend
```bash
cd frontend
vercel --prod
```

## 📊 Monitoring

- **PocketBase**: Fly.io dashboard
- **API**: Railway dashboard
- **Frontend**: Vercel/Netlify dashboard
- **Logs**: Available in each platform's dashboard 