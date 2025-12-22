#!/bin/bash

# Deployment script for NestJS application to Hostinger server
# This script will:
# 1. SSH into the server
# 2. Set up the environment
# 3. Clone/update the repository
# 4. Install dependencies
# 5. Run migrations
# 6. Start the application with PM2

# Server credentials
SERVER_USER="root"
SERVER_HOST="31.97.66.103"
SERVER_PASSWORD="#uS(Mbog(rJWFERBEDR6"
APP_NAME="customer-feedback-backend"
APP_DIR="/var/www/$APP_NAME"
APP_PORT=8000

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment to Hostinger server...${NC}"

# Function to execute commands on remote server
remote_exec() {
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "$1"
}

# Function to copy files to remote server
remote_copy() {
    sshpass -p "$SERVER_PASSWORD" scp -r -o StrictHostKeyChecking=no "$1" $SERVER_USER@$SERVER_HOST:"$2"
}

echo -e "${YELLOW}Step 1: Checking server connection...${NC}"
remote_exec "echo 'Connection successful'"

echo -e "${YELLOW}Step 2: Installing Node.js (if not installed)...${NC}"
remote_exec "
    # Install Node.js 20.x
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    node --version
    npm --version
"

echo -e "${YELLOW}Step 3: Installing PostgreSQL (if not installed)...${NC}"
remote_exec "
    apt-get update
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
"

echo -e "${YELLOW}Step 4: Installing PM2 (if not installed)...${NC}"
remote_exec "npm install -g pm2"

echo -e "${YELLOW}Step 5: Setting up PostgreSQL database...${NC}"
remote_exec "
    sudo -u postgres psql -c \"CREATE DATABASE customer_feedback;\" || true
    sudo -u postgres psql -c \"CREATE USER feedback_user WITH PASSWORD 'YourSecurePassword123!';\" || true
    sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE customer_feedback TO feedback_user;\" || true
    sudo -u postgres psql -c \"ALTER DATABASE customer_feedback OWNER TO feedback_user;\" || true
"

echo -e "${YELLOW}Step 6: Creating application directory...${NC}"
remote_exec "mkdir -p $APP_DIR"

echo -e "${YELLOW}Step 7: Copying application files...${NC}"
# Build the application locally first
npm run build

# Copy files to server
remote_copy "./" "$APP_DIR/"

echo -e "${YELLOW}Step 8: Creating .env file on server...${NC}"
remote_exec "
cat > $APP_DIR/.env << 'EOF'
#App Configurations
APP_NAME=\"Multitenant Customer Feedback System\"
APP_ENV=production
APP_KEY=your-secure-app-key-here
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_PORT=$APP_PORT
APP_URL=http://$SERVER_HOST:$APP_PORT
APP_FRONTEND_URL=http://$SERVER_HOST:3000
 
#DB Configurations
DB_CONNECTION=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=customer_feedback
DB_USERNAME=feedback_user
DB_PASSWORD=YourSecurePassword123!
 
# AWS S3 Configurations (update with your credentials)
AWS_REGION=your_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
 
# Mail Configurations (update with your credentials)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM_ADDRESS=your_email@gmail.com
MAIL_FROM_NAME=\"Customer Feedback System\"
MAIL_SECURE=false
 
# Encryption keys (must be 32 bytes for key, 16 bytes for salt)
ENCRYPTION_KEY=$(openssl rand -hex 32)
ENCRYPTION_SALT=$(openssl rand -hex 16)
 
# WhatsApp Configuration (update with your credentials)
WHATSAPP_API_URL=\"https://graph.facebook.com/v22.0/\"
WHATSAPP_TOKEN=\"your_whatsapp_token\"
WHATSAPP_PHONE_NUMBER_ID=\"your_phone_number_id\"
WHATSAPP_WEBHOOK_VERIFY_TOKEN=\"your_webhook_token\"
EOF
"

echo -e "${YELLOW}Step 9: Installing dependencies on server...${NC}"
remote_exec "cd $APP_DIR && npm install --production"

echo -e "${YELLOW}Step 10: Running database migrations...${NC}"
remote_exec "cd $APP_DIR && npm run migration:run"

echo -e "${YELLOW}Step 11: Running database seeders...${NC}"
remote_exec "cd $APP_DIR && npm run seed"

echo -e "${YELLOW}Step 12: Setting up PM2...${NC}"
remote_exec "
cd $APP_DIR
pm2 delete $APP_NAME || true
pm2 start npm --name \"$APP_NAME\" -- run start:prod
pm2 save
pm2 startup systemd -u root --hp /root
"

echo -e "${YELLOW}Step 13: Setting up Nginx reverse proxy...${NC}"
remote_exec "
    apt-get install -y nginx
    
    cat > /etc/nginx/sites-available/$APP_NAME << 'NGINXEOF'
server {
    listen 80;
    server_name $SERVER_HOST;
    
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF
    
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl restart nginx
    systemctl enable nginx
"

echo -e "${YELLOW}Step 14: Setting up firewall...${NC}"
remote_exec "
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow $APP_PORT/tcp
    ufw --force enable
"

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application is now running at: http://$SERVER_HOST${NC}"
echo -e "${YELLOW}API Documentation: http://$SERVER_HOST/api${NC}"
echo ""
echo -e "${YELLOW}Useful PM2 commands:${NC}"
echo "  pm2 status            - Check application status"
echo "  pm2 logs $APP_NAME    - View application logs"
echo "  pm2 restart $APP_NAME - Restart application"
echo "  pm2 stop $APP_NAME    - Stop application"
