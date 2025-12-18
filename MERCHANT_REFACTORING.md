# Merchant Entity Refactoring

## Overview
The merchant entity has been refactored to eliminate data duplication with the users table by using a foreign key relationship instead of duplicating user fields.

## Changes Made

### 1. Merchant Entity (`src/modules/merchants/entities/merchant.entity.ts`)

**REMOVED Fields:**
- `name` (string)
- `email` (string, unique)
- `phone` (string, unique)
- `password` (string)
- `isActive` (boolean)

**ADDED Fields:**
- `userId` (number) - Foreign key to users table
- `user` (User relation) - ManyToOne relationship with CASCADE delete

**KEPT Fields:**
- `address` (text, nullable)
- `businessName` (string, 255)
- `businessType` (string, 100)
- `merchantType` (string, 50) - 'temporary' or 'permanent'
- `taxId` (string, 100, nullable)

### 2. Migration (`src/database/migrations/1747400000001-create_merchants_table.ts`)

**Updated Schema:**
- Removed columns: `name`, `email`, `phone`, `password`, `isActive`
- Added column: `user_id` (int, not null)
- Added foreign key constraint: `user_id` → `users.id` with CASCADE delete
- Fixed column names to use snake_case: `business_name`, `business_type`, `merchant_type`, `tax_id`

### 3. DTOs (`src/modules/merchants/dto/`)

**CreateMerchantDto - Updated Fields:**
```typescript
{
  userId: number;         // NEW - Required, references User
  address?: string;       // Optional
  businessName: string;   // Required
  businessType: string;   // Required
  merchantType: string;   // Required - 'temporary' or 'permanent'
  taxId?: string;        // Optional
}
```

**Removed from DTO:**
- `name`, `email`, `phone`, `password` (now in User entity)

### 4. Service (`src/modules/merchants/merchant.service.ts`)

**Updated Functionality:**
- Removed password hashing (handled by User entity/service)
- Added user relationship loading in `findOne()` and `findAll()`
- Updated search to query user fields: `user.name`, `user.email`, `user.phone`
- Search also includes merchant-specific fields: `merchant.business_name`

## API Changes

### Creating a Merchant

**Current Request (Combined User + Merchant Creation):**
```json
POST /api/v1/merchants
{
  "email": "newuser@must.services",
  "password": "Password@123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "merchant",
  "business_name": "Test Business",
  "business_type": "Test Business Type",
  "merchant_type": "permanent",
  "address": "123 Main St",
  "tax_id": "123"
}
```

**What Happens:**
1. Creates a new User with email, password, and name (firstName + lastName)
2. Assigns the specified role to the user (creates user_has_role entry)
3. Creates the Merchant profile linked to the new user
4. All operations happen in a database transaction (atomic - all succeed or all fail)

**Validation:**
- Email must be unique (error if user already exists)
- Role must exist in the database
- All required fields must be provided
- Password must be at least 6 characters

### Response Format

Responses now include the related user object:

```json
{
  "message": "Success fetching merchant",
  "data": {
    "id": 1,
    "userId": 5,
    "address": "123 Main St",
    "businessName": "John's Store",
    "businessType": "Retail",
    "merchantType": "permanent",
    "taxId": "TAX123",
    "user": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "isActive": true
    },
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z"
  }
}
```

## Database Schema

### Merchants Table Structure

```sql
CREATE TABLE merchants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  address TEXT,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100) NOT NULL,
  merchant_type VARCHAR(50) NOT NULL,
  tax_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Benefits

1. **No Data Duplication:** User information stored once in the users table
2. **Data Consistency:** Updating user info automatically reflects in merchant
3. **CASCADE Delete:** Deleting a user automatically deletes their merchant profile
4. **Follows DRY Principle:** Don't Repeat Yourself - user fields defined once
5. **Better Normalization:** Proper database design with foreign key relationships
6. **Easier Maintenance:** Changes to user fields made in one place

## Migration Steps

To apply these changes to your database:

```bash
# The migrations have already been run
# If you need to revert and rerun:
npm run migration:revert  # Revert to before merchants table
npm run migration:run     # Apply updated schema
```

## Testing Workflow

**Single Request (Recommended):**

1. **Create Merchant (includes User + Role assignment)**
   ```json
   POST /api/v1/merchants
   {
     "email": "newmerchant@must.services",
     "password": "Password@123",
     "firstName": "John",
     "lastName": "Doe",
     "role": "merchant",
     "business_name": "My Business",
     "business_type": "Retail",
     "merchant_type": "permanent",
     "address": "123 Business Ave",
     "tax_id": "TAX-123-456"
   }
   ```

2. **Query Merchant** - Will include user relationship
   ```
   GET /api/v1/merchants/1
   ```

**Alternative (Manual - if you already have a user):**

If you need to create a merchant for an existing user, you would need to modify the DTO to support optional user fields and check if `user_id` is provided instead of creating a new user.

## Future Considerations

The same refactoring pattern should be applied to:
- **Admin Entity** - Currently has `name`, `email`, `phone`, `password`, `is_active`
- **Customer Entity** - May have similar duplicate fields

This would create a consistent pattern across all user-type entities:
- Base user info in `users` table
- Role-specific info in respective tables (merchants, admins, customers)
- Foreign key relationships with CASCADE behavior
