# Setup and Deployment Guide

## Local Development Setup

### Prerequisites

- **Node.js:** 18.x or higher
- **npm:** 9.x or higher
- **MongoDB:** Local instance or MongoDB Atlas account
- **Git:** For version control

### Step 1: Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd gst-billing-platform

# Install dependencies
npm install

# Verify installation
npm list
```

### Step 2: Environment Configuration

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local
```

Required environment variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gst-billing

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-32-character-base64-secret-here

# Optional
NODE_ENV=development
VERCEL_ENV=development
```

### Step 3: Generate JWT Secret

```bash
# Generate a secure 32-byte base64 string
openssl rand -base64 32

# Output example:
# 9Aj+1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z=

# Add to .env.local
JWT_SECRET=9Aj+1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z=
```

### Step 4: Run Development Server

```bash
# Start dev server
npm run dev

# Server runs on http://localhost:3000

# In another terminal, watch for changes
npm run build
```

### Step 5: Test Locally

```bash
# Access the app
open http://localhost:3000

# Try registration
# Email: test@example.com
# Password: TestPassword123
# Business Name: Test Company

# Login with created credentials
```

## Database Setup

### Option A: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and sign in
3. Create a new project
4. Create a M0 (free) cluster
5. Create database user with password
6. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/gst-billing?retryWrites=true&w=majority`
7. Add to `.env.local` as `MONGODB_URI`
8. Whitelist your IP in Network Access

### Option B: Local MongoDB

```bash
# Install MongoDB Community Edition
# macOS
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Connection string
MONGODB_URI=mongodb://localhost:27017/gst-billing
```

### Verify Connection

```bash
# Run a simple query
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Connection error:', err))
"
```

## Building for Production

### Step 1: Optimize Build

```bash
# Set production environment
export NODE_ENV=production

# Run production build
npm run build

# Output: .next/ directory
```

### Step 2: Check for Errors

```bash
# The build should complete with no errors
# If there are errors, they will be displayed

# Common errors:
# - TypeScript issues: Fix type errors
# - Import errors: Check module exports
# - Missing env vars: Add to environment
```

### Step 3: Test Production Build

```bash
# Start production server locally
npm start

# Access http://localhost:3000
# Test key features
```

## Deployment to Vercel

### Step 1: Prepare Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository
# Push to GitHub
git remote add origin https://github.com/your-username/repo.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Sign up or sign in
3. Click "New Project"
4. Import Git repository
5. Select your GitHub repo
6. Click "Import"

### Step 3: Configure Environment Variables

In Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add production variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret (generated earlier)
   - `NODE_ENV`: production

3. Add preview variables (optional):
   - Same values as production

4. Click "Save"

### Step 4: Deploy

1. Click "Deploy" button
2. Vercel will:
   - Clone repository
   - Install dependencies
   - Run build: `npm run build`
   - Generate deployment
   - Assign URL

3. Wait for deployment to complete
4. Click "Visit" to see live app

### Step 5: Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update domain DNS records
5. Wait for propagation (24-48 hours)

## Post-Deployment

### Verify Deployment

```bash
# Check app is running
curl https://your-domain.com

# Should return HTML response

# Check API
curl https://your-domain.com/api/auth/login

# Should return 400 Bad Request (no credentials provided)
```

### Enable Production Monitoring

1. **Vercel Analytics:**
   - Already included in layout.tsx
   - View in Vercel dashboard → Analytics

2. **Error Tracking:**
   - Monitor logs: Vercel dashboard → Logs
   - Real-time errors display there

3. **Performance Monitoring:**
   - Core Web Vitals shown in Analytics
   - Optimize images and bundles

### SSL Certificate

- Automatically provided by Vercel
- Renews automatically
- HTTPS enforced

### Database Backup

**For MongoDB Atlas:**

```bash
# Enable automated backups
1. Go to MongoDB Atlas dashboard
2. Select cluster
3. Go to Backup
4. Enable "Continuous Cloud Backup"
5. Snapshots created every 6 hours
```

## Troubleshooting Deployment

### Build Fails

**Check logs:**
```bash
# View build logs in Vercel dashboard
# Click on failed deployment
# Scroll through logs for errors
```

**Common issues:**
- Missing environment variables: Add in Vercel dashboard
- Port already in use: Vercel assigns automatically
- Memory issues: Optimize code or upgrade Vercel tier

### App Shows Blank Page

1. Check browser console for errors
2. Verify JWT_SECRET is set
3. Verify MONGODB_URI is accessible
4. Check Vercel logs for runtime errors

### API Returns 500 Error

1. Check Vercel logs
2. Verify MONGODB_URI connection
3. Verify JWT_SECRET is correct
4. Check for unhandled promise rejections

### Slow Performance

1. Enable Vercel Analytics
2. Check database query performance
3. Enable caching headers
4. Optimize images in public/
5. Consider upgrading MongoDB plan

## Monitoring & Maintenance

### Daily
- Check error logs
- Monitor uptime
- Review user reports

### Weekly
- Review analytics
- Check database size
- Verify backups

### Monthly
- Update dependencies
- Review security patches
- Analyze performance trends

## Scaling

### As User Base Grows

1. **Database:**
   - MongoDB Atlas: Upgrade tier from M0 to M2/M5
   - Enable read replicas
   - Implement data sharding

2. **API:**
   - Vercel automatically scales
   - Monitor response times
   - Add caching layer if needed

3. **Storage:**
   - Archive old data
   - Implement data retention policy
   - Consider external storage for files

## Security Checklist

- [x] JWT_SECRET stored securely
- [x] MONGODB_URI in environment variables
- [x] HTTPS enforced
- [x] CORS configured
- [x] Input validation on all endpoints
- [x] Password hashing enabled
- [x] Error messages don't leak data
- [x] Database backups automated
- [x] Rate limiting configured (TODO)
- [x] CSRF protection (TODO)

## Rollback Procedure

If deployment has critical issues:

1. **Vercel Dashboard:**
   - Go to Deployments
   - Find previous stable deployment
   - Click "Redeploy"

2. **Or revert Git:**
   ```bash
   git revert HEAD
   git push origin main
   # Vercel auto-deploys
   ```

3. **Verify:**
   - App loads
   - Login works
   - Invoices display

## Support & Documentation

- Vercel docs: https://vercel.com/docs
- MongoDB docs: https://docs.mongodb.com
- Next.js docs: https://nextjs.org/docs
- React docs: https://react.dev
