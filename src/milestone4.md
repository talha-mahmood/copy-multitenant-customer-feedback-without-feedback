# M4 Goal (What M4 Must Deliver)

M4 turns the system into a fully operational **growth + automation + monetization engine** by delivering:

1. WhatsApp Automation Engine (UI/BI classification + credit deduction + queue + logs)
2. Homepage Coupon Center + Paid Advertisement System (approval + targeting + billing + impressions)
3. Monthly PDF Statements (Master / Agent / Merchant) with company name
4. Support Inbox + Ticket System + Staff permissions (including Ad approval)
5. Agent Stripe API Key self-connection (agent collects merchant payments directly)
6. Credits Ledger + Fixed deduction points + Expiry refund rules (anti-loophole)
7. UX & data correctness improvements required for launch readiness

---

# 1. Coupon Templates (M4 MUST Include)

## 1.1 Merchant Upload Coupon Image Template (Annual + Temporary)

When creating a coupon batch, merchants must be able to:

* Upload their own coupon image (brand-designed template)
* System overlays or prints required fields (serial / QR / details) **OR** uses the image as base template (depending on implementation)

Generated output must still support:

* Unique serial numbers
* QR code per coupon
* Downloadable PDF batch

**Applies to:**

* Annual merchants
* Temporary merchants

---

## 1.2 Master Admin Coupon Template Library (Unlimited Upload)

Master Admin must be able to:

* Upload unlimited system coupon templates
* Enable / disable templates
* Categorize templates (optional but preferred)

These templates must be selectable by merchants during coupon creation.

---

# 2. Fixed Credit Logic (Anti-Loophole Rules) — MUST Be Hard-Coded

## 2.1 Credit Types (Separate Wallets)

System must maintain **three separate credit wallets**:

1. Coupon Credits
2. WhatsApp UI Credits (User-Initiated)
3. WhatsApp BI Credits (Business-Initiated)

UI must clearly display:

* Coupon Credits Remaining
* WhatsApp UI Credits Remaining
* WhatsApp BI Credits Remaining

❌ Do NOT label everything as “Total Remaining Coupons”.

---

## 2.2 Deduction Point #1 — Coupon Batch Generation

When merchant generates a coupon batch:

* Example: 1,000 coupons
* Immediately deduct **-1,000 Coupon Credits**

System generates:

* Unique serial numbers
* QR code per coupon
* PDF export
* Tracking records (status = Generated / Available)

✅ No WhatsApp cost at this stage.

---

## 2.3 Deduction Point #2 — Customer Claims Coupon

When a customer claims a coupon:

* Source A: In-store merchant QR flow
* Source B: Homepage “Get Coupon” flow

Then:

* Coupon status becomes **Taken / Claimed**
* Coupon Credit is **NOT refundable**
* WhatsApp cost (if any) is charged separately

---

## 2.4 Deduction Point #3 — WhatsApp Cost

WhatsApp credits are deducted **only when message is successfully sent / delivered**.

Rules:

* Meta already charges after delivery
* WhatsApp Sent ≠ Coupon Redeemed

---

## 2.5 Expiry Refund Rule

Refund applies **only to coupons that are NOT Taken**.

Example:

* Batch size: 1,000
* Taken: 100
* Not taken: 900
* Refund: **+900 Coupon Credits**

❌ Taken coupons are NOT refunded
❌ WhatsApp credits are NOT refunded

---

## 2.6 Coupon Status Model

Minimum required states:

1. Generated / Available
2. Taken / Claimed
3. WhatsApp Sent / Delivered
4. Redeemed

⚠️ WhatsApp Delivered ≠ Redeemed

---

## 2.7 Credits Ledger (Bank-Style)

Every credit movement must create a ledger entry:

* owner_type: merchant / agent / master
* owner_id
* credit_type: coupon / wa_ui / wa_bi
* action: purchase / deduct / refund / adjustment
* amount (+/-)
* related_object_id
* timestamp

This ledger powers **Monthly PDF Statements**.

---

# 3. WhatsApp Engine (M4 Core)

## 3.1 Message Classification (UI vs BI)

