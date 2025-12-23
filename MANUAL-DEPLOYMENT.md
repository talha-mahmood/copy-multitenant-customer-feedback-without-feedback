# Manual Deployment Guide - Git-Based Workflow

This guide covers manual deployment to your Hostinger server using Git. This method is ideal for ongoing updates and gives you full control over each step.

## Prerequisites

Before starting, you need:
- Git repository (GitHub, GitLab, Bitbucket, etc.)
- Your code pushed to the repository
- SSH access to your server

## Server Details
- **IP**: 31.97.66.103
- **User**: root
- **Password**: #uS(Mbog(rJWFERBEDR6
- **App Directory**: /var/www/customer-feedback-backend
- **App Port**: 8000

---

## Part 1: Initial Server Setup (One-Time Only)

### Step 1: Connect to Your Server

```bash
ssh root@31.97.66.103
# Enter password when prompted: #uS(Mbog(rJWFERBEDR6
```

### Step 2: Update System Packages

```bash
apt-get update
apt-get upgrade -y
```

### Step 3: Install Node.js 20.x

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js
apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 4: Install Git

```bash
apt-get install -y git

# Verify installation
git --version
```

### Step 5: Install PostgreSQL

```bash
# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Check status
systemctl status postgresql
```

### Step 6: Create PostgreSQL Database and User

```bash
# Switch to postgres user and open PostgreSQL prompt
sudo -u postgres psql
```

Inside the PostgreSQL prompt, run:
```sql
-- Create database
CREATE DATABASE customer_feedback;

-- Create user with password
CREATE USER feedback_user WITH PASSWORD 'YourSecurePassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE customer_feedback TO feedback_user;

-- Make user owner of database
ALTER DATABASE customer_feedback OWNER TO feedback_user;

-- Grant schema permissions (PostgreSQL 15+)
\c customer_feedback
GRANT ALL ON SCHEMA public TO feedback_user;

-- Exit
\q
```

Test the database connection:
```bash
psql -h 127.0.0.1 -U feedback_user -d customer_feedback
# Enter password: YourSecurePassword123!
# If successful, you'll see the PostgreSQL prompt
# Type \q to exit
```

### Step 7: Install PM2 Process Manager

```bash
npm install -g pm2

# Verify installation
pm2 --version
```

### Step 8: Create Application Directory

```bash
mkdir -p /var/www/customer-feedback-backend
cd /var/www/customer-feedback-backend
```

### Step 9: Set Up Git Repository

**Option A: Using HTTPS (easier, but requires password/token)**
```bash
cd /var/www/customer-feedback-backend
git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

**Option B: Using SSH (recommended for frequent updates)**
```bash
# Generate SSH key on server
ssh-keygen -t ed25519 -C "root@31.97.66.103"
# Press Enter for all prompts (use default location, no passphrase)

# Display the public key
cat ~/.ssh/id_ed25519.pub

# Copy this key and add it to your Git provider:
# GitHub: Settings → SSH and GPG keys → New SSH key
# GitLab: Settings → SSH Keys
# Bitbucket: Settings → SSH keys

# Clone repository
cd /var/www
git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git customer-feedback-backend
cd customer-feedback-backend
```

### Step 10: Initial Git Pull

```bash
cd /var/www/customer-feedback-backend
git pull origin main  # or 'master' depending on your branch name
```

If using HTTPS, you'll be prompted for credentials.

### Step 11: Install Dependencies

```bash
npm install
```

### Step 12: Create Environment File

```bash
nano .env
```

Paste this configuration and **update with your actual values**:

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
 
# AWS S3 Configurations - UPDATE THESE
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_actual_access_key
AWS_SECRET_ACCESS_KEY=your_actual_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
 
# Mail Configurations - UPDATE THESE
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_FROM_ADDRESS=your_email@gmail.com
MAIL_FROM_NAME="Customer Feedback System"
MAIL_SECURE=false
 
# Encryption keys - GENERATE THESE
ENCRYPTION_KEY=
ENCRYPTION_SALT=
 
# WhatsApp Configuration - UPDATE THESE
WHATSAPP_API_URL="https://graph.facebook.com/v22.0/"
WHATSAPP_TOKEN="your_whatsapp_business_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="your_webhook_verify_token"
```

