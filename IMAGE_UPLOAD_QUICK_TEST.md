# 🎯 Quick Test: Image Upload

## Before You Start
Make sure:
1. ✅ You're logged in (Google auth)
2. ✅ You have a property in seller view
3. ✅ Dev server is running (`npm run dev`)

## Test Steps

### 1. Open Developer Tools
```
Press F12 or Cmd+Option+I
Go to "Console" tab
```

### 2. Go to Seller Dashboard
```
http://localhost:3000/seller
```

### 3. Click on a Property
Select any property to edit

### 4. Upload an Image
- Drag & drop an image OR
- Click upload button and select a file

### 5. Check Console Output
You should see:
```
📤 Uploading to Vercel Blob...
✅ Blob upload successful: https://jwtwyxuclv3g8tta.public.blob.vercel-storage.com/...
💾 Registering image in database...
✅ Image registered in database: {id: "...", property_id: "...", ...}
```

### 6. Verify Image Appears
- Image should appear in the property gallery
- Image should show below the upload area

### 7. Verify in Database
```bash
# Get your user ID first
http://localhost:3000/api/debug/current-user
# Copy the "id" value

# Then run (replace YOUR_USER_ID)
node scripts/debug-image-upload.js YOUR_USER_ID
```

Should show the image in the list!

---

## If Something Goes Wrong

### Error: "❌ Database registration failed"
Check the response in DevTools:
1. F12 → Network tab
2. Filter for "images"
3. Look for POST to `/api/properties/images`
4. Check the response body for the error

**Common issues:**
- **403 Forbidden**: Seller ID mismatch → Use reassign-properties script
- **401 Unauthorized**: Not logged in → Log in again
- **404 Not Found**: Property doesn't exist → Create a property first
- **500 Server Error**: Database error → Check terminal logs

### Error: "❌ Blob upload failed"
Check if:
- BLOB_READ_WRITE_TOKEN is set in `.env.local`
- Token is valid (hasn't expired)
- File size isn't too large

### No errors but image doesn't appear
1. Refresh the page
2. Clear browser cache
3. Run: `node scripts/nuke-cache.js`
4. Try again

---

## Expected Outcome

After successful upload:
- ✅ Image visible in property gallery
- ✅ Image URL is blob URL (https://...)
- ✅ Record in `property_images` table
- ✅ `is_cover` set correctly
- ✅ `display_order` set correctly

---

## Debug with Script

```bash
# Replace YOUR_USER_ID with ID from /api/debug/current-user
node scripts/debug-image-upload.js YOUR_USER_ID
```

This shows:
- Your properties
- Your images (should have just uploaded one)
- Any issues preventing uploads

---

## Still Stuck?

1. **Check PropertyImageEditor logs:**
   ```javascript
   // In console, look for these patterns:
   console.log('📤 Uploading to Vercel Blob...');
   console.log('❌ Blob upload failed:', errorData);
   console.log('💾 Registering image in database...');
   console.log('❌ Database registration failed:', errorData);
   ```

2. **Check terminal logs (where npm run dev runs):**
   Look for `[INFO]` or `[ERROR]` messages from the image registration endpoint

3. **Check network response:**
   - Blob endpoint returns: `{ url, publicUrl, pathname, contentType }`
   - Images endpoint returns: `{ id, property_id, image_url, is_cover, display_order, created_at }`

---

## Success = Your Image Should Appear!
If all steps pass, your image will:
- Display in the property gallery
- Have correct blob URL
- Be registered in database
- Show up in `node scripts/debug-image-upload.js` output
