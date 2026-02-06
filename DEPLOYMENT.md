# GST Billing Platform - Deployment Guide

This guide covers deployment to production environments and provides troubleshooting steps.

## Prerequisites

- Node.js 18+ (LTS)
- MongoDB 5.0+ (Atlas or self-hosted)
- Git for version control
- npm or yarn

## Local Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd gst-billing-system
npm install
```

### 2. Environment Configuration

Create `.env.local` with the following variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gst-billing

# Authentication
JWT_SECRET=your-secret-key-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: API Integrations
GSTIN_VERIFICATION_API_KEY=your-key
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
```

### 3. Start Development Server

```bash
npm run dev
```

Access the application at `http://localhost:3000`

### 4. MongoDB Setup (Local)

Using Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Or use MongoDB Atlas:
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user
3. Copy connection string to `MONGODB_URI`

## Deployment to Vercel

### 1. Connect Repository

```bash
# Push to GitHub/GitLab/Bitbucket
git push origin main

# Deploy to Vercel
npx vercel
```

### 2. Configure Environment Variables

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add all variables from `.env.local`
3. Ensure `MONGODB_URI` uses a production MongoDB Atlas cluster

### 3. Auto-Deploy

Set up automatic deployments:
- Every push to `main` branch triggers production deployment
- Vercel Preview for pull requests

## Deployment to Self-Hosted (AWS, DigitalOcean, Heroku)

### AWS EC2

```bash
# 1. SSH into your instance
ssh -i your-key.pem ec2-user@your-instance-ip

# 2. Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs

# 3. Clone repository
git clone <repository-url>
cd gst-billing-system
npm install

# 4. Build for production
npm run build

# 5. Start with PM2
sudo npm install -g pm2
pm2 start npm --name "gst-billing" -- start
pm2 startup
pm2 save

# 6. Configure nginx reverse proxy
sudo apt-get install nginx
# Edit /etc/nginx/sites-available/default to proxy to port 3000
sudo systemctl restart nginx
```

### DigitalOcean App Platform

```bash
# 1. Create app.yaml
cat > app.yaml << 'EOF'
name: gst-billing
services:
- name: web
  github:
    repo: your-username/gst-billing-system
    branch: main
  build_command: npm install && npm run build
  run_command: npm start
  envs:
  - key: MONGODB_URI
    value: mongodb+srv://...
  - key: JWT_SECRET
    value: your-secret
  http_port: 3000
EOF

# 2. Deploy
doctl apps create --spec app.yaml
```

### Heroku

```bash
# 1. Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 2. Login and create app
heroku login
heroku create gst-billing

# 3. Set environment variables
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your-secret

# 4. Deploy
git push heroku main

# 5. View logs
heroku logs --tail
```

## Database Optimization

### MongoDB Indexes

```javascript
// Create indexes in MongoDB for performance
db.tenants.createIndex({ email: 1 }, { unique: true })
db.invoices.createIndex({ tenantId: 1, createdAt: -1 })
db.invoices.createIndex({ invoiceNumber: 1 })
db.customers.createIndex({ tenantId: 1, gstin: 1 })
db.products.createIndex({ tenantId: 1, sku: 1 })
db.invoiceLineItems.createIndex({ invoiceId: 1 })
db.stockLedger.createIndex({ productId: 1, warehouseId: 1 })
```

### Connection Pool

Configure MongoDB connection pooling in `.env`:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db?maxPoolSize=10
```

## Performance Monitoring

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

Configure in `next.config.js`:

```javascript
const withSentryConfig = require('@sentry/nextjs/withSentryConfig');

module.exports = withSentryConfig(
  {
    // Your existing config
  },
  {
    org: 'your-org',
    project: 'gst-billing',
  }
);
```

### Logging

Use structured logging:

```typescript
// lib/logger.ts
export const log = (level: string, message: string, data?: any) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  }));
};
```

## Security Checklist

- [x] Use HTTPS/TLS in production
- [x] Set strong JWT secret (32+ characters)
- [x] Enable MongoDB authentication
- [x] Use environment variables for secrets
- [x] Set CORS properly for production domain
- [x] Enable rate limiting on APIs
- [x] Regular database backups
- [x] Keep dependencies updated

## Backup & Recovery

### MongoDB Atlas Automated Backups

1. Go to Database → Backup in Atlas console
2. Enable automated daily backups (default)
3. Configure retention period (30 days recommended)

### Manual Backup

```bash
# Export data
mongoexport --uri="mongodb+srv://..." --collection=invoices --out=backup.json

# Import data
mongoimport --uri="mongodb+srv://..." --collection=invoices --file=backup.json
```

## Scaling Strategies

### Horizontal Scaling

1. **Load Balancing**: Use AWS ELB or nginx
2. **Session Storage**: Switch from in-memory to Redis
3. **Caching**: Implement Redis for frequently accessed data

### Database Scaling

1. **Read Replicas**: Configure MongoDB replica sets
2. **Sharding**: Partition data by tenantId
3. **Archive**: Move old invoices to separate collections

## Troubleshooting

### High Memory Usage

```bash
# Check Node process memory
node --max-old-space-size=4096 npm start
```

### Database Connection Errors

```bash
# Test MongoDB connection
mongosh "mongodb+srv://..." --eval "db.adminCommand('ping')"
```

### API Response Slow

- Check MongoDB indexes
- Monitor API logs for slow queries
- Use connection pooling
- Consider adding caching layer

## Monitoring Checklist

- API response times (target: <200ms)
- Database query times (target: <50ms)
- Error rate (target: <1%)
- Memory usage (target: <80% of allocated)
- Disk space usage (maintain 20% free)
- Invoice creation success rate

## Support & Documentation

- API Documentation: `/api/docs`
- System Status: `/status`
- Logs: `/logs` (admin only)
- Support Portal: https://support.yourdomain.com

## Version Management

```bash
# Check Node version
node --version

# Update dependencies safely
npm update
npm audit fix

# Update to latest major versions
npm install --save next@latest react@latest
```

## Rollback Procedure

If deployment fails:

```bash
# Vercel
vercel rollback

# Git rollback
git revert <commit-hash>
git push origin main

# Manual restart with previous build
pm2 restart gst-billing
```

---

For questions or issues, contact support@yourdomain.com or create an issue in the repository.