**Generate encryption keys:**
```bash
# Generate 32-byte encryption key
openssl rand -hex 32

# Generate 16-byte encryption salt
openssl rand -hex 16
```

Copy these values into your `.env` file.

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Step 13: Build the Application

```bash
npm run build
```

This creates the `dist/` directory with compiled JavaScript.

### Step 14: Run Database Migrations

```bash
npm run migration:run
```

You should see output showing each migration being executed.

### Step 15: Run Database Seeders

```bash
npm run seed
```

This populates the database with initial data (admin user, merchants, credit packages, etc.).

### Step 16: Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

Paste this:
```javascript
module.exports = {
  apps: [
    {
      name: 'customer-feedback-backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
    },
  ],
};
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Step 17: Create Logs Directory

```bash
mkdir -p logs
```

### Step 18: Start Application with PM2

```bash
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Set up PM2 to start on system boot
pm2 startup systemd
# Copy and run the command that PM2 outputs
```

### Step 19: Check Application Status

```bash
pm2 status
pm2 logs customer-feedback-backend
```

Your application should now be running on port 8000!

### Step 20: Install and Configure Nginx (Optional but Recommended)

```bash
# Install Nginx
apt-get install -y nginx

# Create Nginx configuration
nano /etc/nginx/sites-available/customer-feedback-backend
nano /etc/nginx/sites-available/qr-review.mustservices.io

```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name 31.97.66.103;
    
    client_max_body_size 50M;
    
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Save and exit, then:
```bash
# Enable the site
ln -s /etc/nginx/sites-available/customer-feedback-backend /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/qr-review.mustservices.io /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

# Check status
systemctl status nginx
```

### Step 21: Configure Firewall

```bash
# Allow SSH (important - don't lock yourself out!)
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS (for future SSL)
ufw allow 443/tcp

# Allow direct app access (optional)
ufw allow 8000/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

### Step 22: Test Your Application

```bash
# Test direct access
curl http://localhost:8000

# Test via Nginx
curl http://31.97.66.103
```

Or open in your browser:
- **Via Nginx**: http://31.97.66.103
- **Direct**: http://31.97.66.103:8000
- **API Docs**: http://31.97.66.103/api

---

## Part 2: Updating Your Application (Regular Workflow)

When you have new changes to deploy:

### Step 1: Push Changes to Git

On your **local machine**:
```bash
# Commit your changes
git add .
git commit -m "Your commit message"

# Push to repository
git push origin main
```

### Step 2: Connect to Server

```bash
ssh root@31.97.66.103
```

### Step 3: Navigate to Application Directory

```bash
cd /var/www/customer-feedback-backend
```

### Step 4: Pull Latest Changes

```bash
git pull origin main
```

If you have local changes that conflict:
```bash
# Stash local changes
git stash

# Pull updates
git pull origin main

# Apply stashed changes (optional)
git stash pop
```

### Step 5: Install New Dependencies (if package.json changed)

```bash
npm install
```

### Step 6: Build the Application

```bash
npm run build
```

### Step 7: Run New Migrations (if any)

```bash
npm run migration:run
```

To check which migrations will run:
```bash
# List pending migrations
npm run typeorm migration:show
```

### Step 8: Run New Seeders (if needed)

```bash
npm run seed
```

### Step 9: Restart the Application

```bash
pm2 restart customer-feedback-backend
```

### Step 10: Check Status

```bash
# Check if app is running
pm2 status

# View logs
pm2 logs customer-feedback-backend --lines 50

# Real-time monitoring
pm2 monit
```

### Step 11: Test the Application

