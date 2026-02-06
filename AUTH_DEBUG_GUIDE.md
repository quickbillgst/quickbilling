# Authentication Debug Guide

## Issue: "Registration failed" Error

### Root Causes Identified & Fixed

1. **Silent Error Handling** - Backend errors weren't being propagated to frontend
2. **Missing Error Details** - API responses didn't include error details
3. **Unclear Error Messages** - Frontend only showed generic "Registration failed"

### Fixes Applied

#### 1. Enhanced API Error Responses
- **Login Route** (`/app/api/auth/login/route.ts`): Now returns detailed error messages
- **Register Route** (`/app/api/auth/register/route.ts`): Now includes error details in response
- Both routes log errors with `[v0]` prefix for debugging

#### 2. Improved Auth Context
- **Login handler** (`/lib/auth-context.tsx`): Now extracts and throws detailed errors
- **Register handler**: Now captures error details from backend
- Both log errors to browser console for debugging

#### 3. Debug Logging
All errors are logged with `console.error('[v0] ...')` pattern for easy identification.

## Testing Registration

### Test Case 1: Valid Registration
```bash
# Expected: Success message, redirect to dashboard
POST /api/auth/register
{
  "businessName": "Test Business",
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "gstin": "29AACCC5055K1Z5"
}
```

### Test Case 2: Missing Required Fields
```bash
# Expected: 400 error with "Missing required fields"
POST /api/auth/register
{
  "businessName": "Test Business"
  # Missing email and password
}
```

### Test Case 3: Duplicate Email
```bash
# Expected: 409 error with "Email already registered"
# (if email already exists in database)
POST /api/auth/register
{
  "businessName": "Another Business",
  "email": "existing@example.com",
  "password": "password123"
}
```

## Testing Login

### Test Case 1: Valid Credentials
```bash
# Expected: Success message, redirect to dashboard
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}
```

### Test Case 2: Invalid Email
```bash
# Expected: 401 error with "Invalid credentials"
POST /api/auth/login
{
  "email": "nonexistent@example.com",
  "password": "password123"
}
```

### Test Case 3: Wrong Password
```bash
# Expected: 401 error with "Invalid credentials"
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "wrongpassword"
}
```

## Debugging Steps

### 1. Check Browser Console
- Open DevTools (F12)
- Look for `[v0]` messages
- These will show exactly what error occurred

### 2. Check Network Tab
- Go to Network tab in DevTools
- Attempt login/register
- Click the request to `/api/auth/login` or `/api/auth/register`
- Check Response tab for error details
- Common status codes:
  - `400`: Missing required fields
  - `409`: Email already registered
  - `401`: Invalid credentials
  - `500`: Server error (check server logs)

### 3. Check Server Logs
- If deployed on Vercel: Check deployment logs in Vercel dashboard
- If local development: Check terminal where `npm run dev` is running
- Look for messages starting with `[v0]`

### 4. Verify Environment Variables
Make sure these are set in Vercel/your environment:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret

## Common Error Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Registration failed | MongoDB connection error | Check MONGODB_URI env var |
| Registration failed | JWT_SECRET not set | Add JWT_SECRET env var |
| Email already registered | User exists | Use different email |
| Invalid credentials | Wrong password | Check password |
| Invalid credentials | User doesn't exist | Register first |

## Error Message Flow

```
User submits form
    ↓
Frontend calls /api/auth/{login|register}
    ↓
Backend processes request
    ↓
If error: Return { error: "...", details: "..." }
    ↓
Auth Context receives response
    ↓
Auth Context logs with [v0] prefix
    ↓
Auth Context throws error with details
    ↓
Page component catches and shows in toast
    ↓
User sees specific error message
```

## Next Steps

If you still see generic "Registration failed" error:

1. Open browser DevTools Console
2. Try registering or logging in
3. Copy the `[v0]` error message you see
4. Share that specific error message for more targeted debugging
