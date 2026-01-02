# Preset Reviews API - Bulk Operations

## Updated Endpoints

### 1. POST /preset-reviews - Single OR Bulk Create

**Single Create:**
```json
{
  "merchantId": 1,
  "reviewText": "Best coffee shop in town! Amazing ambiance and friendly staff.",
  "isActive": true,
  "displayOrder": 1
}
```

**Bulk Create (send array in `reviews` property):**
```json
{
  "reviews": [
    {
      "merchantId": 1,
      "reviewText": "Best coffee shop in town! Amazing ambiance and friendly staff!!",
      "isActive": true,
      "displayOrder": 1
    },
    {
      "merchantId": 1,
      "reviewText": "Outstanding service and delicious menu items!",
      "isActive": true,
      "displayOrder": 2
    },
    {
      "merchantId": 1,
      "reviewText": "Perfect spot for meetings and relaxation!",
      "isActive": true,
      "displayOrder": 3
    }
  ]
}
```

---

### 2. PATCH /preset-reviews - Bulk Update (new endpoint)

**Bulk Update (no :id in URL):**
```json
{
  "reviews": [
    {
      "id": 11,
      "reviewText": "Updated - Best coffee shop in town!",
      "isActive": true,
      "displayOrder": 1
    },
    {
      "id": 12,
      "reviewText": "Updated - Outstanding service!",
      "isActive": false,
      "displayOrder": 2
    },
    {
      "id": 13,
      "reviewText": "Updated - Perfect ambiance!",
      "isActive": true,
      "displayOrder": 3
    }
  ]
}
```

**Single Update (with :id in URL):**
```
PATCH /preset-reviews/11
```
```json
{
  "reviewText": "Updated review text - Outstanding service and quality!",
  "isActive": true,
  "displayOrder": 2
}
```

---

### 3. DELETE /preset-reviews - Bulk Delete (new endpoint)

**Bulk Delete (no :id in URL):**
```json
{
  "ids": [11, 12, 13]
}
```

**Single Delete (with :id in URL):**
```
DELETE /preset-reviews/11
```

---

## Complete Endpoint List

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/preset-reviews` | Create single OR bulk preset reviews |
| GET | `/preset-reviews` | Get all preset reviews (with filters) |
| GET | `/preset-reviews/seed-defaults` | Seed 10 system defaults |
| GET | `/preset-reviews/:id` | Get single preset review |
| PATCH | `/preset-reviews` | **Bulk update** preset reviews |
| PATCH | `/preset-reviews/:id` | Update single preset review |
| DELETE | `/preset-reviews` | **Bulk delete** preset reviews |
| DELETE | `/preset-reviews/:id` | Delete single preset review |

---

## Response Format

### Bulk Create Success:
```json
{
  "message": "3 preset reviews created successfully",
  "data": [
    { "id": 11, "merchant_id": 1, "review_text": "...", ... },
    { "id": 12, "merchant_id": 1, "review_text": "...", ... },
    { "id": 13, "merchant_id": 1, "review_text": "...", ... }
  ]
}
```

### Bulk Update Success:
```json
{
  "message": "3 preset reviews updated successfully",
  "data": [
    { "id": 11, "merchant_id": 1, "review_text": "Updated...", ... },
    { "id": 12, "merchant_id": 1, "review_text": "Updated...", ... }
  ],
  "errors": [
    { "id": 13, "error": "Cannot edit system default preset reviews" }
  ]
}
```

### Bulk Delete Success:
```json
{
  "message": "2 preset reviews deleted successfully",
  "data": {
    "deletedIds": [11, 12]
  },
  "errors": [
    { "id": 1, "error": "Cannot delete system default preset reviews" }
  ]
}
```

---

## Notes

1. **Automatic Detection**: The POST endpoint automatically detects if you're sending a single object or bulk by checking for the `reviews` property
2. **Error Handling**: Bulk operations return partial success - successful operations in `data`, failed ones in `errors`
3. **System Defaults Protected**: Cannot update or delete system default reviews (IDs 1-10)
4. **Authentication**: All create, update, and delete operations require JWT authentication

---

## Testing Examples

### Test Bulk Create
```bash
curl -X POST http://localhost:3000/preset-reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reviews": [
      {
        "merchantId": 1,
        "reviewText": "Best coffee shop in town!",
        "isActive": true,
        "displayOrder": 1
      },
      {
        "merchantId": 1,
        "reviewText": "Outstanding service!",
        "isActive": true,
        "displayOrder": 2
      }
    ]
  }'
```

### Test Bulk Update
```bash
curl -X PATCH http://localhost:3000/preset-reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reviews": [
      {
        "id": 11,
        "reviewText": "Updated text 1"
      },
      {
        "id": 12,
        "isActive": false
      }
    ]
  }'
```

### Test Bulk Delete
```bash
curl -X DELETE http://localhost:3000/preset-reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "ids": [11, 12, 13]
  }'
```
