# 🚀 Exam Attendance Tracking - Docker Deployment Guide

This guide will help you deploy the Exam Attendance Tracking application using Docker on a production server.

## 📋 Prerequisites

Before you begin, ensure you have:

- A server with Docker and Docker Compose installed
- Access to a MongoDB database (MongoDB Atlas recommended for production)
- SMTP credentials for email functionality (Gmail, SendGrid, etc.)
- SSH access to your server

### Installing Docker on Ubuntu/Debian

```bash
# Update package index
sudo apt update

# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to docker group (logout and login required)
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose --version
```

## 📁 Project Structure

```
exam-attendance-tracking/
├── backend/              # NestJS API
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/             # React + Vite App
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── docker-compose.yml    # Docker Compose configuration
├── .env.example          # Environment variables template
└── DEPLOYMENT.md         # This file
```

## 🚀 Deployment Steps

### Step 1: Clone the Repository on Your Server

```bash
# SSH into your server
ssh user@your-server-ip

# Clone the repository
git clone https://github.com/yourusername/exam-attendance-tracking.git
cd exam-attendance-tracking
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your actual values
nano .env
```

Fill in your environment variables:

```env
# MongoDB (use your Atlas connection string or local MongoDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/exam-tracking

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Examinations Office <your-email@gmail.com>

# IMPORTANT: Set this to your server's IP or domain
# For production server: http://your-server-ip:3000
VITE_API_URL=http://your-server-ip:3000
```

### Step 3: Build and Start the Containers

```bash
# Build and start all services in detached mode
docker compose up -d --build

# Or if using older Docker version:
# docker-compose up -d --build
```

This command will:
1. Build the backend Docker image (NestJS)
2. Build the frontend Docker image (React + Nginx)
3. Start both containers
4. Connect them to a private network

### Step 4: Verify the Deployment

```bash
# Check if containers are running
docker ps

# View logs
docker compose logs -f

# Check backend health
curl http://localhost:3000/health

# Test frontend
curl http://localhost
```

### Step 5: Access the Application

Once deployed, access your application at:

- **Frontend**: http://your-server-ip (port 80)
- **Backend API**: http://your-server-ip:3000

## 📊 Managing the Application

### Useful Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# Restart services
docker compose restart
docker compose restart backend

# Stop services
docker compose down

# Stop and remove volumes (⚠️ CAUTION: This removes data)
docker compose down -v

# Rebuild and restart
docker compose up -d --build

# Shell into a container
docker exec -it exam-tracking-backend sh
docker exec -it exam-tracking-frontend sh
```

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker compose up -d --build

# Or for zero-downtime deployment:
docker compose build
docker compose up -d
```

## 🔒 Security Considerations

### 1. Use a Reverse Proxy (Nginx/Caddy) with SSL

For production, use Nginx or Caddy as a reverse proxy with SSL certificates:

```nginx
# /etc/nginx/sites-available/exam-tracking
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Enable Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Optional: Allow backend port only from localhost
sudo ufw allow from 127.0.0.1 to any port 3000

# Enable firewall
sudo ufw enable
```

### 3. Use Strong JWT Secret

Generate a strong JWT secret:

```bash
openssl rand -base64 32
```

### 4. Regular Updates

```bash
# Update Docker images regularly
docker compose pull
docker compose up -d

# Update system packages
sudo apt update && sudo apt upgrade -y
```

## 🔧 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Check for port conflicts
sudo netstat -tulpn | grep 3000
sudo netstat -tulpn | grep 80
```

### MongoDB Connection Issues

```bash
# Test MongoDB connection from container
docker exec -it exam-tracking-backend sh
apk add mongodb-tools
mongosh "your-connection-string"
```

### Frontend Can't Connect to Backend

1. Check the `VITE_API_URL` environment variable is set correctly
2. Ensure backend container is healthy: `docker ps`
3. Check CORS settings in backend if accessing from different domain

### Email Not Sending

1. Verify SMTP credentials in `.env`
2. For Gmail, use an App Password (not your regular password)
3. Check backend logs: `docker compose logs backend`

## 📝 Environment Variable Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `PORT` | Backend server port (default: 3000) | No |
| `SMTP_HOST` | SMTP server hostname | Yes |
| `SMTP_PORT` | SMTP server port | Yes |
| `SMTP_USER` | SMTP username/email | Yes |
| `SMTP_PASS` | SMTP password/app password | Yes |
| `SMTP_FROM` | From email address | Yes |
| `VITE_API_URL` | Backend API URL for frontend | Yes |

## 🗄️ Database Seeding (Optional)

To seed the database with initial data:

```bash
# Run seeder from backend container
docker exec -it exam-tracking-backend sh
npm run seed
```

Or temporarily modify docker-compose.yml to run seeder on startup.

## 💾 Backup and Restore

### Backup MongoDB

```bash
# If using MongoDB Atlas, use their backup solutions
# For local MongoDB:
docker exec mongodb mongodump --out /data/backup/$(date +%Y%m%d)
docker cp mongodb:/data/backup ./backups
```

### Restore MongoDB

```bash
docker cp ./backups/20240101 mongodb:/data/backup
docker exec mongodb mongorestore /data/backup/20240101
```

## 📈 Monitoring (Optional)

Add to docker-compose.yml for monitoring:

```yaml
  # Prometheus for metrics
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  # Grafana for dashboards
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## 🤝 Support

For issues or questions:
1. Check the logs: `docker compose logs`
2. Verify environment variables: `cat .env`
3. Check container status: `docker ps -a`
4. Review this guide and the main README

---

**Happy Deploying! 🎉**