```bash
# Test endpoint
curl http://localhost:8000

# Check logs for errors
pm2 logs customer-feedback-backend
```

---

## Quick Reference Commands

### Git Commands
```bash
# Check current status
git status

# Pull latest changes
git pull origin main

# View commit history
git log --oneline -10

# Check which branch you're on
git branch

# Switch branch
git checkout branch-name

# Discard local changes
git reset --hard origin/main
```

### PM2 Commands
```bash
# Check status
pm2 status

# View logs (last 100 lines)
pm2 logs customer-feedback-backend --lines 100

# View only error logs
pm2 logs customer-feedback-backend --err

# Real-time logs
pm2 logs customer-feedback-backend --raw

# Restart application
pm2 restart customer-feedback-backend

# Stop application
pm2 stop customer-feedback-backend

# Start application
pm2 start customer-feedback-backend

# Reload (zero-downtime restart)
pm2 reload customer-feedback-backend

# Delete from PM2
pm2 delete customer-feedback-backend

# Monitor CPU/Memory in real-time
pm2 monit

# Show detailed info
pm2 info customer-feedback-backend
```

### Database Commands
```bash
# Connect to database
psql -h 127.0.0.1 -U feedback_user -d customer_feedback

# List all tables
\dt

# Describe a table
\d table_name

# Exit
\q

# Create database backup
pg_dump -h 127.0.0.1 -U feedback_user customer_feedback > backup.sql

# Restore database
psql -h 127.0.0.1 -U feedback_user customer_feedback < backup.sql
```

### Nginx Commands
```bash
# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Reload Nginx (without downtime)
systemctl reload nginx

# Check status
systemctl status nginx

# View error logs
tail -f /var/log/nginx/error.log

# View access logs
tail -f /var/log/nginx/access.log
```

### System Commands
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU and processes
htop  # or 'top' if htop not installed

# Check which process is using a port
netstat -tulpn | grep 8000
# or
lsof -i :8000

# Check system logs
journalctl -xe

# Reboot server (use with caution!)
reboot
```

---

## Troubleshooting

### Application Won't Start

**Check PM2 logs:**
```bash
pm2 logs customer-feedback-backend --lines 200
```

**Common issues:**
- Port already in use: `lsof -i :8000` then `kill -9 PID`
- Environment variables missing: Check `.env` file
- Database connection failed: Test with `psql -h 127.0.0.1 -U feedback_user -d customer_feedback`

### Database Connection Errors

**Check PostgreSQL is running:**
```bash
systemctl status postgresql
```

**Check credentials:**
```bash
# Try connecting manually
psql -h 127.0.0.1 -U feedback_user -d customer_feedback
```

**Check PostgreSQL logs:**
```bash
tail -f /var/log/postgresql/postgresql-*-main.log
```

### Migration Errors

**Check migration status:**
```bash
cd /var/www/customer-feedback-backend
npm run typeorm migration:show
```

**Reset migrations (⚠️ DANGER - drops all data):**
```bash
npm run migration:fresh
npm run migration:run
npm run seed
```

**Revert last migration:**
```bash
npm run migration:revert
```

### Git Pull Conflicts

**Discard all local changes:**
```bash
git fetch origin
git reset --hard origin/main
```

**Keep local changes:**
```bash
git stash
git pull origin main
git stash pop
```

### Nginx Not Working

**Check configuration:**
```bash
nginx -t
```

**Check if Nginx is running:**
```bash
systemctl status nginx
```

**Restart Nginx:**
```bash
systemctl restart nginx
```

**Check error logs:**
```bash
tail -f /var/log/nginx/error.log
```

### Port Already in Use

**Find process using port 8000:**
```bash
lsof -i :8000
```

**Kill the process:**
```bash
kill -9 PID  # Replace PID with actual process ID
```

### Out of Memory

**Check memory usage:**
```bash
free -h
pm2 monit
```

**Restart application:**
```bash
pm2 restart customer-feedback-backend
```

**Clear PM2 logs:**
```bash
pm2 flush
```

---

## Database Backup & Restore

### Create Backup

**Manual backup:**
```bash
# Create backup directory
mkdir -p /var/backups/postgres

