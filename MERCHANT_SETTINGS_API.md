# Merchant Settings API Endpoints

## Overview
The merchant settings endpoints have been split into two separate operations:
1. **Update Settings** - For updating all settings fields (JSON request)
2. **Upload Paid Ad Image** - For uploading the paid ad image (FormData request)

---

## 1. Update Merchant Settings
**Endpoint:** `PATCH /merchant-settings/merchant/:merchantId`  
**Content-Type:** `application/json`  
**Auth:** Required (JWT)

### Request Body
```json
{
  "enablePresetReviews": true,
  "enableGoogleReviews": true,
  "enableFacebookReviews": false,
  "enableInstagramReviews": false,
  "enableXiaohongshuReviews": false,
  "googleReviewUrl": "https://g.page/...",
  "facebookPageUrl": "https://facebook.com/...",
  "instagramUrl": "https://instagram.com/...",
  "xiaohongshuUrl": "https://xiaohongshu.com/...",
  "visibilityLogic": 1,
  "placement": "top",
  "paidAds": true
}
```

### Response
```json
{
  "message": "Merchant settings updated successfully",
  "data": {
    "id": 1,
    "merchant_id": 123,
    "enable_preset_reviews": true,
    "enable_google_reviews": true,
    "visibility_logic": 1,
    "placement": "top",
    "paid_ads": true,
    "paid_ad_image": "/uploads/merchant-ads/image.jpg",
    ...
  }
}
```

---

## 2. Upload Paid Ad Image
**Endpoint:** `POST /merchant-settings/merchant/:merchantId/paid-ad-image`  
**Content-Type:** `multipart/form-data`  
**Auth:** Required (JWT)

### Request Body (FormData)
```
paidAdImage: [File]
```

### Response
```json
{
  "message": "Paid ad image uploaded successfully",
  "data": {
    "paid_ad_image": "/uploads/merchant-ads/image-123456.jpg"
  }
}
```

---

## Usage Example

### Using Fetch API

```javascript
// 1. Update settings (JSON)
const updateSettings = async (merchantId, settings) => {
  const response = await fetch(`/merchant-settings/merchant/${merchantId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });
  return response.json();
};

// 2. Upload paid ad image (FormData)
const uploadPaidAdImage = async (merchantId, imageFile) => {
  const formData = new FormData();
  formData.append('paidAdImage', imageFile);
  
  const response = await fetch(`/merchant-settings/merchant/${merchantId}/paid-ad-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};
```

### Using Axios

```javascript
// 1. Update settings (JSON)
await axios.patch(`/merchant-settings/merchant/${merchantId}`, {
  visibilityLogic: 1,
  placement: 'top',
  paidAds: true,
  enableGoogleReviews: true
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// 2. Upload paid ad image (FormData)
const formData = new FormData();
formData.append('paidAdImage', imageFile);

await axios.post(`/merchant-settings/merchant/${merchantId}/paid-ad-image`, formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

---

## Migration Notes

### Database Changes
A migration has been created to add the following columns to `merchant_settings` table:
- `visibility_logic` (int, nullable)
- `placement` (varchar(255), nullable)
- `paid_ads` (boolean, default: false)
- `paid_ad_image` (text, nullable)

Run the migration:
```bash
npm run migration:run
```

### Breaking Changes
- The `PATCH /merchant-settings/merchant/:merchantId` endpoint no longer accepts FormData
- File upload for paid ad image must now use the dedicated endpoint: `POST /merchant-settings/merchant/:merchantId/paid-ad-image`
