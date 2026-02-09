# Quick Reference: Support System Frontend Updates

## File: `/qr-review-frontend/qr_tenants/.env.local`

**CHANGE FOR LOCAL TESTING:**
```env
# Comment these out:
# NEXT_PUBLIC_BACKEND_URL=https://qr-review.mustservices.io/backend
# NEXT_PUBLIC_API_BASE_URL=https://qr-review.mustservices.io/backend/api/v1

# Uncomment these:
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

---

## File: `/qr-review-frontend/qr_tenants/src/containers/support/index.jsx`

### Change 1: Update fetchData function (around line 68)

**FIND:**
```javascript
const convRes = await axiosInstance.get("/chat/conversations");
```

**REPLACE WITH:**
```javascript
const convRes = await axiosInstance.get("/chat/support/inbox");
```

---

### Change 2: Update conversation filtering (around line 200)

**FIND:**
```javascript
const currentConvs = conversations.filter(c => {
  if (isSuperAdmin) return c.type === 'SUPERADMIN_AGENT';
  if (isAgent) {
    return activeTab === "merchants" ? c.type === 'AGENT_MERCHANT' : c.type === 'SUPERADMIN_AGENT';
  }
  return c.type === 'AGENT_MERCHANT';
});
```

**REPLACE WITH:**
```javascript
const currentConvs = conversations.filter(c => {
  // Only show support tickets
  if (c.category !== 'support') return false;
  
  if (isSuperAdmin) return c.type === 'SUPERADMIN_AGENT';
  if (isAgent) {
    return activeTab === "merchants" ? c.type === 'AGENT_MERCHANT' : c.type === 'SUPERADMIN_AGENT';
  }
  return c.type === 'AGENT_MERCHANT';
});
```

---

### Change 3: Update message fetching (around line 183)

**FIND:**
```javascript
const fetchMessages = async () => {
  try {
    setMessagesLoading(true);
    const res = await axiosInstance.get(`/chat/conversations/${selectedConversation.id}/messages`, {
      params: { page: 1, limit: 100 }
    });
    setMessages(res.data.data || res.data || []);
    emit('joinConversation', { conversationId: selectedConversation.id });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    toast.error("Failed to load message history");
  } finally {
    setMessagesLoading(false);
  }
};
```

**REPLACE WITH:**
```javascript
const fetchMessages = async () => {
  try {
    setMessagesLoading(true);
    const res = await axiosInstance.get(`/chat/support/conversations/${selectedConversation.id}/messages`);
    
    // Support endpoint returns { conversation, messages }
    setMessages(res.data.messages || res.data.data || res.data || []);
    emit('joinConversation', { conversationId: selectedConversation.id });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    toast.error("Failed to load message history");
  } finally {
    setMessagesLoading(false);
  }
};
```

---

### Change 4: Update handleSend function (around line 250)

**FIND:**
```javascript
const handleSend = () => {
  if (!replyText.trim()) return;

  if (selectedConversation) {
    emit('sendMessage', {
      conversationId: selectedConversation.id,
      content: replyText
    });
  } else if (selectedParticipant) {
    const participantId = selectedParticipant.id;
    emit('sendMessage', {
      receiverId: participantId,
      type: activeTab === 'agents' ? 'SUPERADMIN_AGENT' : 'AGENT_MERCHANT',
      content: replyText
    });
  }

  setReplyText("");
};
```

**REPLACE WITH:**
```javascript
const handleSend = async () => {
  if (!replyText.trim()) return;

  try {
    if (selectedConversation) {
      // Send message to existing conversation
      const res = await axiosInstance.post(
        `/chat/support/conversations/${selectedConversation.id}/messages`,
        { message: replyText }
      );
      
      // Add message to local state
      setMessages(prev => [...prev, res.data]);
      
      // Also emit via socket for real-time updates
      emit('sendMessage', {
        conversationId: selectedConversation.id,
        content: replyText
      });
    } else if (selectedParticipant) {
      // Create new support conversation
      const res = await axiosInstance.post('/chat/support/conversations', {
        message: replyText
      });
      
      // Refresh inbox to show new conversation
      await fetchData();
      
      // Select the new conversation
      setSelectedConversation(res.data);
      setSelectedParticipant(null);
    }

    setReplyText("");
  } catch (error) {
    console.error("Failed to send message:", error);
    toast.error("Failed to send message. Please try again.");
  }
};
```

---

## Testing Commands

### 1. Start Backend (Terminal 1)
```bash
cd /Users/talhamahmood/Documents/boilerplate-backend
npm run start:dev
```

### 2. Run Migration (if not done)
```bash
cd /Users/talhamahmood/Documents/boilerplate-backend
npm run migration:run
```

### 3. Start Frontend (Terminal 2)
```bash
cd /Users/talhamahmood/Documents/boilerplate-backend/qr-review-frontend/qr_tenants
npm run dev
```

### 4. Access Frontend
Open browser: `http://localhost:3000`

---

## Test Flow

1. **Login as Merchant** → Go to Support page → Create a ticket
2. **Login as Agent** → Go to Support page → See merchant's ticket → Reply
3. **Login as Agent** → Create ticket to platform
4. **Login as Super Admin** → See agent's ticket → Reply

---

## Quick API Test (using curl)

```bash
# Get your JWT token from browser DevTools → Application → Local Storage → auth token

# Test get inbox
curl -X GET http://localhost:8000/api/v1/chat/support/inbox \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test create ticket
curl -X POST http://localhost:8000/api/v1/chat/support/conversations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test ticket"}'
```

---

## Expected Behavior

✅ **Merchant sees:**
- Can create support tickets
- Can see their own tickets only
- Can reply to their tickets
- Can see agent's replies

✅ **Agent sees:**
- Tab 1 (Merchants): All tickets from their merchants
- Tab 2 (Platform): Their own tickets to super admin
- Can reply to both
- Cannot see other agents' merchants

✅ **Super Admin sees:**
- Only tickets from agents
- Cannot see merchant tickets (they go to agents)
- Can reply to agent tickets

---

## Common Issues

### Issue: 404 Not Found
- Check backend is running: `npm run start:dev`
- Check URL is correct: `http://localhost:8000/api/v1/chat/support/inbox`

### Issue: No tickets showing
- Check database migration ran: `npm run migration:run`
- Check API returns data: Open DevTools → Network tab → Check response

### Issue: Can't send messages
- Check JWT token is valid
- Check user has correct role
- Check request payload format

---

## Summary of Changes

| Change | Old Endpoint | New Endpoint |
|--------|-------------|--------------|
| Get Inbox | `/chat/conversations` | `/chat/support/inbox` |
| Get Messages | `/chat/conversations/:id/messages` | `/chat/support/conversations/:id/messages` |
| Create Ticket | Socket emit | `POST /chat/support/conversations` |
| Send Reply | Socket emit | `POST /chat/support/conversations/:id/messages` |
