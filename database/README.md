# 🗄️ PocketBase Database on Fly.io

This folder contains the deployment configuration for your PocketBase database running on Fly.io's free tier.

## 🚀 Quick Deploy

```bash
cd database
chmod +x deploy.sh
./deploy.sh
```

## 📁 Files Overview

- `Dockerfile` - PocketBase container configuration
- `fly.toml` - Fly.io deployment configuration
- `deploy.sh` - Automated deployment script
- `README.md` - This documentation

## 🛠️ Manual Setup

### 1. Install Fly.io CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly.io
```bash
flyctl auth login
```

### 3. Deploy
```bash
cd database
flyctl launch --no-deploy  # Creates app and fly.toml
flyctl volumes create pb_data --region dfw --size 3
flyctl deploy
```

## 🌐 Access Your Database

After deployment:
- **Database API**: `https://life-manager-pocketbase.fly.dev`
- **Admin Panel**: `https://life-manager-pocketbase.fly.dev/_/`

## 🔧 First-Time Setup

1. Visit the admin panel URL
2. Create your admin account
3. Your database will auto-create the `tasks` collection on first API use

## 🔗 Connect to Railway API

Update your Railway environment variables:

```env
POCKETBASE_URL=https://life-manager-pocketbase.fly.dev
POCKETBASE_ADMIN_EMAIL=your_admin_email
POCKETBASE_ADMIN_PASSWORD=your_admin_password
```

## 💾 Data Persistence

- **Volume**: 3GB persistent storage (free tier)
- **Location**: `/app/pb_data` inside container
- **Backup**: Available through Fly.io dashboard

## 📊 Free Tier Limits

- **Storage**: 3GB persistent volume
- **RAM**: 512MB
- **CPU**: Shared CPU
- **Always On**: Single machine keeps running

## 🔧 Common Commands

```bash
# Check app status
flyctl status -a life-manager-pocketbase

# View logs
flyctl logs -a life-manager-pocketbase

# SSH into container
flyctl ssh console -a life-manager-pocketbase

# Scale/restart
flyctl machine restart -a life-manager-pocketbase

# Monitor resources
flyctl dashboard life-manager-pocketbase
```

## 🆘 Troubleshooting

### App won't start
- Check logs: `flyctl logs -a life-manager-pocketbase`
- Verify Dockerfile builds locally: `docker build -t test .`

### Volume issues
- List volumes: `flyctl volumes list -a life-manager-pocketbase`
- Create new volume: `flyctl volumes create pb_data --size 3`

### Connection issues
- Test health: `curl https://life-manager-pocketbase.fly.dev/api/health`
- Check DNS: `nslookup life-manager-pocketbase.fly.dev`

### Admin panel not accessible
- URL should be: `https://life-manager-pocketbase.fly.dev/_/`
- Clear browser cache
- Try incognito mode

## 🔄 Updates

To update PocketBase version:
1. Edit `Dockerfile` - change `PB_VERSION`
2. Run `flyctl deploy`

## 💡 Tips

- Use Fly.io dashboard for monitoring
- Set up alerts for downtime
- Consider backup strategy for production
- PocketBase auto-migrates schema changes 