# 🔧 Seller View Setup Guide

## Problem
Properties created in the database don't show in the seller view because they're assigned to a test seller ID, not your Google OAuth user ID.

## Solution

### Step 1: Get Your User ID
Open this URL in your browser (while logged in):
```
http://localhost:3000/api/debug/current-user
```

You'll see your user ID in the response. Copy it. It will look something like: `102718398123456789`

### Step 2: Assign Properties to Your User

Run this command, replacing `YOUR_USER_ID` with the ID from Step 1:

```bash
node scripts/reassign-properties.js test-seller-001 YOUR_USER_ID
```

**Example:**
```bash
node scripts/reassign-properties.js test-seller-001 102718398123456789
```

### Step 3: Clear Cache

```bash
node scripts/clear-all-cache.js
```

### Step 4: View Your Properties

Go to the seller dashboard:
```
http://localhost:3000/seller
```

You should now see all 18 test properties!

---

## Available Scripts

### View All Properties by Seller
```bash
node scripts/verify-properties.js
```

### Reassign Properties Between Sellers
```bash
node scripts/reassign-properties.js <from_seller_id> <to_seller_id>
```

### Clear All Cache
```bash
node scripts/clear-all-cache.js
```

### Get Current User Info
```
GET http://localhost:3000/api/debug/current-user
```
(Requires authentication)

---

## Properties Overview

- **Total Properties**: 18 (test data)
- **Total Images**: 54 (3 images per property)
- **Images Storage**: Vercel Blob (https://jwtwyxuclv3g8tTa.public.blob.vercel-storage.com/)
- **Current Seller**: test-seller-001 (consolidated from 2 test users)

Once you reassign to your user ID, all properties will display in your seller dashboard with images from Vercel Blob storage.

---

## Troubleshooting

### Properties still not showing?
1. Make sure you're logged in
2. Double-check your user ID is correct
3. Clear the browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
4. Run `node scripts/clear-all-cache.js` to clear server cache

### Images not loading?
- Images should be loading from Vercel Blob URLs
- Check that your BLOB_READ_WRITE_TOKEN is set in `.env.local`
- Check browser network tab to see if image requests are returning 200 OK
