# Troubleshooting Guide

## Common Issues and Solutions

### Authentication Issues

#### Registration Fails with "Registration failed"

**Symptoms:**
- Registration form shows generic error
- No account created

**Solutions:**

1. **Check MONGODB_URI:**
   ```bash
   # Verify env variable is set
   echo $MONGODB_URI
   
   # Should output: mongodb+srv://...
   ```

2. **Test database connection:**
   ```bash
   # Try connecting to MongoDB
   mongosh "mongodb+srv://..."
   
   # If fails, check:
   # - Connection string is correct
   # - Network access whitelist includes your IP
   # - Database user has correct password
   ```

3. **Check JWT_SECRET:**
   ```bash
   echo $JWT_SECRET
   
   # Should be 32+ characters
   # If empty, set: JWT_SECRET=$(openssl rand -base64 32)
   ```

4. **View detailed error:**
   - Open browser console (F12)
   - Go to Network tab
   - Check registration request response
   - Look for specific error message

5. **Check server logs:**
   ```bash
   # In development
   npm run dev
   # Look for console output with [v0] prefix
   
   # In production
   # Check Vercel dashboard → Logs
   ```

**Common Specific Errors:**
- "MongoDB connection failed": Database not accessible
- "Email already exists": Try different email
- "GSTIN format invalid": Enter valid 15-character GSTIN
- "JWT_SECRET not set": Add to environment variables

#### Login Returns "Invalid credentials"

**Symptoms:**
- Correct email but wrong password entered
- User account doesn't exist yet

**Solutions:**

1. **Verify account exists:**
   - Check email is registered
   - Use "Register" if new user

2. **Reset password:**
   - Currently no reset feature (TODO)
   - Contact admin to create new account

3. **Check email capitalization:**
   - Emails are case-insensitive in database
   - Try lowercase

#### JWT Token Errors

**Symptoms:**
- "Unauthorized" on API calls
- "Invalid token" messages

**Solutions:**

1. **Token expired:**
   - Tokens valid for 24 hours
   - Login again to get new token
   - Browser should auto-refresh (TODO)

2. **Token not sent:**
   - Check Authorization header in requests
   - Format: `Authorization: Bearer <token>`

3. **Corrupted token:**
   - Clear localStorage
   - Logout and login again

### Invoice & Transaction Issues

#### Invoice Shows Incorrect Tax

**Symptoms:**
- CGST/SGST/IGST amounts don't match expected
- Total amount wrong

**Solutions:**

1. **Check place of supply:**
   - Verify supplier state matches
   - Verify customer state entered
   - States must be 2-letter codes (e.g., "KA", "DL")

2. **Verify tax rates:**
   - Products must have correct HSN/SAC codes
   - Tax rates must be 5, 12, 18, or 28
   - Check product configuration

3. **Manual calculation:**
   ```
   Base Amount × (1 + Tax Rate ÷ 100) = Total
   
   Example:
   1000 × (1 + 18 ÷ 100) = 1180
   
   SGST = 1000 × 18% ÷ 2 = 90
   CGST = 1000 × 18% ÷ 2 = 90
   Total = 1000 + 90 + 90 = 1180
   ```

4. **For inter-state (IGST):**
   ```
   IGST = 1000 × 18% = 180
   Total = 1000 + 180 = 1180
   ```

#### Invoice Won't Save

**Symptoms:**
- Form submitted but invoice not created
- Error message or blank

**Solutions:**

1. **Validate form fields:**
   - Check all required fields filled:
     * Customer selected
     * Invoice date within reasonable range
     * At least one line item
     * Product quantity > 0

2. **Check customer exists:**
   ```bash
   # In browser console
   fetch('/api/customers', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   .then(r => r.json())
   .then(d => console.log(d))
   ```

3. **Check product exists:**
   ```bash
   # Similar to above, query /api/products
   ```

4. **Check database permissions:**
   - Verify user has "accountant" or "manager" role
   - Verify tenantId matches

#### Payment Recording Fails

**Symptoms:**
- Payment form shows error
- Amount not recorded

**Solutions:**

1. **Verify invoice exists:**
   - Invoice must be created before payment
   - Check invoice status is not "paid"

