# Database Cleanup Guide

## Overview

This document explains how to remove dummy data from your MongoDB database after initial setup or testing.

## Issue: Seeing Dummy Data After Login

When you first log in, you might see existing invoices, payments, and reports that you didn't create. This happens because:

1. **Mock data in dashboard** - The dashboard page had hardcoded example data
2. **Dummy data in database** - Previous test accounts created sample data
3. **Database indexes** - Unique indexes on email persist even after deletion

## Solution 1: Cleanup Script (Recommended)

### Using Node.js Script

Run this command to completely clean your database:

```bash
npx ts-node scripts/cleanup-database.ts
```

**Requirements:**
- MONGODB_URI environment variable must be set
- Node.js installed locally

**What it does:**
- Connects to MongoDB
- Lists all collections
- Drops all collections (completely empties database)
- Safely disconnects

**Example output:**
```
Connecting to MongoDB...
Connected successfully

Dropping all collections...
Dropped collection: users
Dropped collection: invoices
Dropped collection: customers
Dropped collection: payments
...

Database cleanup completed successfully!
All dummy data has been removed.
```

### Setting Environment Variables for Script

On your local machine:

```bash
# Linux/Mac
export MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority"
npx ts-node scripts/cleanup-database.ts

# Windows (PowerShell)
$env:MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority"
npx ts-node scripts/cleanup-database.ts
```

## Solution 2: API Endpoint (For Deployed Apps)

### Cleanup Entire Database

```bash
curl -X POST https://your-app.vercel.app/api/admin/cleanup \
  -H "x-admin-key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Cleanup Specific Tenant Only

```bash
curl -X POST https://your-app.vercel.app/api/admin/cleanup \
  -H "x-admin-key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "targetTenantId": "your-tenant-id-here"
  }'
```

### Setting Admin Key

Add to your `.env.local` (local) or Vercel environment variables:

```
ADMIN_CLEANUP_KEY=your-secret-admin-key-here
```

### Success Response

```json
{
  "success": true,
  "message": "Database cleanup completed",
  "droppedCollections": 8
}
```

### Error Response

```json
{
  "error": "Unauthorized: Invalid admin key"
}
```

## Solution 3: MongoDB Atlas Console

### Manual Cleanup via MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Log in to your account
3. Select your cluster
4. Click "Collections"
5. For each collection:
   - Click the collection name
   - Click "Delete All Documents"
   - Confirm deletion

**Collections to clear:**
- `invoices`
- `payments`
- `customers`
- `products`
- `users`
- `tenants`
- `stockledgers`
- `batches`
- `auditlogs`

## Solution 4: Database Index Reset

If you still get "Email already registered" after cleanup:

### Via MongoDB Atlas

1. Go to your cluster → Collections
2. Click on `users` collection
3. Go to "Indexes" tab
4. Find the email index
5. Click delete
6. Recreate by running your app (indexes auto-create on first access)

### Via Mongo Shell

```javascript
use your_database_name

// Remove the email index
db.users.dropIndex("email_1")

// Remove all user indexes
db.users.dropIndexes()
```

## Verification

After cleanup, verify the database is empty:

1. Log in to MongoDB Atlas
2. Go to Collections
3. Each collection should show "No documents found"

Or query via Mongo Shell:

```javascript
use your_database_name
db.invoices.countDocuments()  // Should return 0
db.payments.countDocuments()  // Should return 0
db.customers.countDocuments() // Should return 0
```

## Fresh Start Procedure

1. **Clean database** - Use one of the methods above
2. **Clear browser storage** - Open DevTools → Application → Clear Site Data
3. **Log out and log back in** - Fresh session
4. **Create new account** - If using new email
5. **Verify empty dashboard** - Should show "No invoices found"

## Dashboard Mock Data

The dashboard page mock data has been removed. The dashboard now shows:
- Real statistics calculated from your actual data
- Real charts with real invoices and payments
- Empty states when no data exists

## Important Notes

⚠️ **Warning**: Database cleanup is permanent and cannot be undone.

- Always backup your data before running cleanup scripts
- Test in development/staging environment first
- Keep admin keys secure - don't share the cleanup endpoint
- For production, restrict cleanup access with strong authentication

## Troubleshooting

### "MONGODB_URI is not set"

```bash
# Set environment variable before running script
export MONGODB_URI="your-mongodb-connection-string"
npx ts-node scripts/cleanup-database.ts
```

### "Connection timeout"

- Check MongoDB connection string is correct
- Verify IP is whitelisted in MongoDB Atlas (Network Access)
- Check internet connection

### "Permission denied"

- Verify MongoDB user has required permissions
- Check username/password in connection string

### Email still shows as registered

```javascript
// Connect to MongoDB and remove indexes
db.users.dropIndex("email_1")
```

Then run cleanup and recreate account.

## Questions?

Refer to:
- `/docs/03-DATABASE-SCHEMA.md` - Database structure
- `/docs/07-TROUBLESHOOTING.md` - General troubleshooting
- `/AUTH_DEBUG_GUIDE.md` - Authentication issues
