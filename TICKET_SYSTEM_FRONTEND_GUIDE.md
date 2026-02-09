# Support/Ticket System - Frontend Implementation & Testing Guide

## Overview
The ticket/support system has been implemented on the backend and needs to be integrated with your existing frontend. Your frontend already has a support container, but it's currently using the regular chat endpoints. We need to update it to use the new support-specific endpoints.

---

## Backend Endpoints Implemented

### 1. Create Support Conversation (Ticket)
**POST** `/chat/support/conversations`
```json
{
  "message": "I need help with...",
  "image_url": "optional-image-url"
}
```

### 2. Get Support Inbox
**GET** `/chat/support/inbox`
- Returns all support conversations with proper data isolation
- Super Admin: sees agent support messages only
- Agent: sees their own messages to platform + messages from their merchants
- Merchant: sees only their own conversations with their agent

### 3. Get Support Messages
**GET** `/chat/support/conversations/:id/messages`
- Returns all messages for a specific support conversation
- Marks messages as read automatically

### 4. Send Support Message (Reply)
**POST** `/chat/support/conversations/:id/messages`
```json
{
  "message": "Here is my response...",
  "image_url": "optional-image-url"
}
```

---

## Frontend Changes Required

### Step 1: Update Support Container API Calls

Update `/qr-review-frontend/qr_tenants/src/containers/support/index.jsx`:

#### Change #1: Update Fetch Conversations
Replace line ~68:
```javascript
// OLD
const convRes = await axiosInstance.get("/chat/conversations");

// NEW
const convRes = await axiosInstance.get("/chat/support/inbox");
```

#### Change #2: Update Fetch Messages
Replace line ~183:
```javascript
// OLD
const res = await axiosInstance.get(`/chat/conversations/${selectedConversation.id}/messages`, {
  params: { page: 1, limit: 100 }
});

// NEW
const res = await axiosInstance.get(`/chat/support/conversations/${selectedConversation.id}/messages`);
// Note: Support endpoint returns { conversation, messages } format
setMessages(res.data.messages || res.data.data || res.data || []);
```

#### Change #3: Update Create New Conversation
Find where new conversations are created (likely in handleSend or similar):
```javascript
// OLD
emit('sendMessage', {
  receiverId: participantId,
  type: activeTab === 'agents' ? 'SUPERADMIN_AGENT' : 'AGENT_MERCHANT',
  content: replyText
});

// NEW - Use HTTP POST instead of socket
const response = await axiosInstance.post('/chat/support/conversations', {
  message: replyText,
  image_url: imageUrl // if you have image upload
});
// Then refresh the inbox
fetchData();
```

#### Change #4: Update Send Message in Existing Conversation
```javascript
// OLD
emit('sendMessage', {
  conversationId: selectedConversation.id,
  content: replyText
});

// NEW - Use HTTP POST instead of socket
const response = await axiosInstance.post(`/chat/support/conversations/${selectedConversation.id}/messages`, {
  message: replyText,
  image_url: imageUrl // if you have image upload
});
// Add message to local state immediately
setMessages(prev => [...prev, response.data]);
```

### Step 2: Update Conversation Filtering

The backend now returns conversations with a `category` field:
- `category: 'support'` - Support tickets
- `category: 'chat'` - Regular chat

Update your filtering logic around line ~200:
```javascript
const currentConvs = conversations.filter(c => {
  // Only show support category conversations
  if (c.category !== 'support') return false;
  
  if (isSuperAdmin) return c.type === 'SUPERADMIN_AGENT';
  if (isAgent) {
    return activeTab === "merchants" ? c.type === 'AGENT_MERCHANT' : c.type === 'SUPERADMIN_AGENT';
  }
  return c.type === 'AGENT_MERCHANT';
});
```

### Step 3: Handle New Response Format

The support messages endpoint returns:
```json
{
  "conversation": { /* conversation object */ },
  "messages": [ /* array of messages */ ]
}
```

Update your message loading:
```javascript
const fetchMessages = async () => {
  try {
    setMessagesLoading(true);
    const res = await axiosInstance.get(`/chat/support/conversations/${selectedConversation.id}/messages`);
    
    // Handle new response format
    if (res.data.messages) {
      setMessages(res.data.messages);
    } else if (Array.isArray(res.data)) {
      setMessages(res.data);
    } else {
      setMessages([]);
    }
    
    emit('joinConversation', { conversationId: selectedConversation.id });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    toast.error("Failed to load message history");
  } finally {
    setMessagesLoading(false);
  }
};
```

### Step 4: Add Visual Indicator for Support Tickets

Update the conversation list item to show it's a support ticket:
```jsx
<Badge variant="outline" className="text-xs">
  <HelpCircle className="h-3 w-3 mr-1" />
  Support
</Badge>
```

---

## Testing Guide

### Step 1: Connect to Local Backend

1. **Update .env.local** in `/qr-review-frontend/qr_tenants/.env.local`:
```env
# Comment out production URLs
#NEXT_PUBLIC_BACKEND_URL=https://qr-review.mustservices.io/backend
#NEXT_PUBLIC_API_BASE_URL=https://qr-review.mustservices.io/backend/api/v1

# Uncomment local URLs
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

2. **Start Backend Server**:
```bash
cd /Users/talhamahmood/Documents/boilerplate-backend
npm run start:dev
```
Backend should be running on `http://localhost:8000`