2. **Check amount:**
   - Amount must be > 0
   - Amount should not exceed invoice total (soft check)

3. **Verify payment date:**
   - Payment date should be <= today
   - Payment date should be >= invoice date

### Inventory Issues

#### Stock Shows Negative

**Symptoms:**
- Stock level shows negative number
- Inventory doesn't match physical count

**Solutions:**

1. **Review stock transactions:**
   ```bash
   # Check stock ledger in inventory page
   # Identify sale that caused negative
   ```

2. **Create adjustment:**
   - Use "Stock Adjustment"
   - Type: adjustment
   - Add correct quantity
   - Note reason

3. **Prevent future issues:**
   - Enable stock warnings before negative
   - Set minimum stock levels
   - Review before each sale

#### Batch Expires but Still in Stock

**Symptoms:**
- Expired batch shown as available
- Can still select in invoices

**Solutions:**

1. **Manual removal:**
   - Go to Inventory → Batches
   - Mark batch as "expired"
   - Create stock adjustment

2. **Automatic check:**
   - Future feature: Auto-remove expired batches
   - Currently requires manual action

### Reporting Issues

#### GSTR-1 Report Empty

**Symptoms:**
- Report shows 0 invoices
- No data even though invoices exist

**Solutions:**

1. **Check date range:**
   - Verify selected period is correct
   - Invoices must have invoiceDate within period

2. **Check invoices exist:**
   ```bash
   # Query invoices for period
   curl "https://domain/api/invoices/list?startDate=2024-02-01&endDate=2024-02-29" \
     -H "Authorization: Bearer <token>"
   ```

3. **Check invoice data:**
   - Invoices must have valid GSTIN/PAN
   - Invoices must have tax amounts populated

#### Cannot Export Report

**Symptoms:**
- Export button doesn't work
- Download doesn't start

**Solutions:**

1. **Check browser settings:**
   - Allow downloads from domain
   - Check popup/download blockers

2. **Try different format:**
   - Try JSON first
   - Then try CSV
   - PDF may need additional setup

3. **Manual export:**
   - Take screenshot
   - Use browser "Print to PDF"
   - Or copy data to spreadsheet

### Performance Issues

#### App Loads Slowly

**Symptoms:**
- Initial page load takes 10+ seconds
- Dashboard takes time to render

**Solutions:**

1. **Check network:**
   - Open DevTools → Network tab
   - See which resources are slow
   - Check API response times

2. **Check database:**
   - MongoDB may be overloaded
   - Try at different time
   - Or upgrade MongoDB tier

3. **Optimize queries:**
   - Dashboard should load in <2s
   - If slower, queries need optimization

4. **Clear cache:**
   - Clear browser cache (Ctrl+Shift+Del)
   - Clear LocalStorage (DevTools → Application)

#### Forms Are Slow to Submit

**Symptoms:**
- Form submission takes 5+ seconds
- No feedback while processing

**Solutions:**

1. **Check network latency:**
   - DevTools → Network
   - Check POST request time
   - Vercel should respond in <500ms

2. **Check form validation:**
   - Large forms with many validations slower
   - Zod validation should be <50ms

3. **Database indexing:**
   - Make sure MONGODB_URI server is in same region
   - MongoDB Atlas: US East preferred for US users

### Data Issues

#### Customer/Product Appears Deleted

**Symptoms:**
- Record was there, now missing
- Can't find in list

**Solutions:**

1. **Check soft delete:**
   - Records aren't actually deleted
   - They have `isActive: false`
   - Only visible to superadmin (TODO)

2. **Search archived:**
   - If really deleted, it's gone
   - No recovery available (soft delete not implemented yet)

3. **Check filters:**
   - Maybe filter is hiding record
   - Clear filters on customer/product list

#### Duplicate Records Created

**Symptoms:**
- Two identical invoices or customers
- Data inconsistency

**Solutions:**

1. **Prevent future duplicates:**
   - Check form before submitting
   - Avoid double-click
   - Wait for success confirmation

2. **Manual cleanup:**
   - Delete duplicate (not yet implemented)
   - Mark one as inactive

