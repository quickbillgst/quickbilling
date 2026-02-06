# Authentication Troubleshooting Guide

## Common Registration Issues

### Issue 1: "Email already registered" on First Registration

**Symptoms:**
- Registration fails with "Email already registered"
- You've never created an account before
- First time trying to use the application

**Root Causes:**

1. **MongoDB Unique Index Persists** - Even if database was cleared, the unique index on email field remains
2. **Development Database Reuse** - Using same MongoDB instance with old data
3. **Previous Registration Test** - Email was used in a previous test

**Solutions:**

**Option A: Use Different Email (Quick Fix)**
```
Use a different email address for registration:
- test@example.com → test2@example.com
- john@company.com → john.dev@company.com
```

**Option B: Clear MongoDB Indexes (Permanent Fix)**
```
// In MongoDB directly via compass or Atlas UI:
1. Go to your database
2. Find the "users" collection
3. Go to Indexes tab
4. Delete the "email_1" unique index
5. Try registration again
```

**Option C: Clear Entire Database (Complete Reset)**
```
// Only use if you want to start fresh:
1. In MongoDB Atlas or Compass
2. Delete the entire "gst-billing" database
3. Restart the application
4. Register with your email
```

**Option D: Use New Database URI**
```
// Create a new MongoDB cluster or database:
1. Create new MongoDB cluster
2. Update MONGODB_URI in Vercel environment variables
3. Redeploy the application
```

---

## Common Login Issues

### Issue 2: "Illegal arguments: string, undefined" during Login

**Symptoms:**
- Login fails with error: "Illegal arguments: string, undefined"
- Registration works fine
- After successful registration, can't login

**Root Causes:**

1. **Missing JWT_SECRET** - JWT_SECRET environment variable not set in Vercel
2. **JWT_SECRET is Empty** - Variable set but with no value
3. **Build Time vs Runtime** - JWT validation failing at runtime

**Solutions:**

**Step 1: Verify JWT_SECRET is Set in Vercel**
```
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Look for "JWT_SECRET" variable
5. Confirm it has a value (not empty)
```

**Step 2: Generate New JWT_SECRET if Missing**
```
// Generate a secure random secret:

// Option A: Using OpenSSL (macOS/Linux)
openssl rand -base64 32

// Option B: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

// Option C: Using an online generator
https://randomkeygen.com/
(Copy one of the "Fort Knox Passwords")
```

**Step 3: Add JWT_SECRET to Vercel**
```
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Click "Add new"
5. Name: JWT_SECRET
6. Value: (paste the generated secret)
7. Select environments: Production, Preview, Development
8. Click "Save"
9. Redeploy your application
```

**Step 4: Check Deployment Logs**
```
1. Go to Vercel Dashboard
2. Click on a deployment
3. Go to "Logs" tab
4. Look for any JWT_SECRET errors
5. If you see errors, JWT_SECRET wasn't deployed
```

**Step 5: Test Login Again**
```
1. Wait for deployment to complete
2. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
3. Go to login page
4. Try logging in again
5. Check browser console for error details (F12 → Console)
```

---

## Prevention Checklist

Before Deploying to Production:

✓ Verify MONGODB_URI is set and correct  
✓ Verify JWT_SECRET is set with a strong random value  
✓ Test registration with a new email  
✓ Test login with registered credentials  
✓ Clear browser cache between tests  
✓ Check Vercel deployment logs for errors  
✓ Verify environment variables were deployed  

---

## Debug Tips

### 1. Check Browser Console
```
Press F12 → Console tab
- Look for [v0] messages
- Note the full error message
- Check network tab for API response
```

### 2. View API Response Details
```
Browser DevTools → Network tab:
1. Go to login page
2. Try to login
3. Find the request to /api/auth/login
4. Click it
5. Go to "Response" tab
6. Read the full error message
```

### 3. Check Environment Variables
```
// Verify in Vercel:
1. Vercel Dashboard → Project Settings
2. Environment Variables section
3. Check if JWT_SECRET and MONGODB_URI are there
4. Verify no typos
5. Click on variable to see if it's encrypted (good)
```

### 4. Test with Different Email
```
Registration emails to try:
- test123@example.com
- demo+1@test.com
- user.timestamp@company.com

Using unique emails helps identify if it's a duplicate issue
```

---

## Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "Email already registered" | Email exists in DB or index persists | Use different email or clear DB |
| "Illegal arguments: string, undefined" | JWT_SECRET not set | Add JWT_SECRET to env vars |
| "Invalid credentials" | Email/password mismatch | Check email and password |
| "MongoDB connection failed" | MONGODB_URI not set or invalid | Verify MONGODB_URI in env vars |
| "Missing required fields" | Form fields empty | Fill all required fields |
| "Registration failed" | Generic error | Check browser console for details |

---

## Quick Verification Checklist

Run this before asking for help:

```
[ ] MONGODB_URI set in Vercel environment variables
[ ] JWT_SECRET set in Vercel environment variables
[ ] Used a unique email for registration (never registered before)
[ ] Cleared browser cache
[ ] Waited 1-2 minutes after deploying
[ ] Checked Vercel deployment logs
[ ] Tried different email address if getting "already registered"
```

---

## Still Not Working?

**Gather this information:**
1. Full error message from browser console
2. Email address you're trying to register with
3. Screenshot of Vercel environment variables page
4. Deployment ID from Vercel (Deployments tab)
5. Steps you followed to generate JWT_SECRET

**Then share with support team for faster resolution.**
