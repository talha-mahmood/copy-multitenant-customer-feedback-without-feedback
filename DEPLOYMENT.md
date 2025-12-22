# Deployment Guide - Hostinger Server

This guide explains how to deploy your NestJS Customer Feedback Backend to your Hostinger server.

## Server Details
- **IP**: 31.97.66.103
- **User**: root
- **Port**: 8000 (Application)
- **Port**: 80 (Nginx reverse proxy)

## Prerequisites

On your **local machine**, install:
```bash
# Install sshpass for automated SSH (macOS)
brew install sshpass

# Or for Linux
sudo apt-get install sshpass
```

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

1. **Make the deployment script executable:**
```bash
chmod +x deploy.sh
```

2. **Run the deployment script:**
```bash
./deploy.sh
```

This script will automatically:
- Install Node.js 20.x on the server
- Install PostgreSQL
- Set up the database and user
- Copy application files
- Create .env file
- Install dependencies
- Run migrations and seeders
- Start the application with PM2
- Configure Nginx as reverse proxy
- Set up firewall rules

### Method 2: Manual Deployment

If you prefer manual deployment, follow these steps:

#### 1. SSH into your server
```bash
ssh root@31.97.66.103
# Password: #uS(Mbog(rJWFERBEDR6
```

#### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version  # Should show v20.x
npm --version
```

#### 3. Install PostgreSQL
```bash
apt-get update
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

#### 4. Create Database
```bash
sudo -u postgres psql

# Inside PostgreSQL prompt:
CREATE DATABASE customer_feedback;
CREATE USER feedback_user WITH PASSWORD 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE customer_feedback TO feedback_user;
ALTER DATABASE customer_feedback OWNER TO feedback_user;
\q
```

#### 5. Install PM2 (Process Manager)
```bash
npm install -g pm2
```

#### 6. Create Application Directory
```bash
mkdir -p /var/www/customer-feedback-backend
cd /var/www/customer-feedback-backend
```

#### 7. Upload Your Code

**Option A: Using SCP from local machine**
```bash
# From your local project directory
scp -r ./ root@31.97.66.103:/var/www/customer-feedback-backend/
```

**Option B: Using Git (Recommended for updates)**
```bash
# On server
cd /var/www/customer-feedback-backend
git init
git remote add origin YOUR_GIT_REPOSITORY_URL
git pull origin main
```

#### 8. Create .env File
```bash
nano /var/www/customer-feedback-backend/.env
```

Copy this content and update with your actual credentials:
```env
#App Configurations
APP_NAME="Multitenant Customer Feedback System"
APP_ENV=production
APP_KEY=your-secure-app-key-here
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_PORT=8000
APP_URL=http://31.97.66.103
APP_FRONTEND_URL=http://31.97.66.103:3000
 
#DB Configurations
DB_CONNECTION=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=customer_feedback
DB_USERNAME=feedback_user
DB_PASSWORD=YourSecurePassword123!
 
# AWS S3 Configurations
AWS_REGION=your_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
 
# Mail Configurations
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM_ADDRESS=your_email@gmail.com
MAIL_FROM_NAME="Customer Feedback System"
MAIL_SECURE=false
 
# Encryption keys (generate with: openssl rand -hex 32 and openssl rand -hex 16)
ENCRYPTION_KEY=your-32-byte-hex-key
ENCRYPTION_SALT=your-16-byte-hex-salt
 
# WhatsApp Configuration
WHATSAPP_API_URL="https://graph.facebook.com/v22.0/"
WHATSAPP_TOKEN="your_whatsapp_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="your_webhook_token"
```

**Generate secure keys:**
```bash
# Generate ENCRYPTION_KEY (32 bytes)
openssl rand -hex 32

# Generate ENCRYPTION_SALT (16 bytes)
openssl rand -hex 16
```

#### 9. Install Dependencies
```bash
cd /var/www/customer-feedback-backend
npm install --production
```

#### 10. Build the Application
```bash
npm run build
```

#### 11. Run Migrations
```bash
npm run migration:run
```

#### 12. Run Seeders
```bash
npm run seed
```

#### 13. Start Application with PM2
```bash
pm2 start npm --name "customer-feedback-backend" -- run start:prod
pm2 save
pm2 startup systemd
```

#### 14. Install and Configure Nginx
```bash
apt-get install -y nginx

# Create Nginx configuration
nano /etc/nginx/sites-available/customer-feedback-backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name 31.97.66.103;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/customer-feedback-backend /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default site
nginx -t  # Test configuration
systemctl restart nginx
systemctl enable nginx
```

#### 15. Configure Firewall
```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS (for future SSL)
ufw allow 8000/tcp # Application (optional, if direct access needed)
ufw enable
```

## Post-Deployment

### Access Your Application
- **Main URL**: http://31.97.66.103
- **Direct API**: http://31.97.66.103:8000
- **API Docs**: http://31.97.66.103/api

### PM2 Management Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs customer-feedback-backend

# Restart application
pm2 restart customer-feedback-backend

# Stop application
pm2 stop customer-feedback-backend

# Monitor in real-time
pm2 monit
```

### Update Deployment
When you need to update your code:

```bash
ssh root@31.97.66.103
cd /var/www/customer-feedback-backend

# If using git
git pull origin main

# Or upload new files via SCP from local machine
# scp -r ./dist root@31.97.66.103:/var/www/customer-feedback-backend/

# Install new dependencies (if any)
npm install --production

# Build
npm run build

# Run new migrations (if any)
npm run migration:run

# Restart application
pm2 restart customer-feedback-backend
```

## SSL Certificate (Optional - Recommended for Production)

To add HTTPS support with Let's Encrypt:

```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain if you have one)
# certbot --nginx -d yourdomain.com

# For IP-only access, you'll need to purchase an SSL certificate
# or use a domain name with Let's Encrypt
```

## Troubleshooting

### Check Application Logs
```bash
pm2 logs customer-feedback-backend
```

### Check Nginx Logs
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Check PostgreSQL
```bash
systemctl status postgresql
sudo -u postgres psql -c "\l"  # List databases
```

### Restart Services
```bash
pm2 restart customer-feedback-backend
systemctl restart nginx
systemctl restart postgresql
```

### Database Connection Issues
```bash
# Check if PostgreSQL is listening
netstat -tuln | grep 5432

# Test connection
psql -h 127.0.0.1 -U feedback_user -d customer_feedback
```

## Monitoring

### Set up PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Check Server Resources
```bash
# CPU and Memory
htop

# Disk space
df -h

# Network
netstat -tuln
```

## Backup Strategy

### Database Backup
```bash
# Create backup script
nano /root/backup-db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump customer_feedback > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Make executable and add to cron:
```bash
chmod +x /root/backup-db.sh
crontab -e
# Add: 0 2 * * * /root/backup-db.sh  # Daily at 2 AM
```

## Security Recommendations

1. **Change default PostgreSQL password** immediately after deployment
2. **Set up SSH key authentication** and disable password login
3. **Enable fail2ban** to prevent brute force attacks
4. **Keep system updated**: `apt-get update && apt-get upgrade`
5. **Use environment-specific credentials** (don't use example passwords)
6. **Set up regular backups**
7. **Monitor logs regularly**
8. **Consider using a domain name** and enable HTTPS

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `/var/log/nginx/error.log`
3. Check application is running: `pm2 status`
4. Test database connection: `psql -h 127.0.0.1 -U feedback_user -d customer_feedback`
