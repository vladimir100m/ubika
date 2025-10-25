# 🔧 Image Upload Troubleshooting Guide

## Problem: Images Not Creating Database Records

When uploading an image:
- ✅ File uploads to Vercel Blob (you can see the blob URL)
- ❌ But no record created in `property_images` table
- ❌ Image doesn't appear in property gallery

## Common Causes & Fixes

### 1. **Seller ID Mismatch** (Most Common)
The property's `seller_id` doesn't match your user ID

**How to check:**
```bash
# Replace YOUR_USER_ID with your Google ID (from /api/debug/current-user)
node scripts/debug-image-upload.js YOUR_USER_ID
```

**The problem:**
- Property created with different seller_id
- You're logged in with different Google account
- API returns 403 Forbidden

**The fix:**
```bash
# Reassign property to your user
node scripts/reassign-properties.js test-seller-001 YOUR_USER_ID
```

---

### 2. **Not Logged In or Bad Session**
Your session is invalid or expired

**How to check:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try uploading an image
4. Look for POST to `/api/properties/images`
5. Check response - if it says "Unauthorized", your session is bad

**The fix:**
```
1. Sign out completely
2. Clear browser cookies
3. Sign in again
4. Try uploading
```

---

### 3. **Property Doesn't Exist**
The property_id being sent is wrong or property was deleted

**How to check:**
```bash
node scripts/verify-properties.js | grep YOUR_PROPERTY_NAME
```

**The fix:**
- Create a new property first
- Then upload images to it

---

### 4. **API Returns 500 Internal Server Error**
Database error when inserting image record

**How to check:**
1. Go to terminal where `npm run dev` is running
2. Look for error logs
3. Check error message details

**Common reasons:**
- Database connection failed
- `property_images` table columns don't match
- Invalid data type

**The fix:**
```bash
# Check database is accessible
node scripts/verify-properties.js

# If that fails, database has issues
# Try the setup scripts to ensure DB is initialized
node scripts/nuke-cache.js
```

---

## Full Debugging Workflow

### Step 1: Check Browser Console
```javascript
// When uploading, look for these logs:
📤 Uploading to Vercel Blob...
✅ Blob upload successful: https://...
💾 Registering image in database...
✅ Image registered in database: {...}

// Or errors like:
❌ Database registration failed: ...
❌ Blob upload failed: ...
❌ Network error
```

### Step 2: Check Network Tab
1. F12 → Network tab
2. Filter for "properties/images"
3. Look at the POST request response:
   - **200** = Success (should have image data)
   - **400** = Missing fields
   - **401** = Not logged in
   - **403** = Wrong seller_id
   - **404** = Property not found
   - **500** = Server error

### Step 3: Check Database
```bash
# Replace YOUR_USER_ID with your Google ID
node scripts/debug-image-upload.js YOUR_USER_ID
```

This shows:
- ✅ Your properties
- ✅ Your existing images
- ✅ Issues that might be blocking uploads

### Step 4: Check Logs
Terminal where `npm run dev` runs should show:
```
[INFO] Register property image handler start
[INFO] Session user authenticated { userId: '...' }
[INFO] Property found { property_id: '...', seller_id: '...', userId: '...' }
[INFO] Property ownership verified
[INFO] Image successfully inserted into database
```

If you see WARNING or ERROR messages, that's the issue.

---

## Step-by-Step Fix

If images aren't being registered, follow this:

### 1. Verify You're Logged In
```
http://localhost:3000/api/debug/current-user
```
Should return your user ID. If it shows "Not authenticated", log in again.

### 2. Get Your User ID
Copy the `id` value from the response

### 3. Check Your Properties
```bash
node scripts/debug-image-upload.js YOUR_USER_ID
```

If it shows 0 properties, create one first.

### 4. Test Upload
1. Go to `/seller`
2. Click on a property
3. Try uploading an image
4. Check DevTools console for the logs mentioned in Step 1

### 5. Check if It Worked
```bash
node scripts/debug-image-upload.js YOUR_USER_ID
```

Should now show your image!

---

## Quick Commands Reference

```bash
# Get your user ID (must be logged in)
http://localhost:3000/api/debug/current-user

# Debug images for a specific user
node scripts/debug-image-upload.js <USER_ID>

# Verify all properties and images
node scripts/verify-properties.js

# Reassign a property to you
node scripts/reassign-properties.js test-seller-001 <YOUR_USER_ID>

# Clear cache if needed
node scripts/nuke-cache.js
```

---

## Expected Flow (Should Happen Automatically)

```
1. Select image file
   ↓
2. Frontend uploads to /api/blobs/upload
   ↓
3. Get blob URL back (https://...)
   ↓
4. Send POST to /api/properties/images with:
   - property_id
   - image_url (the blob URL)
   - is_cover
   - display_order
   ↓
5. API checks:
   ✅ User is logged in
   ✅ Property exists
   ✅ User owns the property
   ↓
6. API inserts into property_images table
   ↓
7. Returns image data to frontend
   ↓
8. Image appears in gallery
```

If any step fails, check that step's error message!

---

## Still Not Working?

1. **Clear everything:**
   ```bash
   echo "YES" | node scripts/clear-database.js
   node scripts/create-properties-for-seller.js YOUR_USER_ID
   node scripts/nuke-cache.js
   ```

2. **Check environment:**
   - Make sure `.env.local` has BLOB_READ_WRITE_TOKEN
   - Make sure DATABASE_URL is correct
   - Make sure REDIS_URL is set

3. **Check logs in npm dev terminal:**
   - Look for [ERROR] or [WARN] messages
   - Look for database connection errors

4. **If still stuck:**
   - Run `node scripts/debug-image-upload.js YOUR_USER_ID`
   - Share the output - it shows the exact issue!
