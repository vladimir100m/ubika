# 🎯 Getting Properties to Show in Seller View

## Current Status ✅
- Database is **cleared** 
- **10 new properties** created with random data
- **30 images** assigned (3 per property from `/data/images`)
- **Cache cleared** - ready for fresh data

## The Problem
Properties are currently assigned to `test-seller-001`, but you're logged in with your Google user ID. The seller view only shows properties matching your user ID.

## Solution - 3 Simple Steps

### Step 1: Get Your Google User ID
Open this link in your browser (while logged in):
```
http://localhost:3000/api/debug/current-user
```

Copy your user ID. It will look like: `102718398123456789`

### Step 2: Assign Properties to Your User
Run this command, replacing `YOUR_USER_ID` with the ID from Step 1:

```bash
node scripts/reassign-properties.js test-seller-001 YOUR_USER_ID
```

**Example:**
```bash
node scripts/reassign-properties.js test-seller-001 102718398123456789
```

Output will show:
```
✅ Successfully reassigned 10 properties!
```

### Step 3: View Your Properties
Go to the seller dashboard:
```
http://localhost:3000/seller
```

You should now see all **10 properties** with **images** from Vercel Blob storage! 🎉

---

## Available Scripts

```bash
# View all properties and their sellers
node scripts/verify-properties.js

# Reassign properties between sellers
node scripts/reassign-properties.js <from_seller_id> <to_seller_id>

# Clear all Redis cache
node scripts/clear-all-cache.js

# Completely clear database (use with caution!)
node scripts/clear-database.js

# One-command setup (clears DB + creates properties + clears cache)
node scripts/setup-seller-view.js
```

---

## Troubleshooting

### Properties still not showing?
1. Make sure you're logged in (Google auth required)
2. Check you copied the user ID correctly
3. Run `node scripts/verify-properties.js` to confirm properties exist
4. Check browser console for any errors
5. Try clearing browser cache (Ctrl+Shift+Delete)

### Images not loading?
- Check browser network tab (look for 404s)
- Verify images are in `/data/images` folder
- Check that blob storage is configured in `.env.local`

### Want to start over?
```bash
# Clear everything and start fresh
echo "YES" | node scripts/clear-database.js
node scripts/create-properties-for-seller.js
node scripts/clear-all-cache.js
```

---

## Quick Reference

**Get User ID:**
```
http://localhost:3000/api/debug/current-user
```

**Assign to User:**
```bash
node scripts/reassign-properties.js test-seller-001 YOUR_USER_ID
```

**View Properties:**
```
http://localhost:3000/seller
```

That's it! 🚀