3. **Unique constraints:**
   - Invoices: invoiceNumber must be unique
   - Customers: GSTIN must be unique if provided
   - Products: SKU must be unique

### Multi-Tenant Issues

#### Can't See Other User's Data

**Symptoms:**
- Login as User A
- Can't see data from User B
- Even though they're in same company

**Correct Behavior:**
- Each user only sees their own tenant's data
- This is by design for security
- All users in same company have same tenantId

**If Users Need Access:**
- Both users must be added to same Tenant
- Admin creates additional users in Settings
- Don't create separate Tenant for same company

#### Data from Wrong Company Shows

**Symptoms:**
- Seeing other company's invoices
- Another business's products

**Solutions:**

1. **Check tenantId:**
   ```bash
   # In browser console
   const token = localStorage.auth.token
   const parts = token.split('.')
   const decoded = JSON.parse(atob(parts[1]))
   console.log(decoded.tenantId)
   ```

2. **Verify no data leakage:**
   - All API queries should filter by tenantId
   - This is critical security issue
   - File bug report if found

3. **Clear localStorage:**
   - Logout completely
   - Clear all browser data
   - Login again fresh

### Browser Compatibility

#### App Doesn't Work in Old Browser

**Symptoms:**
- Blank screen
- JavaScript errors in console

**Supported Browsers:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile: iOS Safari 14+, Chrome Mobile

**If Using Unsupported Browser:**
- Upgrade browser
- Modern features like flexbox, async/await required

#### Mobile App Responsive Issues

**Symptoms:**
- Layout broken on phone
- Can't tap buttons
- Text unreadable

**Solutions:**

1. **Zoom out:**
   - Pinch to zoom out
   - Should fit screen

2. **Use portrait mode:**
   - App optimized for portrait on small screens
   - Landscape may have issues

3. **Update browser:**
   - Mobile browsers must be up to date

## Debugging Techniques

### Enable Debug Logs

The application uses `[v0]` prefixed console logs for debugging:

```typescript
// In browser console
console.log("[v0] User logged in:", user)
```

**Check logs:**
1. Open browser (F12)
2. Go to Console tab
3. Look for `[v0]` messages
4. Filter: Type `v0` in search box

### Network Debugging

```bash
# Check API calls
1. Open DevTools (F12)
2. Network tab
3. Make action
4. Check request/response
5. Look for:
   - Status code (200, 400, 500)
   - Response headers
   - Response body JSON
```

### Database Debugging

```bash
# Connect to MongoDB directly
mongosh "mongodb+srv://user:pass@cluster..."

# Check collections
show collections

# Count documents
db.invoices.countDocuments({ tenantId: ObjectId("...") })

# Find documents
db.invoices.findOne({ invoiceNumber: "INV-2024-00001" })
```

### Error Stack Traces

**In Production:**
- Check Vercel dashboard → Logs
- Error messages usually detailed
- Include full stack trace in bug reports

**In Development:**
- Terminal shows full errors
- Browser console may show additional info
- Use debugger: Add `debugger;` statement and use DevTools

## Getting Help

### Resources

1. **Internal Documentation:**
   - Read other docs in `/docs` folder
   - Check code comments

2. **Stack Overflow:**
   - Search for error message
   - Include: Next.js, React, Mongoose versions

3. **GitHub Issues:**
   - Search existing issues
   - Open new issue with:
     * Environment details
     * Steps to reproduce
     * Expected vs actual behavior
     * Screenshots/error logs

4. **Community:**
   - Next.js Discord
   - React forums
   - Mongoose documentation

### Reporting Bugs

**Include in bug report:**
1. Environment: Development or Production
2. Browser and version
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Error message (full text)
7. Screenshots/logs
8. MongoDB version
9. Node version

**Example:**
```
Environment: Production
URL: https://app.example.com
Browser: Chrome 120

Steps:
1. Login as user@example.com
2. Go to Invoices
3. Click "Create New"
4. Fill form and submit

Expected: Invoice created successfully
Actual: Shows "Invoice creation failed"

Error: API returns 500 with "Cannot read property 'customerId' of undefined"

Console logs: [v0] Registration attempt...
```