# Create backup
pg_dump -h 127.0.0.1 -U feedback_user customer_feedback > /var/backups/postgres/backup_$(date +%Y%m%d_%H%M%S).sql
```

**Automated daily backup:**
```bash
# Create backup script
nano /root/backup-db.sh
```

Add this content:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
sudo -u postgres pg_dump customer_feedback > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

Make executable:
```bash
chmod +x /root/backup-db.sh
```

Add to crontab:
```bash
crontab -e
```

Add this line (runs daily at 2 AM):
```
0 2 * * * /root/backup-db.sh >> /var/log/db-backup.log 2>&1
```

### Restore Backup

```bash
# Restore from backup file
psql -h 127.0.0.1 -U feedback_user customer_feedback < /var/backups/postgres/backup_20250122_020000.sql

# If backup is compressed
gunzip -c /var/backups/postgres/backup_20250122_020000.sql.gz | psql -h 127.0.0.1 -U feedback_user customer_feedback
```

---

## Security Best Practices

### 1. Change Default Passwords

```bash
# Change root password
passwd

# Change PostgreSQL password
sudo -u postgres psql
ALTER USER feedback_user WITH PASSWORD 'NewSecurePassword123!';
\q
```

Update `.env` with new password.

### 2. Set Up SSH Key Authentication

**On your local machine:**
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519

# Copy public key to server
ssh-copy-id root@31.97.66.103
```

**On server:**
```bash
# Disable password authentication
nano /etc/ssh/sshd_config
```

Change these lines:
```
PasswordAuthentication no
PermitRootLogin prohibit-password
```

Restart SSH:
```bash
systemctl restart sshd
```

### 3. Install Fail2Ban

```bash
apt-get install -y fail2ban

# Start and enable
systemctl start fail2ban
systemctl enable fail2ban

# Check status
fail2ban-client status
```

### 4. Keep System Updated

```bash
# Regular updates
apt-get update
apt-get upgrade -y

# Enable automatic security updates
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 5. Set Up SSL Certificate (If you have a domain)

```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
certbot renew --dry-run
```

---

## Monitoring & Logs

### Application Logs
```bash
# PM2 logs
pm2 logs customer-feedback-backend

# Application error logs
tail -f /var/www/customer-feedback-backend/logs/pm2-error.log

# Application output logs
tail -f /var/www/customer-feedback-backend/logs/pm2-out.log
```

### System Logs
```bash
# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*-main.log

# System logs
journalctl -f
```

### Performance Monitoring
```bash
# Real-time process monitoring
pm2 monit

# System resource usage
htop

# Network connections
netstat -tuln

# Disk I/O
iostat -x 1
```

---

## Summary: Complete Update Workflow

Here's your standard deployment workflow in a single command sequence:

```bash
# On local machine
git add .
git commit -m "Your changes"
git push origin main

# On server
ssh root@31.97.66.103
cd /var/www/customer-feedback-backend
git pull origin main
npm install
npm run build
npm run migration:run
pm2 restart customer-feedback-backend
pm2 logs customer-feedback-backend --lines 50
```

That's it! Your application is now updated and running.

---

## Need Help?

If you encounter issues:

1. **Check application logs**: `pm2 logs customer-feedback-backend`
2. **Check Nginx logs**: `tail -f /var/log/nginx/error.log`
3. **Check database connection**: `psql -h 127.0.0.1 -U feedback_user -d customer_feedback`
4. **Verify services are running**:
   - `pm2 status`
   - `systemctl status nginx`
   - `systemctl status postgresql`
5. **Test the endpoint**: `curl http://localhost:8000`

For more details, refer to the automated deployment guide in [DEPLOYMENT.md](DEPLOYMENT.md).
