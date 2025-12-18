# Customer Feedback & Coupon System Flow

## Updated Flow Requirements

### Customer Flow (No Login Required)
1. Customer scans QR code on frontend (anonymous access)
2. Customer sees feedback form
3. Customer fills and submits feedback
4. **On submission**: Customer is automatically created at backend if they don't exist
5. Feedback is saved with customer reference

### Merchant Coupon Batch Flow
1. Merchant creates a coupon batch with:
   - Batch name
   - Start date
   - End date
   - Total quantity
   - Batch type (annual/temporary)
2. **On batch creation**: Multiple coupons are automatically generated
3. Each coupon has a unique code and QR hash
4. Coupons are in 'issued' status but not assigned to customers

## Implementation Details

### 1. Coupon Batch Creation

**Endpoint**: `POST /api/v1/coupon-batches`

**Request:**
```json
{
  "merchantId": 1,
  "batchName": "Summer Campaign 2025",
  "batchType": "temporary",
  "totalQuantity": 100,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "isActive": true,
  "whatsappEnabled": false,
  "luckyDrawEnabled": false
}
```

**What Happens:**
- Validates merchant exists
- Validates batch type matches merchant type (temporary merchants can only create temporary batches)
- Validates dates (start < end)
- Validates quantity (temporary batches max 1000)
- Creates coupon batch
- **Auto-generates** `totalQuantity` number of coupons with:
  - Unique coupon codes (format: `CPN-XXXXXXXX`)
  - QR hash for security
  - Status: 'issued'
  - Issued timestamp
- All operations in a database transaction

**Response:**
```json
{
  "message": "Coupon batch created successfully with 100 coupons",
  "data": {
    "id": 1,
    "merchantId": 1,
    "batchName": "Summer Campaign 2025",
    "batchType": "temporary",
    "totalQuantity": 100,
    "issuedQuantity": 0,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "qrCodeUrl": "http://localhost:3000/review?mid=1&bid=1&hash=abc123...",
    "qrCodeImage": "...",
    "couponsGenerated": 100
  }
}
```

### 2. Feedback Submission (with Customer Creation)

**Endpoint**: `POST /api/v1/feedbacks`

**Request (Anonymous Customer):**
```json
{
  "merchantId": 1,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "rating": 5,
  "comment": "Great service!"
}
```

**Request (Existing Customer):**
```json
{
  "merchantId": 1,
  "customerId": 10,
  "rating": 4,
  "comment": "Good experience"
}
```

**What Happens:**
1. Check if `customerId` is provided
2. If not, check if customer exists by email or phone
3. If customer doesn't exist:
   - Create new customer with provided details
   - Generate random password (for potential future login)
   - Hash password
   - Save customer
4. Create feedback with customer reference
5. Return feedback with customer and merchant details

**Response:**
```json
{
  "message": "Feedback created successfully",
  "data": {
    "id": 1,
    "merchantId": 1,
    "customerId": 10,
    "rating": 5,
    "comment": "Great service!",
    "merchant": {
      "id": 1,
      "business_name": "Test Business"
    },
    "customer": {
      "id": 10,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    }
  }
}
```

## Database Schema Changes

### Coupons Table
```sql
CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  batch_id INT NOT NULL REFERENCES coupon_batches(id) ON DELETE CASCADE,
  merchant_id INT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  customer_id INT NULL REFERENCES customers(id) ON DELETE SET NULL,
  coupon_code VARCHAR(50) UNIQUE NOT NULL,
  qr_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'issued', -- 'issued', 'redeemed', 'expired'
  issued_at TIMESTAMP,
  redeemed_at TIMESTAMP NULL,
  pdf_url TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);
```

**Key Points:**
- `customer_id` is NULLABLE - coupons are not initially assigned
- Status starts as 'issued'
- Each coupon has unique code and QR hash