3. **Start Frontend Server**:
```bash
cd /Users/talhamahmood/Documents/boilerplate-backend/qr-review-frontend/qr_tenants
npm install  # if not already done
npm run dev
```
Frontend should be running on `http://localhost:3000`

### Step 2: Test User Flows

#### Test as Merchant:
1. Login as a merchant
2. Navigate to `/merchant/support` or similar support route
3. Click "Create New Ticket" or similar button
4. Send a message: "I need help with my coupon batch"
5. Verify the ticket appears in your inbox
6. Send another message to test replies

#### Test as Agent:
1. Login as an agent
2. Navigate to agent support page
3. Switch between tabs:
   - **Merchants Tab**: Should see tickets from your merchants
   - **Platform Tab**: Should see your tickets to super admin
4. Click on a merchant ticket
5. Send a reply: "I'll help you with that..."
6. Create a new ticket to platform: "I need platform assistance"

#### Test as Super Admin:
1. Login as super admin
2. Navigate to master admin support page
3. Should see only tickets from agents (no merchant tickets)
4. Click on an agent ticket
5. Send a reply
6. Verify data isolation is working

### Step 3: Test Real-time Updates

1. Open two browser windows:
   - Window 1: Merchant account
   - Window 2: Agent account (the merchant's agent)
2. In Window 1 (Merchant): Send a support message
3. In Window 2 (Agent): Should see the new message appear (if WebSocket is connected)
4. In Window 2 (Agent): Reply to the ticket
5. In Window 1 (Merchant): Should see the reply appear

### Step 4: Test Edge Cases

1. **Empty State**: Verify UI shows proper empty state when no tickets exist
2. **Loading State**: Check loading spinners appear during API calls
3. **Error Handling**: Disconnect backend and verify error messages appear
4. **Read Status**: Verify unread tickets are highlighted
5. **Last Message**: Verify conversation list shows the last message preview
6. **Timestamps**: Check timestamps are formatted correctly

---

## Database Migration

Before testing, make sure to run the database migration to add the new support fields:

```bash
cd /Users/talhamahmood/Documents/boilerplate-backend
npm run migration:run
```

This will add:
- `category` field to conversations table
- `last_message`, `last_message_at`, `is_read` fields to conversations
- `sender_name`, `image_url` fields to messages table

---

## API Testing with Postman/Thunder Client

### Create Support Ticket
```http
POST http://localhost:8000/api/v1/chat/support/conversations
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "I need help with my account",
  "image_url": "https://example.com/screenshot.png"
}
```

### Get Support Inbox
```http
GET http://localhost:8000/api/v1/chat/support/inbox
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Ticket Messages
```http
GET http://localhost:8000/api/v1/chat/support/conversations/1/messages
Authorization: Bearer YOUR_JWT_TOKEN
```

### Reply to Ticket
```http
POST http://localhost:8000/api/v1/chat/support/conversations/1/messages
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "Here is the solution to your problem...",
  "image_url": "https://example.com/solution.png"
}
```

---

## Troubleshooting

### Issue: "Cannot read property 'id' of undefined"
**Solution**: The response format changed. Update to use `res.data.messages` instead of `res.data`.

### Issue: CORS errors
**Solution**: Make sure backend CORS is configured to allow `http://localhost:3000`:
```typescript
// In backend main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'https://qr-review.mustservices.io'],
  credentials: true,
});
```

### Issue: 401 Unauthorized
**Solution**: Check your JWT token is being sent correctly. In axios config:
```javascript
axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Issue: WebSocket not connecting
**Solution**: Update WebSocket URL in your socket hook:
```javascript
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
```

### Issue: Messages not showing
**Solution**: Check the response format. Support endpoints return:
```json
{
  "success": true,
  "data": { "conversation": {...}, "messages": [...] }
}
```
or
```json
{
  "conversation": {...},
  "messages": [...]
}
```

---

## Key Differences: Support vs Regular Chat

| Feature | Regular Chat | Support Tickets |
|---------|--------------|----------------|
| Endpoint | `/chat/conversations` | `/chat/support/inbox` |
| Category | `'chat'` | `'support'` |
| Purpose | General messaging | Help/support requests |
| Data Isolation | Basic | Strict (agents can't see other agents' merchants) |
| UI Indicator | None | Support badge/icon |

---

## Next Steps

1. ✅ Update support container API calls
2. ✅ Test create ticket flow
3. ✅ Test inbox loading
4. ✅ Test message replies
5. ✅ Test data isolation for each role
6. ✅ Add visual indicators (support badge)
7. ✅ Test with real-time WebSocket updates
8. Deploy to production when testing complete

---

## Questions or Issues?

If you encounter any issues during implementation:
1. Check browser console for error messages
2. Check backend logs: `npm run start:dev` output
3. Verify JWT token is valid and not expired
4. Test API endpoints directly with Postman first
5. Check that database migration ran successfully
