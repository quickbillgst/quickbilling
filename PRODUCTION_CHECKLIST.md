# Production Deployment Checklist

## ✅ Completed Fixes

### Security & Environment Variables
- [x] **JWT_SECRET** - Now validates at startup (line 6 in `/app/api/auth/login/route.ts`)
- [x] **MONGODB_URI** - Now validates at startup (line 3 in `/lib/db.ts`)
- [x] **Removed default fallback values** - All critical env vars now throw errors if missing
- [x] **Type-safe configuration** - Added proper TypeScript interfaces for auth responses

### Code Quality
- [x] **Removed all console.log statements** - Production-safe logging
- [x] **Removed [v0] debug logs** - Cleaned up from sync engine, POS layout, keyboard shortcuts
- [x] **Removed console.error debugging** - Only kept essential error handling
- [x] **Added proper error boundaries** - POS layout now gracefully handles DB init failures
- [x] **Type safety improvements** - Replaced `any` types with proper interfaces

### Client-Side Safety
- [x] **SSR-safe localStorage** - Added `typeof window` checks in auth context
- [x] **Proper error handling** - Auth context now safely catches and rethrows errors
- [x] **Type-safe JSON parsing** - Added type assertions for localStorage data

### Database & API
- [x] **Database connection caching** - Prevents connection leaks
- [x] **Error message clarity** - API errors now include context without exposing internals
- [x] **Proper type assertions** - Request bodies now type-checked

## 🔴 Required Before Deployment

### Environment Variables
You MUST set these in your Vercel project settings (Vars section):

```bash
# Critical (will crash if missing)
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_very_secure_random_secret_key_32_chars_min

# Optional but recommended
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

**How to set:**
1. Go to your Vercel project settings
2. Click "Environment Variables" in the sidebar
3. Add the above variables
4. Redeploy the application

### Security Review Checklist

- [ ] **JWT_SECRET changed from default** - Must be 32+ characters, truly random
- [ ] **MONGODB_URI points to production database** - Not localhost
- [ ] **API error messages sanitized** - Don't expose internal paths (currently fine)
- [ ] **CORS configured** - If needed for API calls
- [ ] **Rate limiting configured** - Recommended for auth endpoints
- [ ] **HTTPS enabled** - Vercel provides this by default

## 🚀 Deployment Steps

### 1. Set Environment Variables
```
MONGODB_URI: mongodb+srv://user:pass@cluster.mongodb.net/gst-billing
JWT_SECRET: $(openssl rand -base64 32)  # Generate secure random secret
```

### 2. Test Before Deploying
```bash
# Run type checking
npm run type-check

# Build the project
npm run build

# If using locally, set env vars first
export MONGODB_URI="..."
export JWT_SECRET="..."
npm start
```

### 3. Deploy to Vercel
- Push to GitHub branch connected to Vercel
- Or use Vercel CLI: `vercel deploy --prod`

### 4. Verify Deployment
After deployment, test:
- [ ] Login page loads without errors
- [ ] Can register a new account
- [ ] Can login with registered account
- [ ] Dashboard loads and renders properly
- [ ] Check browser console - should be clean (no errors)
- [ ] Check Vercel logs for any unhandled errors

## 📋 Performance Optimization

### Recommended Additions
1. **Database Indexes**
   ```javascript
   // Add to MongoDB
   db.users.createIndex({ email: 1 }, { unique: true })
   db.tenants.createIndex({ gstin: 1 }, { sparse: true, unique: true })
   ```

2. **Caching Headers** - Configure in `next.config.js`:
   ```javascript
   headers: [
     {
       source: '/api/:path*',
       headers: [
         { key: 'Cache-Control', value: 'no-cache' }
       ]
     }
   ]
   ```

3. **Rate Limiting** - Use middleware.ts:
   ```typescript
   // Recommended: use Upstash Redis for rate limiting
   ```

4. **Monitoring** - Set up error tracking:
   - [ ] Sentry integration
   - [ ] LogRocket
   - [ ] Vercel Analytics

## 🔐 Security Hardening

### Current Status: ✅ Safe
- Environment variables validated
- No hardcoded secrets
- No console.logs exposing sensitive data
- SSR-safe code
- Type-safe error handling

### Recommended Enhancements
1. **API Middleware** - Add request validation
2. **CSRF Protection** - Add tokens for form submissions
3. **Rate Limiting** - Prevent brute force attacks
4. **Audit Logging** - Log all admin actions
5. **Data Encryption** - Encrypt sensitive fields in DB

## 🧪 Testing Checklist

Before pushing to production:

### Authentication
- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Reject invalid credentials
- [ ] JWT token validates correctly
- [ ] Logout clears session
- [ ] Refresh page maintains session

### API Endpoints
- [ ] GET /api/invoices returns data
- [ ] POST /api/invoices/create saves data
- [ ] PUT/DELETE methods work
- [ ] Error responses are proper HTTP codes
- [ ] Unauthorized requests return 401

### Database
- [ ] Connection pooling works
- [ ] Queries complete in < 100ms
- [ ] No connection leaks on repeated requests
- [ ] Handles concurrent requests

### UI/UX
- [ ] All pages load without console errors
- [ ] Forms submit and handle errors
- [ ] POS system initializes in online mode if DB unavailable
- [ ] Responsive design works on mobile

## 📊 Monitoring & Alerts

### Set up after deployment
1. **Error Tracking** - Get notified of runtime errors
2. **Performance Monitoring** - Track page load times
3. **Database Monitoring** - MongoDB Atlas provides built-in monitoring
4. **Uptime Monitoring** - Use Vercel Analytics or Pingdom

## 🔄 Rollback Plan

If something breaks:
1. Revert the Git commit
2. Vercel will auto-redeploy from previous commit
3. Check error logs in Vercel dashboard
4. Fix issues locally and test before re-deploying

## ✨ Next Steps

1. **Set required environment variables** (MONGODB_URI, JWT_SECRET)
2. **Run `npm run build`** locally to verify no type errors
3. **Deploy to production** using Vercel dashboard or CLI
4. **Run verification tests** from checklist above
5. **Monitor logs** for first 24 hours after deployment
6. **Set up error tracking** for ongoing monitoring

---

**Last Updated:** February 3, 2026
**Status:** ✅ Production Ready (after env vars are set)
