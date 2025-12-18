# Quick Testing Guide 🧪

## Setup (One-time)

### 1. Import Postman Collection
```bash
1. Open Postman
2. Click "Import" button (top-left)
3. Select file: postman-collection.json
4. Collection "Boilerplate Backend - Complete API" will appear
```

### 2. Verify Server is Running
```bash
# Terminal should show:
npm run start:dev

# Look for:
✅ "Found 0 errors. Watching for file changes."
✅ "Nest application successfully started"
✅ All routes mapped (auth, users, merchants, coupon-batches, coupons, etc.)
```

---

## Testing Workflow

### ✅ Step 1: Login (Get Access Token)

**Request:** `Authentication → Login`

**Details:**
- Method: `POST`
- URL: `http://localhost:8000/api/v1/auth/login`
- Body:
```json
{
  "email": "admin@must.services",
  "password": "Pakistan@123"
}
```

**Expected Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@must.services",
    "firstName": "Admin",
    "lastName": "User"
  }
}
```

**✨ Magic:** Token is automatically saved! All subsequent requests will include it.

---

### ✅ Step 2: Get Merchants

**Request:** `Merchants → Get All Merchants`

**Details:**
- Method: `GET`
- URL: `http://localhost:8000/api/v1/merchants?page=1&pageSize=20`
- Headers: `Authorization: Bearer <token>` (auto-added)

**Expected Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "businessName": "Test Business",
      "merchantType": "permanent",
      "userId": 2,
      ...
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**📝 Note:** Copy the `id` value - you'll need it for coupon batch creation!

---

### ✅ Step 3: Create Coupon Batch

**Request:** `Coupon Batches → Create Coupon Batch`

**Details:**
- Method: `POST`
- URL: `http://localhost:8000/api/v1/coupon-batches`
- Body:
```json
{
  "merchantId": 1,
  "batchName": "New Year 2025 Promotion",
  "batchType": "temporary",
  "totalQuantity": 500,
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-31T23:59:59.000Z",
  "isActive": true,
  "whatsappEnabled": true,
  "luckyDrawEnabled": false
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "merchantId": 1,
  "batchName": "New Year 2025 Promotion",
  "batchType": "temporary",
  "totalQuantity": 500,
  "issuedQuantity": 0,
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-31T23:59:59.000Z",
  "isActive": true,
  "created_at": "2025-12-18T...",
  ...
}
```

**🎉 Success Indicators:**
- ✅ Status code: 201
- ✅ `issuedQuantity` = 0
- ✅ `id` is present (copy for next step!)

---

### ✅ Step 4: Create Coupon

**Request:** `Coupons → Create Coupon`

**Details:**
- Method: `POST`
- URL: `http://localhost:8000/api/v1/coupons`
- Body:
```json
{
  "batchId": 1,
  "merchantId": 1,
  "couponCode": "MERC-ABC12345",
  "status": "issued"
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "batchId": 1,
  "merchantId": 1,
  "customerId": null,
  "couponCode": "MERC-ABC12345",
  "status": "issued",
  "issuedAt": "2025-12-18T...",
  "redeemedAt": null,
  ...
}
```

---

### ✅ Step 5: Get All Coupons

**Request:** `Coupons → Get All Coupons`

**Details:**
- Method: `GET`
- URL: `http://localhost:8000/api/v1/coupons?page=1&pageSize=20`

**With Filters (Optional):**
```
Enable query params in Postman:
- merchantId: 1
- status: issued
```

**Expected Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "couponCode": "MERC-ABC12345",
      "status": "issued",
      ...
    }
  ],
  "meta": { ... }
}
```

---

### ✅ Step 6: Find Coupon by Code

**Request:** `Coupons → Get Coupon by Code`

**Details:**
- Method: `GET`
- URL: `http://localhost:8000/api/v1/coupons/by-code/MERC-ABC12345`

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "couponCode": "MERC-ABC12345",
  "status": "issued",
  ...
}
```

---

### ✅ Step 7: Update Coupon (Mark as Redeemed)

**Request:** `Coupons → Update Coupon`

**Details:**
- Method: `PATCH`
- URL: `http://localhost:8000/api/v1/coupons/1`
- Body:
```json
{
  "status": "redeemed"
}
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "status": "redeemed",
  "redeemedAt": "2025-12-18T...",
  ...
}
```

---

## 🧪 Validation Tests

### Test 1: Temporary Merchant Cannot Create Annual Batch

**Setup:** Use a merchant with `merchantType: "temporary"`

**Request:** `Create Coupon Batch`
```json
{
  "merchantId": 2,
  "batchType": "annual",
  ...
}
```

**Expected Result:**
```
❌ 400 Bad Request
{
  "message": "Temporary merchants can only create temporary batches"
}
```