**User-Initiated (UI):**

* Homepage Get Coupon
* In-store claim flows

**Business-Initiated (BI):**

* Birthday campaigns
* Inactive recall
* Festival broadcasts

⚠️ Must be hard-coded by trigger source.

---

## 3.2 Required WhatsApp Features

### A. Coupon Delivery

* Send coupon via WhatsApp after claim
* Deduct correct UI / BI credits
* Log message ID, status, type, cost, coupon ID

### B. Birthday Campaign (BI)

* X days before / after birthday
* Auto-send coupons

### C. Inactive Customer Recall (BI)

* Trigger after X inactive days

### D. Festival Campaign (BI)

* Enable / disable per merchant

---

## 3.3 WhatsApp Message Format

Confirm feasibility:

* Image + caption coupon messages via WhatsApp Cloud API

---

## 3.4 Queue / Rate Limit / Retry

* Redis queue
* Rate limiting
* Auto retry
* Full message logs

---

# 4. Phone Number Auto-Recognition

* Detect existing customer by phone
* Auto-fill name & birthday
* Allow edit

Minimum: suggest previously used values.

---

# 5. Homepage Coupon Center

## 5.1 No Review Required

Flow:

1. Click Get Coupon
2. Enter name + phone + birthday
3. Coupon issued immediately
4. Status = Taken

---

## 5.2 Search & Filters

Filters:

* Country
* City / Region
* Category
* Popularity / Expiring Soon / Newest

Coupon creation must include category, city, business type.

---

# 6. Advertisement System

## 6.1 Ad Types

* Banner Ads
* Video Ads

## 6.2 Duration

* 7 / 14 / 30 days

## 6.3 Targeting

* Country
* City

## 6.4 Approval Workflow

* Master Ads: Master Admin / Staff
* Agent Ads: Agent

## 6.5 Metrics

* Start / End time
* Impressions
* Status

---

# 7. Agent Stripe API Key Self-Connect

## 7.1 Agent Payment Settings

* Stripe Publishable Key
* Stripe Secret Key
* Optional webhook secret

Payments go directly to **agent Stripe**.

---

# 8. Agent Wallet Deduction & Profit Rules

## 8.1 Pricing Control

Master Admin controls:

* Base pricing
* Platform cost
* Agent commission

Agents cannot modify prices.

---

## 8.2 Annual Merchant Revenue Split

* Merchant pays agent Stripe
* Platform cost deducted from agent wallet
* Agent keeps profit

Wallet must be prepaid.

---

## 8.3 Package Purchases

* Merchant pays agent Stripe
* Platform cost deducted from agent wallet
* Agent keeps profit

---

# 9. Monthly PDF Statements (With Company Name)

## 9.1 Auto Generation

* Generated monthly on day 1

## 9.2 Header

* Agent statement: Agent company name
* Merchant statement: Merchant company name
* Master statement: Platform company name

## 9.3 Merchant Statement

* Coupon stats
* WhatsApp UI / BI stats
* Credit balances
* Ads summary

## 9.4 Agent Statement

* New merchants
* Income
* Wallet usage
* Net profit

## 9.5 Master Statement

* Platform revenue
* WhatsApp volume
* Ad revenue
* Country & agent metrics

---

# 10. Support Inbox & Permissions

## 10.1 Support Channels (Only 3)

1. Agent → Main Platform
2. Main Platform Merchant → Main Platform
3. Agent Merchant → Agent

## 10.2 Core Features

* Inbox list
* Conversation view
* Manual reply
* Image attachment
* Read / unread

## 10.3 Not Required

* Ticket numbers
* SLA
* Automation
* Analytics

---

## 10.4 Data Isolation Rules

* Platform staff cannot see agent merchant chats
* Agents see only their merchants

---

# 11. Lucky Draw UI Fix

* Show reward labels on wheel
* Slower spin animation

---

# 12. M4 Acceptance Criteria

M4 is complete only if all listed systems function correctly, including:

* Coupon templates
* Credit logic
* WhatsApp automation
* Ads system
* Stripe agent payments
* Monthly PDFs
* Support inbox
* Phone auto-recognition
