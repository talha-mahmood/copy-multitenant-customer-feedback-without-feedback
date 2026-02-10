# Nginx Configuration for Serving Uploads

Add this location block to your nginx config at `/etc/nginx/sites-available/qr-review.mustservices.io`:

```nginx
server {
   server_name qr-review.mustservices.io;
   
   client_max_body_size 50M;

   # Serve static files from uploads directory (ADD THIS BLOCK)
   location /uploads/ {
       alias /var/www/qr-review/qr-review-backend/uploads/;
       expires 30d;
       add_header Cache-Control "public, immutable";
       access_log off;
   }

   # Backend REST API
   location /backend/api/ {
       proxy_pass http://localhost:8002/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_read_timeout 86400;
       proxy_send_timeout 86400;
       proxy_buffering off;
   }

   # ... rest of your config
}
```

## Steps to Apply:

1. **Edit your nginx configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/qr-review.mustservices.io
   ```

2. **Add the `/uploads/` location block BEFORE the `location /` block**

3. **Make sure the uploads directory exists and has proper permissions:**
   ```bash
   sudo mkdir -p /var/www/qr-review/qr-review-backend/uploads/statements
   sudo chown -R www-data:www-data /var/www/qr-review/qr-review-backend/uploads
   sudo chmod -R 755 /var/www/qr-review/qr-review-backend/uploads
   ```

4. **Test nginx configuration:**
   ```bash
   sudo nginx -t
   ```

5. **Reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

6. **Update your environment variable in `.env`:**
   ```
   APP_URL=https://qr-review.mustservices.io
   ```

7. **Restart your NestJS application:**
   ```bash
   pm2 restart all
   # OR if using npm
   npm run start:prod
   ```

## After Changes:

Your PDF URLs will now be:
```
https://qr-review.mustservices.io/uploads/statements/statement_agent_2_2026_2.pdf
```

Instead of:
```
https://qr-review.mustservices.io/var/www/qr-review/qr-review-backend/uploads/statements/statement_agent_2_2026_2.pdf
```

## Troubleshooting:

If you still get 502:
1. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
2. Verify file exists: `ls -la /var/www/qr-review/qr-review-backend/uploads/statements/`
3. Check permissions: The www-data user needs read access to the files
4. Verify APP_URL in your .env file is set correctly
