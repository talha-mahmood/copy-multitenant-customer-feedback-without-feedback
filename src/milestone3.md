# Milestone 3 – Full Functional Specification

*(Based on Original Contract + M2 Gaps + New Confirmed Business Logic)*

---

## Overall Customer Flow

When a customer scans the merchant’s QR code in-store:

1. Customer is required to enter:

   * Name
   * Phone number
   * Date of birth
2. Customer selects a review option (preset or custom).
3. If **Lucky Draw** is enabled:

   * Customer participates in the draw and receives the reward accordingly.
4. If **Lucky Draw** is not enabled:

   * Customer receives a coupon directly.

> **Note:** All flows (review, lucky draw, coupon issuance) are fully controlled by the merchant’s settings.

---

# 🔴 A. Items Originally Planned for M3 (From Contract)

## 1️⃣ Customer Review & Redirect System

### (10 Preset Review Sentences + Multi-Platform Redirect)

### Customer Flow

* Customer scans merchant QR code.
* Customer must fill in:

  * Name
  * Phone number
  * Date of birth
* Customer chooses:

  * ⭐ Positive preset review **OR**
  * ✍️ Write their own review text
* Customer selects **one** social platform to post the review:

  * Google Reviews
  * Facebook Page
  * Instagram (profile / post / DM link as configured)
  * XiaoHongShu (RED)
* Platform availability is controlled by merchant settings.
* System redirects customer to the selected platform review page.

### Preset Review Sentences

* Default: **10 preset review sentences** provided by the system.
* Merchant can:

  * Edit existing sentences
  * Replace with their own sentences
  * Enable / disable preset usage

### Tracking

System records:

* Which customer entered the flow
* Which platform was selected
* Whether redirect was completed

Used for:

* Analytics
* Reward logic

### Purpose

* Drive real, traceable reviews
* Prevent fake reviews
* Connect reviews to coupon / reward logic

---

## 2️⃣ Coupon Reward After Review (Optional)

### Merchant Configuration

* Reward after successful review
* No reward (review only)

### If Enabled

* Customer receives a coupon via **WhatsApp**
* Coupon includes:

  * Unique serial code
  * QR code
  * Merchant name & address
  * Expiry date

---

## 3️⃣ Lucky Draw Module (Optional)

### Merchant Setup

* Enable / disable lucky draw
* Configure:

  * Prize list
  * Probability per prize
  * Daily limits
  * Total limits

### Customer Flow

* After review submission:

  * Customer can spin lucky draw (if enabled)
* System:

  * Determines prize based on probability
  * Records the result
  * Sends result via WhatsApp

---

# 🔴 B. WhatsApp Automation & Tracking (Core Monetization Logic)

## 4️⃣ WhatsApp Coupon Delivery (**NO Copy Code**)

❌ **No “Copy Code” button allowed**

### Correct Flow

1. Customer clicks **Get Coupon**
2. Customer fills in:

   * Name
   * Phone number
   * Birthday
3. System sends coupon **ONLY via WhatsApp**

### Coupon Content

* Unique serial code
* QR code
* Merchant address
* Google Maps link

### Reason

* Platform monetizes via:

  * WhatsApp message cost
  * Coupon issuance tracking
* No direct web coupon usage allowed

---

## 5️⃣ WhatsApp Scheduled Messages

### Merchant Can Configure

* 🎂 Birthday coupon:

  * Send X days before birthday
* 💤 Inactive customer reminder:

  * After X days of no visit
* 🎉 Festival / campaign messages

### System Records

* Number of WhatsApp messages sent
* Cost per message
* Conversion:

  * Coupon used
  * Coupon unused

---

# 🔴 C. Customer Data Logging & Analytics

## 6️⃣ Customer Data Collection

System logs:

* Name
* Phone number
* Birthday
* Coupon issued
* Coupon redeemed
* Review platform used
* Lucky draw participation

---

## 7️⃣ Merchant Analytics Dashboard

Merchant can view:

* Total coupons issued
* Total coupons redeemed
* WhatsApp messages sent
* Returning customers
* Review completion count
* Lucky draw participation

---

# 🔴 D. Platform Marketplace & Paid Exposure

## 8️⃣ Public Coupon Marketplace (Homepage)

### Merchant Options

Merchants can submit coupons to the platform homepage.

### Required Fields

* Business category
* Region / city
* Coupon description

### Visibility Logic

* Organic visibility (limited)
* Paid exposure:

  * Homepage placement
  * Region-based promotion

---

## 9️⃣ Customer Search Function

Public users can:

* Search by:

  * Region
  * Business type (restaurant, cafe, salon, etc.)
* View merchant coupons
* Click **Get Coupon** → WhatsApp flow starts

---

# 🔴 E. M2 Items NOT Fully Completed → Must Be Finished in M3

## 🔟 Admin / Master Admin Controls (**Critical**)

### Current Status

* Exist conceptually
* NOT fully implemented

### Must Be Fully Functional in M3

* White-label agent annual fee configuration
* Country-exclusive authorization (one agent per country)
* Admin approval flows:

  * Approve / reject agents
  * Approve / reject merchants
* Full backend control of:

  * Pricing
  * Packages
  * Credits
  * WhatsApp cost logic

---

## 1️⃣1️⃣ Coupon Creation Enhancement (**New Addition**)

### When Merchant Creates a Coupon

Add optional field:

* ✅ Halal
* ❌ Non-Halal

*(Merchant may skip this field)*

### Used For

* Customer filtering
* Region compliance
* Platform trust

---

# 🔴 F. Paid Ads & Coupon Promotion (From Original M3)

## 1️⃣2️⃣ Paid Ad Formats

* Homepage featured slot
* Category-based placement
* Region-based promotion

### Admin Controls

* Pricing per placement
* Duration
* Visibility rules

---

# 🔴 G. Final M3 Completion Criteria

Milestone 3 is considered **COMPLETE** only if:

* WhatsApp-based coupon delivery is live
* Review → reward → tracking loop is fully functional
* Admin pricing & approval logic works end-to-end
* ❌ No coupon can be redeemed without WhatsApp issuance
* Merchant analytics reflects real customer actions
