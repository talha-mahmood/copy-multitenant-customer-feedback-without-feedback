#!/bin/bash

# Quick Deployment Script (SSH with password prompt)
# This is a simpler version that prompts for password

SERVER_USER="root"
SERVER_HOST="31.97.66.103"
APP_NAME="customer-feedback-backend"
APP_DIR="/var/www/$APP_NAME"
APP_PORT=8000

echo "======================================"
echo "NestJS Backend Deployment to Hostinger"
echo "======================================"
echo ""
echo "Server: $SERVER_HOST"
echo "App Directory: $APP_DIR"
echo "App Port: $APP_PORT"
echo ""
echo "This script will deploy your application to the server."
echo "You will be prompted for the SSH password multiple times."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Build locally
echo ""
echo "[1/5] Building application locally..."
npm run build

# Create deployment package
echo ""
echo "[2/5] Creating deployment package..."
tar -czf deploy.tar.gz \
    dist/ \
    node_modules/ \
    package*.json \
    ecosystem.config.js \
    .env.example

# Copy to server
echo ""
echo "[3/5] Copying files to server..."
echo "Password: #uS(Mbog(rJWFERBEDR6"
scp deploy.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# Execute deployment commands on server
echo ""
echo "[4/5] Deploying on server..."
ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
    # Variables
    APP_NAME="customer-feedback-backend"
    APP_DIR="/var/www/$APP_NAME"
    
    # Create directory
    mkdir -p $APP_DIR
    
    # Extract files
    cd $APP_DIR
    tar -xzf /tmp/deploy.tar.gz
    rm /tmp/deploy.tar.gz
    
    # Create .env if not exists
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "⚠️  Please update .env file with production values"
    fi
    
    # Install PM2 if not installed
    npm list -g pm2 || npm install -g pm2
    
    # Restart or start application
    pm2 delete $APP_NAME 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    
    echo "✅ Deployment completed!"
    pm2 status
ENDSSH

echo ""
echo "[5/5] Cleaning up..."
rm deploy.tar.gz

echo ""
echo "======================================"
echo "✅ Deployment Successful!"
echo "======================================"
echo ""
echo "Your application is running at:"
echo "  http://$SERVER_HOST:$APP_PORT"
echo ""
echo "Next steps:"
echo "1. SSH into server: ssh $SERVER_USER@$SERVER_HOST"
echo "2. Update .env file: nano $APP_DIR/.env"
echo "3. Run migrations: cd $APP_DIR && npm run migration:run"
echo "4. Run seeders: npm run seed"
echo "5. Restart app: pm2 restart $APP_NAME"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check app status"
echo "  pm2 logs $APP_NAME      - View logs"
echo "  pm2 restart $APP_NAME   - Restart app"
