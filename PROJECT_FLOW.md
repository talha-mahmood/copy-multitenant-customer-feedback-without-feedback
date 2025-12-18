# Project Flow Documentation

## 🏗️ Architecture Overview

This is a **NestJS backend** with **TypeORM** and **PostgreSQL**, implementing a complete coupon management system with merchant, customer, and feedback modules.

### Technology Stack
- **Framework**: NestJS v10
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator & class-transformer
- **API Versioning**: v1 (URI-based)
- **Environment**: Configurable (local/development/production)

---

## 🔐 Authentication Flow

### 1. **Login Process**
```
Client → POST /api/v1/auth/login
       ↓
   Validate credentials (email + password)
       ↓
   Generate JWT access_token
       ↓
   Return { access_token, user }
```

**Key Points:**
- All endpoints except `/auth/login`, `/auth/register`, and `/auth/reset-password` require JWT authentication
- Token is sent in `Authorization: Bearer <token>` header
- Global `JwtAuthGuard` protects routes by default
- Use `@Public()` decorator to bypass authentication

### 2. **Authentication States**
- **Authenticated**: Valid JWT token → Access granted
- **Unauthenticated**: No/Invalid token → 401 Unauthorized
- **Token Refresh**: Not implemented yet (tokens don't expire in current setup)

---

## 📦 Module Structure

### Core Modules

#### 1. **Auth Module** (`/api/v1/auth`)
Handles user authentication and password management.

**Endpoints:**
- `POST /login` - Authenticate user, get JWT token
- `POST /register` - Create new user account
- `POST /update-password/:id` - Change password (authenticated)
- `POST /request-reset-password` - Send reset email
- `POST /reset-password?token=xxx` - Reset password with token

#### 2. **Users Module** (`/api/v1/users`)
Manages base user accounts (admins, merchants, customers).

**Endpoints:**
- `GET /users` - List all users (paginated)
- `GET /users/:id` - Get user details
- `POST /users` - Create new user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Soft delete user

**Pagination:**
- Query params: `?page=1&pageSize=20`
- Default: page=1, pageSize=20
- Max pageSize: 500

#### 3. **Roles Module** (`/api/v1/roles`)
Role-based access control (RBAC) management.

**Endpoints:**
- `GET /roles` - List all roles
- `GET /roles/:id` - Get role details
- `POST /roles` - Create new role
- `PATCH /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role

#### 4. **Admins Module** (`/api/v1/admins`)
Admin user profiles linked to base users.

**Endpoints:** Standard CRUD operations
- GET, POST, PATCH, DELETE `/admins`

#### 5. **Merchants Module** (`/api/v1/merchants`)
Business/merchant profiles with type classification.

**Merchant Types:**
- `permanent` - Long-term businesses (can create annual & temporary batches)
- `temporary` - Short-term businesses (can only create temporary batches)

**Endpoints:** Standard CRUD operations
- GET, POST, PATCH, DELETE `/merchants`

#### 6. **Customers Module** (`/api/v1/customers`)
Customer profiles for end-users.

**Endpoints:** Standard CRUD operations
- GET, POST, PATCH, DELETE `/customers`

#### 7. **Feedbacks Module** (`/api/v1/feedbacks`)
Customer feedback/reviews system.

**Endpoints:** Standard CRUD operations
- GET, POST, PATCH, DELETE `/feedbacks`

---

## 🎟️ Coupon System Flow

### Architecture Components

#### 1. **Coupon Batch** (Container)
A batch represents a campaign/promotion with multiple coupons.

**Key Fields:**
- `merchantId` - Which merchant owns this batch
- `batchName` - Campaign name (e.g., "New Year 2025")
- `batchType` - `annual` or `temporary`
- `totalQuantity` - Max coupons in this batch
- `issuedQuantity` - How many coupons issued so far
- `startDate` / `endDate` - Validity period
- `isActive` - Can issue new coupons?
- `whatsappEnabled` - Send via WhatsApp?
- `luckyDrawEnabled` - Enable lucky draw?

#### 2. **Coupon** (Individual Instance)
Individual coupon issued to customers.

**Key Fields:**
- `batchId` - Which batch this belongs to
- `merchantId` - Which merchant issued it
- `customerId` - Which customer received it (nullable)
- `couponCode` - Unique code (e.g., "MERC-ABC12345")
- `qrHash` - Signed hash for QR code security
- `status` - `issued`, `redeemed`, or `expired`
- `issuedAt` / `redeemedAt` - Timestamps
- `pdfUrl` - Link to PDF coupon (for storage)

### Coupon Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│ 1. MERCHANT CREATES BATCH                               │
│    POST /coupon-batches                                 │
│    - Validates merchant type vs batch type             │
│    - Checks quantity limits (temporary max 1000)       │
│    - Validates dates (start < end)                     │
│    - Generates QR code with signed hash                │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CUSTOMER SCANS QR CODE                               │
│    QR Format: {baseUrl}/review?mid={mid}&bid={bid}     │
│               &hash={signedHash}                        │
│    - Verify hash to prevent tampering                  │
│    - Load batch details                                │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. CUSTOMER SUBMITS REVIEW                              │
│    (To be implemented)                                  │
│    - Customer fills feedback form                      │
│    - System validates review                           │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. COUPON ISSUANCE                                      │
│    POST /coupons                                        │
│    - Generate unique coupon code                       │
│    - Assign to customer                                │
│    - Update batch.issuedQuantity                       │
│    - Status = "issued"                                 │
│    - Generate PDF (optional)                           │
│    - Send via WhatsApp (optional)                      │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. COUPON REDEMPTION                                    │
│    (To be implemented)                                  │
│    - Customer shows coupon at merchant POS             │
│    - Merchant scans/enters coupon code                 │
│    - System validates coupon                           │
│    - PATCH /coupons/:id { status: "redeemed" }        │
│    - Set redeemedAt timestamp                          │
└─────────────────────────────────────────────────────────┘
```

### Business Rules

#### Batch Type Validation
```
Merchant Type    | Can Create Annual? | Can Create Temporary?
-----------------|--------------------|---------------------
permanent        | ✅ YES             | ✅ YES
temporary        | ❌ NO              | ✅ YES
```

#### Quantity Limits
- **Annual batches**: Unlimited quantity
- **Temporary batches**: Maximum 1000 coupons

#### Date Validation
- `startDate` must be before `endDate`
- System checks at batch creation time

---

## 🔒 Security Features

### 1. **JWT Authentication**
- All routes protected by default
- Token contains user ID and role
- Use `@Public()` decorator to bypass

### 2. **QR Code Security**
- QR URLs contain signed HMAC SHA-256 hash
- Hash format: `HMAC(merchantId:batchId, secret)`
- Prevents URL tampering and unauthorized access

### 3. **Coupon Code Format**
- Format: `{MERCHANTPREFIX}-{XXXXXXXX}`
- 8 random characters (excludes similar chars: I, O, 0, 1)
- Unique constraint in database

### 4. **Soft Deletes**
- All entities use `deleted_at` timestamp
- Data never truly deleted (audit trail)
- Queries automatically filter deleted records

### 5. **Input Validation**
- class-validator decorators on all DTOs
- Whitelist mode (strips unknown properties)
- Type transformation enabled

---

## 🗄️ Database Schema

### Key Relationships

```
users
  ├─→ admins (1:1)
  ├─→ merchants (1:1)
  └─→ customers (1:1)

merchants
  ├─→ coupon_batches (1:N)
  └─→ coupons (1:N)

coupon_batches
  └─→ coupons (1:N)

customers
  └─→ coupons (1:N)

merchants
  └─→ feedbacks (1:N)

customers
  └─→ feedbacks (1:N)
```

### Foreign Key Behaviors
- **CASCADE**: `merchant → coupon_batches`, `batch → coupons`
- **SET NULL**: `customer → coupons`
- **RESTRICT**: None (to allow flexible data management)

---

## 🚀 API Usage Patterns

### 1. **Authentication Required Flow**

```bash
# Step 1: Login
POST /api/v1/auth/login
{
  "email": "admin@must.services",
  "password": "Pakistan@123"
}

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}

# Step 2: Use token in all subsequent requests
GET /api/v1/users
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. **Pagination Pattern**

```bash
GET /api/v1/users?page=1&pageSize=20

# Response
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

### 3. **Filtering Pattern**

```bash
# Get coupons for specific merchant
GET /api/v1/coupons?merchantId=1&status=issued

# Get coupons by batch
GET /api/v1/coupons?batchId=5

# Combine filters
GET /api/v1/coupons?merchantId=1&customerId=10&status=redeemed
```

### 4. **Create Coupon Batch Example**

```bash
POST /api/v1/coupon-batches
Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
Body: {
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

# Response includes QR code URL
{
  "id": 1,
  "batchName": "New Year 2025 Promotion",
  "qrCodeUrl": "http://localhost:3000/review?mid=1&bid=1&hash=abc123...",
  ...
}
```

---

## 🧪 Testing Guide

### Prerequisites
1. **Server Running**: `npm run start:dev`
2. **Database**: PostgreSQL running with migrations executed
3. **Postman**: Import `postman-collection.json`

### Testing Steps

#### 1. **Import Collection**
- Open Postman
- Click "Import" → Select `postman-collection.json`
- Collection will appear in left sidebar

#### 2. **Test Authentication**
```
1. Open "Authentication" folder
2. Click "Login" request
3. Click "Send"
4. ✅ Check response contains access_token
5. ✅ Token auto-saved to collection variable
6. ✅ All subsequent requests will use this token
```

**Default Credentials:**
- Email: `admin@must.services`
- Password: `Pakistan@123`

#### 3. **Test Merchants**
```
1. Open "Merchants" folder
2. Click "Get All Merchants"
3. Click "Send"
4. ✅ Should see list of merchants
5. Note: Copy a merchant ID for coupon batch creation
```

#### 4. **Create Coupon Batch**
```
1. Open "Coupon Batches" folder
2. Click "Create Coupon Batch"
3. Edit JSON body:
   - Set merchantId to existing merchant
   - Set dates in future
   - Choose batchType: "temporary" or "annual"
4. Click "Send"
5. ✅ Check response has QR code URL
6. ✅ Check issuedQuantity = 0
```

**Validation Tests:**
```
❌ Test 1: Temporary merchant + annual batch
   Expected: 400 Bad Request
   Message: "Temporary merchants can only create temporary batches"

❌ Test 2: Temporary batch with 1500 quantity
   Expected: 400 Bad Request
   Message: Quantity validation error

❌ Test 3: endDate before startDate
   Expected: 400 Bad Request
   Message: Date validation error
```

#### 5. **Create Coupon**
```
1. Open "Coupons" folder
2. Click "Create Coupon"
3. Edit JSON body:
   - Set batchId from previous step
   - Set merchantId (same as batch)
   - Set customerId (optional)
   - Set unique couponCode (e.g., "MERC-ABC12345")
4. Click "Send"
5. ✅ Check status = "issued"
```

#### 6. **Filter Coupons**
```
1. Click "Get All Coupons"
2. Enable query params:
   - merchantId: 1
   - status: issued
3. Click "Send"
4. ✅ Should see filtered results
```

#### 7. **Find Coupon by Code**
```
1. Click "Get Coupon by Code"
2. Replace code in URL: /coupons/by-code/MERC-ABC12345
3. Click "Send"
4. ✅ Should return single coupon
```

#### 8. **Update Coupon Status**
```
1. Click "Update Coupon"
2. Edit JSON body:
   { "status": "redeemed" }
3. Click "Send"
4. ✅ Check redeemedAt timestamp is set
```

---

## 🐛 Common Issues & Solutions

### Issue 1: 404 "Cannot POST /auth/login"
**Cause**: Missing `/api/v1` prefix  
**Solution**: Check `APP_ENV=local` in `.env` file

### Issue 2: 401 Unauthorized on all requests
**Cause**: Token not saved or expired  
**Solution**: Re-run Login request, check token in collection variables

### Issue 3: TypeORM relation error
**Cause**: Trying to join non-existent relations  
**Solution**: Check entity definitions, remove invalid `leftJoinAndSelect`

### Issue 4: Batch validation fails
**Cause**: Merchant type doesn't match batch type  
**Solution**: 
- Temporary merchants → Use `"batchType": "temporary"`
- Permanent merchants → Can use either type

### Issue 5: Database connection error
**Cause**: PostgreSQL not running or wrong credentials  
**Solution**: 
- Check PostgreSQL service is running
- Verify `.env` database credentials (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE)

---

## 📊 Environment Configuration

### Required Variables (.env)
```bash
# App
APP_ENV=local                    # local/development/production
APP_KEY=your-secret-key          # For HMAC hash generation
APP_FRONTEND_URL=http://localhost:3000  # For QR code URLs

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=your_database

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=7d
```

### Environment Behaviors
- `APP_ENV=local` → API prefix: `/api`
- `APP_ENV=development` → API prefix: None (direct `/v1`)
- `APP_ENV=production` → API prefix: None

---

## 🔄 Workflow Summary

### Typical User Journey

1. **Admin/Merchant Login** → Get JWT token
2. **Merchant Creates Batch** → QR code generated
3. **Merchant Prints QR Code** → Display at store
4. **Customer Scans QR** → Opens review page
5. **Customer Submits Review** → Validation
6. **System Issues Coupon** → Unique code generated
7. **Customer Receives Coupon** → Via WhatsApp/Download
8. **Customer Redeems Coupon** → At merchant POS
9. **System Marks as Redeemed** → Update status

### Current Implementation Status

✅ **Completed:**
- Authentication & Authorization
- User/Role/Admin/Merchant/Customer CRUD
- Feedback system
- Coupon batch creation with validation
- Coupon CRUD operations
- QR code generation with security
- Coupon code generation
- Merchant type validation
- Batch type validation
- Filtering & pagination

⏳ **Pending (Future Steps):**
- Customer review page (QR scan flow)
- Atomic coupon issuance with transactions
- PDF generation and storage
- WhatsApp integration
- Lucky draw system
- POS redemption interface
- Customer PII encryption

---

## 📝 Notes

- All timestamps are in UTC
- Soft deletes preserve data integrity
- QR codes are cryptographically signed
- Coupon codes are unique across system
- Merchant type determines batch permissions
- All mutations require authentication
- Pagination prevents large data dumps

---

## 🛠️ Development Commands

```bash
# Start development server
npm run start:dev

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert

# Generate migration
npm run migration:generate -- -n MigrationName

# Build for production
npm run build

# Start production server
npm run start:prod
```

---

**Last Updated**: December 18, 2025  
**API Version**: v1  
**Server**: http://localhost:8000/api/v1
