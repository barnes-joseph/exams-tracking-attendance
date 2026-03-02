# 🚀 Deploying to Render

This guide covers deploying the Exam Attendance Tracking application to [Render](https://render.com) - a cloud platform with free tier and automatic deployments.

## 📋 Prerequisites

- [Render account](https://dashboard.render.com/register) (free tier available)
- MongoDB database (MongoDB Atlas recommended - free tier available)
- GitHub/GitLab repository with your code pushed

---

## 🏗️ Architecture on Render

```
┌─────────────────────────────────────────────────────────────┐
│                         Render                               │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  Static Site        │    │  Web Service                │ │
│  │  (Frontend)         │    │  (Backend API)              │ │
│  │  - React + Vite     │    │  - NestJS (Node.js)         │ │
│  │  - Free: 100GB/mo   │    │  - Free: 512MB RAM          │ │
│  │  - Auto-deploy      │    │  - Sleeps after 15 min      │ │ │
│  └──────────┬──────────┘    └──────────────┬──────────────┘ │
│             │                              │                │
│             │         API Calls            │                │
│             └──────────────────────────────┘                │
│                                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   MongoDB Atlas         │
              │   (Database)            │
              │   - Free tier: 512MB    │
              └─────────────────────────┘
```

---

## 🚀 Deployment Steps

### Step 1: Push Code to Git Repository

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit with Docker setup"

# Add remote and push
git remote add origin https://github.com/yourusername/exam-attendance-tracking.git
git push -u origin main
```

### Step 2: Create MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Create a free shared cluster
3. Create a database user with password
4. Add your IP to Network Access (or allow from anywhere: `0.0.0.0/0`)
5. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/exam-tracking?retryWrites=true&w=majority
   ```

### Step 3: Deploy Backend (Web Service)

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your Git repository
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `exam-tracking-api` |
| **Environment** | `Docker` |
| **Dockerfile Path** | `./backend/Dockerfile` |
| **Branch** | `main` |

4. **Instance Type**: Select `Free` (or paid for production)

5. **Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `MONGODB_URI` | `your-mongodb-atlas-uri` |
| `JWT_SECRET` | `generate-random-secret` |
| `CORS_ORIGIN` | `https://exam-tracking-frontend.onrender.com` (update after frontend deploy) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | `your-app-password` |
| `SMTP_FROM` | `Examinations Office <your-email@gmail.com>` |

6. Click **"Create Web Service"**

7. Wait for build and deployment (takes 5-10 minutes)

8. Copy the service URL (e.g., `https://exam-tracking-api.onrender.com`)

### Step 4: Deploy Frontend (Static Site)

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect the same Git repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `exam-tracking-frontend` |
| **Branch** | `main` |
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |

4. **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://exam-tracking-api.onrender.com/api` (your backend URL + /api) |

5. Click **"Create Static Site"**

### Step 5: Update CORS (Important!)

After both services are deployed:

1. Go to your Backend service in Render Dashboard
2. Click **"Environment"**
3. Update `CORS_ORIGIN`:
   ```
   https://exam-tracking-frontend.onrender.com,http://localhost:5173
   ```
4. The service will auto-redeploy

---

## 🔧 Alternative: Using Render Blueprint (render.yaml)

Create a `render.yaml` file in your repository root for Infrastructure as Code:

```yaml
# render.yaml - Render Blueprint for Exam Attendance Tracking
services:
  # Backend API Service
  - type: web
    name: exam-tracking-api
    runtime: docker
    dockerfilePath: ./backend/Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: MONGODB_URI
        sync: false  # Set manually in dashboard
      - key: JWT_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        fromService:
          name: exam-tracking-frontend
          type: static
          property: url
      - key: SMTP_HOST
        sync: false
      - key: SMTP_PORT
        sync: false
      - key: SMTP_USER
        sync: false
      - key: SMTP_PASS
        sync: false
      - key: SMTP_FROM
        sync: false
    healthCheckPath: /health
    plan: free  # Change to 'starter' or higher for production

  # Frontend Static Site
  - type: static
    name: exam-tracking-frontend
    buildCommand: cd frontend && npm install && npm run build
    publishPath: frontend/dist
    envVars:
      - key: VITE_API_URL
        fromService:
          name: exam-tracking-api
          type: web
          property: url
          suffix: /api
```

Then in Render Dashboard:
1. Click **"New +"** → **"Blueprint"**
2. Connect your repository
3. Render will create both services automatically

---

## 📊 Free Tier Limits

| Service | Free Tier Limits |
|---------|------------------|
| **Web Service** | 512MB RAM, 0.1 CPU, sleeps after 15 min inactivity (30s cold start) |
| **Static Site** | 100GB bandwidth/month, unlimited requests |
| **Custom Domains** | Free SSL certificates |

**Note**: The free web service "sleeps" after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

---

## ⚡ Keeping Service Awake (Free Tier)

To prevent cold starts, use a ping service:

1. Sign up at [UptimeRobot](https://uptimerobot.com/) (free)
2. Add a monitor:
   - Type: HTTP(s)
   - URL: `https://exam-tracking-api.onrender.com/health`
   - Interval: 5 minutes

---

## 🔒 Custom Domain Setup

1. In Render Dashboard, go to your Static Site
2. Click **"Settings"** → **"Custom Domains"**
3. Add your domain (e.g., `examtracking.yourschool.edu`)
4. Follow DNS instructions to add CNAME record
5. SSL certificate is automatically provisioned

Do the same for your backend API if needed.

---

## 🔄 Auto-Deployment

Render automatically deploys on every push to your connected branch.

To disable auto-deploy:
1. Go to service settings
2. Toggle **"Auto-Deploy"** to OFF
3. Deploy manually by clicking **"Manual Deploy"**

---

## 🐛 Troubleshooting

### "Build failed" Errors

```bash
# Check build logs in Render Dashboard
# Common issues:
# 1. Missing environment variables
# 2. TypeScript compilation errors
# 3. Missing dependencies in package.json
```

### "Cannot connect to backend"

1. Verify `VITE_API_URL` includes `/api` suffix
2. Check `CORS_ORIGIN` includes frontend URL
3. Ensure backend service is running (not sleeping)

### Emails Not Sending

1. Check SMTP credentials in environment variables
2. For Gmail: Use App Password, not regular password
3. Check backend logs in Render Dashboard

### MongoDB Connection Failed

1. Whitelist Render IPs in MongoDB Atlas Network Access
2. Verify connection string format
3. Check database user credentials

---

## 💰 Upgrading from Free Tier

For production with better performance:

| Plan | Price | RAM | CPU | Features |
|------|-------|-----|-----|----------|
| **Starter** | $7/mo | 512MB | 0.5 | No sleeping |
| **Standard** | $25/mo | 2GB | 1 | Higher performance |
| **Pro** | $85/mo | 4GB | 2 | Professional grade |

---

## 📁 File Summary for Render

```
exam-attendance-tracking/
├── backend/
│   └── Dockerfile          ✅ Used by Render
├── frontend/
│   └── ...                 ✅ Built by Render
├── render.yaml             ✅ Optional: Blueprint config
└── RENDER_DEPLOYMENT.md    ✅ This guide
```

---

## 🆚 Render vs Self-Hosted Docker

| Feature | Render | Self-Hosted |
|---------|--------|-------------|
| **Setup** | Very easy | More complex |
| **Cost** | Free tier available | Pay for server |
| **Maintenance** | Managed by Render | You manage |
| **Custom Domain** | Easy SSL | Manual SSL setup |
| **Scalability** | One-click | Manual configuration |
| **Sleep (free)** | Yes (15 min) | No |

---

**Happy Deploying on Render! 🎉**