### Customers Table
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);
```

**Key Points:**
- Customers created automatically on feedback submission
- Email and phone are unique
- Password generated for potential future login

## API Endpoints Summary

### Coupon Batches
- `POST /api/v1/coupon-batches` - Create batch (auto-generates coupons)
- `GET /api/v1/coupon-batches` - List batches
- `GET /api/v1/coupon-batches/:id` - Get batch details
- `PATCH /api/v1/coupon-batches/:id` - Update batch
- `DELETE /api/v1/coupon-batches/:id` - Delete batch

### Feedbacks
- `POST /api/v1/feedbacks` - Submit feedback (creates customer if needed)
- `GET /api/v1/feedbacks` - List feedbacks (filter by merchantId, customerId)
- `GET /api/v1/feedbacks/:id` - Get feedback details
- `PATCH /api/v1/feedbacks/:id` - Update feedback
- `DELETE /api/v1/feedbacks/:id` - Delete feedback

### Coupons
- `GET /api/v1/coupons` - List coupons (filter by batchId, merchantId, status)
- `GET /api/v1/coupons/:id` - Get coupon details
- `GET /api/v1/coupons/by-code/:code` - Get coupon by code

## Validation Rules

### Coupon Batch Creation
- ✅ Merchant must exist
- ✅ Merchant type validation:
  - Temporary merchants → can only create temporary batches
  - Permanent merchants → can create both temporary and annual batches
- ✅ Start date must be before end date
- ✅ Temporary batches limited to 1000 coupons max
- ✅ All fields validated with class-validator

### Feedback Submission
- ✅ MerchantId required
- ✅ Rating: 1-5 (required)
- ✅ Comment: optional string
- ✅ Customer fields: optional (name, email, phone)
- ✅ If customer fields provided, customer created/found automatically
- ✅ Email format validated
- ✅ Duplicate email/phone handled (finds existing customer)

## Frontend Integration

### QR Code Scanning Flow
1. Merchant gets QR code from backend using `GET /api/v1/merchants/:id/qr-code`
2. Frontend displays QR code
3. Customer scans QR code
4. QR contains: `http://localhost:3000/feedback?mid=1&hash=abc123`
5. Frontend extracts merchantId and hash
6. Frontend shows feedback form
7. Customer fills: name, email, phone (optional), rating, comment
8. Frontend submits to `POST /api/v1/feedbacks`

### Feedback Form Fields
```typescript
interface FeedbackForm {
  merchantId: number; // from QR code
  customerName?: string; // optional
  customerEmail?: string; // optional
  customerPhone?: string; // optional
  rating: number; // 1-5, required
  comment?: string; // optional
}
```

## Removed Functionality

### ❌ Coupon Assignment
- No automatic assignment of coupons to customers
- Coupons exist in batch but remain unassigned
- `customer_id` field remains null in coupons table
- Future: Can be implemented as a separate feature

### ❌ Coupon Issuance Flow
- No coupon issuance on feedback submission
- No coupon redemption logic (for now)
- No PDF generation (for now)

## Next Steps (Future Features)

1. **Coupon Redemption**
   - POS system integration
   - Assign coupon to customer on redemption
   - Update status to 'redeemed'

2. **WhatsApp Integration**
   - Send feedback confirmation via WhatsApp
   - Send coupon details via WhatsApp

3. **Lucky Draw**
   - Random selection from feedback submitters
   - Winner notification

4. **PDF Generation**
   - Generate coupon PDF with QR code
   - Store PDF URL in database

5. **Customer Portal** (if needed)
   - Login using email/password
   - View feedback history
   - View coupons (if assigned in future)

## Testing

### Test Coupon Batch Creation
```bash
curl -X POST http://localhost:8000/api/v1/coupon-batches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "merchantId": 1,
    "batchName": "Test Batch",
    "batchType": "temporary",
    "totalQuantity": 50,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  }'
```

### Test Anonymous Feedback Submission
```bash
curl -X POST http://localhost:8000/api/v1/feedbacks \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": 1,
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "customerPhone": "+1234567890",
    "rating": 5,
    "comment": "Great!"
  }'
```

### Verify Coupons Generated
```bash
curl http://localhost:8000/api/v1/coupons?batchId=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Benefits of Current Implementation

1. **Seamless Customer Experience**
   - No registration required
   - Quick feedback submission
   - Customer data captured automatically

2. **Efficient Coupon Management**
   - Batch creation creates all coupons at once
   - No manual coupon generation
   - Ready for future assignment/redemption

3. **Data Integrity**
   - Transaction-based operations (atomic)
   - Duplicate customer prevention
   - Foreign key constraints

4. **Scalability**
   - Async customer creation
   - Batch coupon generation
   - Efficient database queries
