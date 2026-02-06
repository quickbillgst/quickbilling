# Forgot Password Feature

## Overview
Complete password reset functionality has been implemented with secure token-based authentication.

## Features

### 1. **Forgot Password Page** (`/forgot-password`)
- User enters their email address
- System generates a secure reset token
- Success message shown (doesn't reveal if email exists for security)
- Reset link logged to console in development mode

### 2. **Reset Password Page** (`/reset-password?token=xxx`)
- Validates reset token on page load
- Shows error if token is invalid or expired
- Allows user to set new password
- Password must be at least 8 characters
- Shows success message and redirects to login

### 3. **Security Features**
- Tokens are cryptographically secure (32 bytes random)
- Tokens expire after 1 hour
- Tokens can only be used once
- Old tokens are automatically deleted when new ones are created
- Email enumeration prevention (same response for existing/non-existing emails)
- Expired tokens are auto-deleted from database after 24 hours

## API Endpoints

### POST `/api/auth/forgot-password`
Request password reset for an email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent.",
  "resetUrl": "http://localhost:3000/reset-password?token=..." // Only in development
}
```

### GET `/api/auth/verify-reset-token?token=xxx`
Verify if a reset token is valid.

**Response:**
```json
{
  "success": true,
  "valid": true
}
```

### POST `/api/auth/reset-password`
Reset password using a valid token.

**Request:**
```json
{
  "token": "abc123...",
  "password": "NewPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

## Database Schema

### PasswordReset Model
```typescript
{
  userId: ObjectId,        // Reference to User
  token: String,           // Unique reset token
  expiresAt: Date,         // Expiration timestamp (1 hour)
  used: Boolean,           // Whether token has been used
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-generated
}
```

## User Flow

1. **User clicks "Forgot password?" on login page**
   - Redirects to `/forgot-password`

2. **User enters email and submits**
   - System generates reset token
   - Reset link logged to console (in development)
   - Success message shown

3. **User clicks reset link from console/email**
   - Opens `/reset-password?token=xxx`
   - Token is verified
   - If valid, password reset form is shown
   - If invalid/expired, error message with option to request new link

4. **User enters new password**
   - Password is validated (min 8 characters)
   - Token is marked as used
   - User's password is updated
   - Success message shown
   - Auto-redirect to login after 3 seconds

5. **User logs in with new password**
   - Old password no longer works
   - New password works successfully

## Testing

Run the test script:
```bash
node scripts/test-forgot-password.mjs
```

This tests:
- ✅ User registration
- ✅ Password reset request
- ✅ Token verification
- ✅ Password reset
- ✅ Login with old password (fails)
- ✅ Login with new password (succeeds)
- ✅ Token reuse prevention
- ✅ Invalid token handling
- ✅ Non-existent email handling

## Development Notes

### Email Integration (TODO)
Currently, reset links are logged to the console. To integrate email:

1. Install email service (e.g., nodemailer, sendgrid, resend)
2. Add email credentials to `.env`:
   ```
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-password
   ```
3. Uncomment and implement email sending in `/api/auth/forgot-password/route.ts`

### Production Considerations
- Set `NEXT_PUBLIC_APP_URL` in production environment
- Remove `resetUrl` from API response in production
- Configure proper email service
- Monitor reset token usage for abuse
- Consider rate limiting on forgot password endpoint

## Files Created/Modified

**New Files:**
- `app/(auth)/forgot-password/page.tsx` - Forgot password form
- `app/(auth)/reset-password/page.tsx` - Reset password form
- `app/api/auth/forgot-password/route.ts` - Generate reset token
- `app/api/auth/verify-reset-token/route.ts` - Verify token validity
- `app/api/auth/reset-password/route.ts` - Reset password
- `scripts/test-forgot-password.mjs` - Test script

**Modified Files:**
- `lib/models.ts` - Added PasswordReset schema
- `app/(auth)/login/page.tsx` - Already had "Forgot password?" link

## UI/UX Features

- ✨ Smooth animations and transitions
- 🎨 Professional design matching existing auth pages
- 📱 Fully responsive
- ♿ Accessible with proper labels and ARIA attributes
- 🔒 Password visibility toggle
- ✅ Real-time form validation
- 🎯 Clear error messages
- 🎉 Success states with visual feedback
- ⏱️ Auto-redirect after success
