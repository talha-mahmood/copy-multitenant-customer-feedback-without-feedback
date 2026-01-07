# Postman Testing Guide - Merchant Settings API

## Prerequisites
- Get your JWT token from login endpoint
- Know your merchant ID

---

## Test 1: Update Merchant Settings (JSON)

### Endpoint Details
- **Method:** `PATCH`
- **URL:** `http://localhost:3000/merchant-settings/merchant/123`
  - Replace `123` with your actual merchant ID

### Steps in Postman:

1. **Set Request Type:** Select `PATCH` from dropdown

2. **Enter URL:** 
   ```
   http://localhost:3000/merchant-settings/merchant/123
   ```

3. **Set Headers:**
   - Go to "Headers" tab
   - Add:
     ```
     Authorization: Bearer YOUR_JWT_TOKEN_HERE
     Content-Type: application/json
     ```

4. **Set Body:**
   - Go to "Body" tab
   - Select `raw`
   - Select `JSON` from the dropdown (right side)
   - Enter JSON data:
   ```json
   {
     "enable_preset_reviews": true,
     "enable_google_reviews": true,
     "enable_facebook_reviews": false,
     "enable_instagram_reviews": false,
     "enable_xiaohongshu_reviews": false,
     "google_review_url": "https://g.page/example",
     "facebook_page_url": "https://facebook.com/example",
     "instagram_url": "https://instagram.com/example",
     "xiaohongshu_url": "https://xiaohongshu.com/example",
     "visibility_logic": 1,
     "placement": "top",
     "paid_ads": true
   }
   ```

5. **Click Send**

### Expected Response:
```json
{
  "message": "Merchant settings updated successfully",
  "data": {
    "id": 1,
    "merchant_id": 123,
    "enable_preset_reviews": true,
    "enable_google_reviews": true,
    "enable_facebook_reviews": false,
    "enable_instagram_reviews": false,
    "enable_xiaohongshu_reviews": false,
    "google_review_url": "https://g.page/example",
    "facebook_page_url": "https://facebook.com/example",
    "instagram_url": "https://instagram.com/example",
    "xiaohongshu_url": "https://xiaohongshu.com/example",
    "visibility_logic": 1,
    "placement": "top",
    "paid_ads": true,
    "paid_ad_image": null,
    "created_at": "2025-01-06T10:00:00.000Z",
    "updated_at": "2025-01-06T10:30:00.000Z",
    "deleted_at": null
  }
}
```

---

## Test 2: Upload Paid Ad Image (FormData)

### Endpoint Details
- **Method:** `POST`
- **URL:** `http://localhost:3000/merchant-settings/merchant/123/paid-ad-image`
  - Replace `123` with your actual merchant ID

### Steps in Postman:

1. **Set Request Type:** Select `POST` from dropdown

2. **Enter URL:** 
   ```
   http://localhost:3000/merchant-settings/merchant/123/paid-ad-image
   ```

3. **Set Headers:**
   - Go to "Headers" tab
   - Add:
     ```
     Authorization: Bearer YOUR_JWT_TOKEN_HERE
     ```
   - **IMPORTANT:** Do NOT add `Content-Type` header - Postman will set it automatically with the boundary for multipart/form-data

4. **Set Body:**
   - Go to "Body" tab
   - Select `form-data` (NOT raw, NOT x-www-form-urlencoded)
   - Add a new key-value pair:
     - **Key:** `paidAdImage`
     - **Type:** Change from "Text" to "File" (hover over the key field, you'll see a dropdown)
     - **Value:** Click "Select Files" and choose an image file from your computer

   **Visual Guide:**
   ```
   KEY              TYPE     VALUE
   paidAdImage      File     [Select Files] → Choose your image
   ```

5. **Click Send**

### Expected Response:
```json
{
  "message": "Paid ad image uploaded successfully",
  "data": {
    "paid_ad_image": "/uploads/merchant-ads/image-1736160000000.jpg"
  }
}
```

---

## Test 3: Get Merchant Settings (Verify Changes)

### Endpoint Details
- **Method:** `GET`
- **URL:** `http://localhost:3000/merchant-settings/merchant/123`

### Steps in Postman:

1. **Set Request Type:** Select `GET` from dropdown

2. **Enter URL:** 
   ```
   http://localhost:3000/merchant-settings/merchant/123
   ```

3. **No Headers or Body needed** (unless your endpoint requires auth)

4. **Click Send**

### Expected Response:
```json
{
  "message": "Merchant settings retrieved successfully",
  "data": {
    "id": 1,
    "merchant_id": 123,
    "enable_preset_reviews": true,
    "enable_google_reviews": true,
    "visibility_logic": 1,
    "placement": "top",
    "paid_ads": true,
    "paid_ad_image": "/uploads/merchant-ads/image-1736160000000.jpg",
    ...
  }
}
```

---

## Common Issues & Solutions

### Issue 1: "Unauthorized" Error
**Solution:** Make sure you have a valid JWT token in the Authorization header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Issue 2: File Upload Not Working
**Possible Causes:**
- Using "Text" instead of "File" type in form-data
- Adding Content-Type header manually (remove it, let Postman handle it)
- Using wrong key name (must be exactly `paidAdImage`)

**Solution:**
1. Go to Body → form-data
2. Make sure the key is `paidAdImage`
3. Hover over the key field and change type to "File"
4. Select an image file

### Issue 3: "Settings not found"
**Solution:** 
- Make sure the merchant ID in the URL exists
- Create settings first using the POST endpoint if they don't exist

### Issue 4: JSON Parse Error
**Solution:**
- Make sure you selected "JSON" format in Body → raw
- Check that your JSON is valid (no trailing commas, proper quotes)

---

## Complete Testing Flow

### Step-by-Step Testing:

1. **Login to get JWT token** (if you haven't already)
   ```
   POST /auth/login
   Body: { "email": "...", "password": "..." }
   ```

2. **Update merchant settings** (JSON data)
   ```
   PATCH /merchant-settings/merchant/123
   Body: { "visibility_logic": 1, "placement": "top", "paid_ads": true }
   ```

3. **Upload paid ad image** (FormData)
   ```
   POST /merchant-settings/merchant/123/paid-ad-image
   Body: form-data with paidAdImage file
   ```

4. **Verify the changes** (GET request)
   ```
   GET /merchant-settings/merchant/123
   ```

---

## Screenshot Guide for FormData Upload

When setting up the file upload in Postman:

```
┌─────────────────────────────────────────────────────────┐
│ Body                                                     │
├─────────────────────────────────────────────────────────┤
│ ○ none                                                   │
│ ○ form-data          ← SELECT THIS                      │
│ ○ x-www-form-urlencoded                                 │
│ ○ raw                                                    │
│ ○ binary                                                 │
│ ○ GraphQL                                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ KEY            TYPE ▼    VALUE                          │
│ paidAdImage    File ▼    [Select Files]  ← Click here  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Important:** 
- The TYPE dropdown appears when you hover over the KEY field
- Change it from "Text" to "File"
- Then click "Select Files" to choose your image

---

## Testing with cURL (Alternative)

If you prefer command line:

### Update Settings:
```bash
curl -X PATCH http://localhost:3000/merchant-settings/merchant/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "visibility_logic": 1,
    "placement": "top",
    "paid_ads": true
  }'
```

### Upload Image:
```bash
curl -X POST http://localhost:3000/merchant-settings/merchant/123/paid-ad-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "paidAdImage=@/path/to/your/image.jpg"
```