---

### Test 2: Quantity Limit Validation

**Request:** `Create Coupon Batch`
```json
{
  "merchantId": 1,
  "batchType": "temporary",
  "totalQuantity": 1500,
  ...
}
```

**Expected Result:**
```
❌ 400 Bad Request
{
  "message": "Temporary batches cannot exceed 1000 coupons"
}
```

---

### Test 3: Date Validation

**Request:** `Create Coupon Batch`
```json
{
  "merchantId": 1,
  "startDate": "2025-12-31T23:59:59.000Z",
  "endDate": "2025-01-01T00:00:00.000Z",
  ...
}
```

**Expected Result:**
```
❌ 400 Bad Request
{
  "message": "Start date must be before end date"
}
```

---

### Test 4: Unauthorized Access (No Token)

**Setup:** 
1. Click request in Postman
2. Go to "Authorization" tab
3. Select "No Auth"
4. Send request

**Expected Result:**
```
❌ 401 Unauthorized
{
  "message": "Unauthorized"
}
```

---

## 🎯 Testing Checklist

### Authentication
- [ ] Login with correct credentials → ✅ Get token
- [ ] Login with wrong password → ❌ 401 error
- [ ] Access protected route without token → ❌ 401 error
- [ ] Access protected route with token → ✅ Success

### Merchants
- [ ] Get all merchants → ✅ List returned
- [ ] Get merchant by ID → ✅ Details returned
- [ ] Create merchant → ✅ 201 Created
- [ ] Update merchant → ✅ 200 OK
- [ ] Delete merchant → ✅ Soft deleted

### Coupon Batches
- [ ] Create batch (permanent merchant + annual) → ✅ Success
- [ ] Create batch (permanent merchant + temporary) → ✅ Success
- [ ] Create batch (temporary merchant + annual) → ❌ 400 error
- [ ] Create batch (temporary merchant + temporary) → ✅ Success
- [ ] Create batch (quantity > 1000 for temporary) → ❌ 400 error
- [ ] Create batch (endDate < startDate) → ❌ 400 error
- [ ] Get all batches → ✅ List returned
- [ ] Filter by merchantId → ✅ Filtered results

### Coupons
- [ ] Create coupon → ✅ 201 Created
- [ ] Get all coupons → ✅ List returned
- [ ] Filter by status → ✅ Filtered results
- [ ] Find by code → ✅ Single coupon
- [ ] Update status to redeemed → ✅ redeemedAt set
- [ ] Delete coupon → ✅ Soft deleted

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to server"
**Solution:** 
```bash
# Check if server is running
npm run start:dev

# Should see: "Nest application successfully started"
```

### Problem: "401 Unauthorized on all requests"
**Solution:**
```
1. Run "Login" request again
2. Check collection variables (eye icon in Postman)
3. Verify "access_token" is present
4. Try request again
```

### Problem: "Merchant not found"
**Solution:**
```
1. Run "Get All Merchants" first
2. Copy an existing merchant ID
3. Use that ID in batch creation
```

### Problem: "Batch validation error"
**Solution:**
```
Check:
- merchantId exists
- merchantType matches batchType rules
- totalQuantity ≤ 1000 (for temporary)
- startDate < endDate
- Dates are in ISO 8601 format
```

---

## 📊 Expected Test Results Summary

| Test Case | Method | Expected Status | Expected Result |
|-----------|--------|-----------------|-----------------|
| Login | POST | 200 | Token returned |
| Get Merchants | GET | 200 | Array of merchants |
| Create Batch (valid) | POST | 201 | Batch created |
| Create Batch (invalid merchant type) | POST | 400 | Error message |
| Create Batch (quantity > 1000) | POST | 400 | Error message |
| Create Coupon | POST | 201 | Coupon created |
| Get Coupons | GET | 200 | Array of coupons |
| Find by Code | GET | 200 | Single coupon |
| Update to Redeemed | PATCH | 200 | Status updated |
| Access without Token | ANY | 401 | Unauthorized |

---

## 💡 Tips

1. **Auto Token Save:** The Login request automatically saves the token. You don't need to copy/paste it!

2. **Collection Variables:** View saved variables by clicking the eye icon (👁️) in top right of Postman.

3. **Pre-filled Examples:** All requests have example data. Just click "Send"!

4. **Query Params:** Enable/disable filters using checkboxes in Postman's query params section.

5. **Error Messages:** Read error messages carefully - they tell you exactly what's wrong.

6. **Status Codes:** 
   - 200/201 = Success
   - 400 = Bad Request (validation error)
   - 401 = Unauthorized (need to login)
   - 404 = Not Found
   - 500 = Server Error

---

**Happy Testing! 🚀**
