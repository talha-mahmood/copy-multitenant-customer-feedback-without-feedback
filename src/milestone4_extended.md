0) M4 Goal (What M4 must deliver)
 
 
M4 turns the system into a fully operational growth + automation + monetization engine by delivering:
1. WhatsApp Automation Engine (UI/BI classification + credit deduction + queue + logs)
2. Homepage Coupon Center + Paid Advertisement System (approval + targeting + billing + impressions)
3. Monthly PDF Statements (Master / Agent / Merchant) with company name
4. Support Inbox + Ticket System + Staff permissions (including Ad approval)
5. Agent Stripe API Key self-connection (agent collects merchant payments directly)
6. Credits Ledger + Fixed deduction points + Expiry refund rules (anti-loophole)
7. UX & data correctness improvements required for launch readiness
 
 
⸻
 
 
1) Coupon Templates (M4 MUST include)
 
 
1.1 Merchant Upload Coupon Image Template (Annual + Temporary)
 
 
When creating a coupon batch, merchants must be able to:
• Upload their own coupon image (brand-designed template)
• System overlays or prints required fields (serial / QR / details) OR uses the image as base template (depending on current implementation)
• Generated output must still support:
• unique serial numbers
• QR code per coupon
• downloadable PDF batch
 
 
✅ Applies to:
• Annual merchants
• Temporary merchants
 
 
⸻
 
 
1.2 Master Admin Coupon Template Library (Unlimited upload)
 
 
Master Admin must be able to:
• Upload unlimited system coupon templates
• Enable/disable templates
• Categorize templates (optional but preferred)
• These templates are selectable by merchants during coupon creation
 
 
⸻
 
 
2) Fixed Credit Logic (Anti-loophole Rules) — MUST be hard-coded
 
 
2.1 Credit Types (must be separate balances)
 
 
System must maintain three separate credit wallets (not mixed):
1. Coupon Credits (for generating coupon batches)
2. WhatsApp UI Credits (User-Initiated)
3. WhatsApp BI Credits (Business-Initiated)
 
 
UI must show them clearly as separate balances:
• Coupon Credits Remaining
• WhatsApp UI Credits Remaining
• WhatsApp BI Credits Remaining
 
 
(Do NOT label everything as “Total Remaining Coupons”.)
 
 
⸻
 
 
2.2 Deduction Point #1 — Coupon Batch Generation (Coupon Credits only)
 
 
When merchant generates a coupon batch:
• Example: create 1,000 coupons
• System immediately deducts: -1,000 Coupon Credits
• System generates:
• unique serial numbers
• QR per coupon
• PDF export
• tracking records (status = Generated/Available)
 
 
✅ Important:
• At this stage NO WhatsApp cost occurs.
 
 
⸻
 
 
2.3 Deduction Point #2 — Customer Claims Coupon (status becomes Taken, not refundable)
 
 
When a customer successfully claims a coupon (from either source):
• Source A: In-store merchant QR flow
• Source B: Homepage “Get Coupon” flow
 
 
Then:
• The coupon status becomes Taken/Claimed
• That coupon’s Coupon Credit is NOT refundable
• If WhatsApp delivery happens, WhatsApp credit is charged separately (see below)
 
 
⸻
 
 
2.4 Deduction Point #3 — WhatsApp Cost (deduct on Delivered/Sent success)
 
 
WhatsApp credits must be deducted only when message is successfully delivered / accepted by WhatsApp API (sent/delivered).
 
 
Reason:
• Meta has already charged the platform after successful send/delivery
• Therefore cost must be counted and deducted
 
 
✅ Rule:
• WhatsApp Sent/Delivered ≠ Redeemed
• Sending WhatsApp does NOT mean the customer used the coupon in-store.
 
 
⸻
 
 
2.5 Expiry Refund Rule (ONLY refund “Not Taken” coupons)
 
 
To prevent loopholes and ensure fairness:
 
 
✅ Expiry Refund happens ONLY for coupons that remain:
• Generated/Available (NOT Taken)
 
 
Example:
• Batch size = 1000
• Taken = 100
• Remaining not taken = 900
• When batch expires:
• refund +900 Coupon Credits to merchant wallet
• write a refund entry in credit ledger
 
 
❌ Coupons that are Taken/Claimed are NOT refunded
❌ WhatsApp credits are NOT refunded (Meta already charged)
 
 
⸻
 
 
2.6 Coupon Status Model (Minimum required states)
 
 
System must support at least these states (must be visible in logs/exports):
1. Generated/Available
2. Taken/Claimed
3. WhatsApp Sent/Delivered (message status)
4. Redeemed (manual or scan verification by merchant)
 
 
Critical clarification:
WhatsApp Delivered is NOT Redeemed.
 
 
⸻
 
 
2.7 Credits Ledger (Bank-style accounting record)
 
 
Every credit movement must create a ledger record:
• owner_type: merchant / agent / master
• owner_id
• credit_type: coupon / wa_ui / wa_bi
• action: purchase / deduct / refund / adjustment
• amount (+/-)
• related_object_id: coupon_batch_id / coupon_id / message_id / ad_id
• timestamp
 
 
This ledger is the foundation of Monthly PDF Statements.
 
 
⸻
 
 
3) WhatsApp Engine (M4 Core)
 
 
3.1 Message Types (UI vs BI) — must be classified correctly
 
 
System must classify every message as:
 
 
User-Initiated (UI) — cheaper
 
 
Triggered ONLY by user actions, e.g.:
• Homepage: user clicks “Get Coupon” → WhatsApp sends coupon
• In-store: customer completes flow → WhatsApp sends coupon (if WA is used)
 
 
Business-Initiated (BI) — much more expensive (10x+)
 
 
Triggered by system automation, e.g.:
• Birthday campaign
• Inactive customer recall (N days no return)
• Festival broadcasts
• Scheduled campaigns
 
 
⚠️ Misclassification can destroy profit margin. Must be hard-coded by trigger source.
 
 
⸻
 
 
3.2 Required WhatsApp Features (must be implemented in M4)
 
 
(A) WhatsApp Coupon Delivery
• Send coupon details via WhatsApp after successful claim
• Must deduct WA credits based on UI/BI classification
• Must log:
• message id
• status (sent/delivered/failed)
• type (UI/BI)
• cost credits deducted
• related coupon id
 
 
(B) Birthday Campaign Automation (BI)
 
 
Merchant sets:
• X days before birthday
• X days after birthday
System sends birthday coupons automatically.
 
 
(C) Inactive Customer Recall (BI)
 
 
Merchant sets:
• If customer has not returned for X days → send recall coupon
 
 
(D) Festival Campaign (BI)
 
 
Merchant can enable/disable festival campaigns.
 
 
⸻
 
 
3.3 WhatsApp Message Format Requirement (Question to confirm)
 
 
Confirm feasibility:
• Can WhatsApp send coupon image (image + caption) instead of text only?
If allowed by WhatsApp Cloud API:
• implement image template messages (or media message) for better “tech” feel.
 
 
⸻
 
 
3.4 Queue / Rate Limit / Retry (must be included)
 
 
WhatsApp sending must use queue to avoid overload:
• Redis queue
• rate limiting
• automatic retry for failed messages
• message logs must show success/failure counts
 
 
⸻
 
 
4) Phone Number Auto-Recognition (M4 MUST include)
 
 
To reduce user friction:
• When customer enters phone number again:
• system should auto-detect existing record
• auto-fill name and birthday
• customer can confirm/edit (optional)
 
 
If not feasible in first pass:
• at minimum, store and suggest previously entered values.
 
 
⸻
 
 
5) Homepage Coupon Center (M4 MUST include)
 
 
5.1 No Review Required on Homepage
 
 
Homepage “Get Coupon” flow MUST be:
1. user clicks Get Coupon
2. enter name + phone + birthday (required)
3. coupon issued immediately (WhatsApp if enabled)
4. record Taken + logs
 
 
No review flow on homepage.
 
 
⸻
 
 
5.2 Search & Filters (required)
 
 
Homepage must allow filters:
• country
• city/region
• category (restaurant / clothing / etc.)
• popularity / expiring soon / newest
 
 
Therefore coupon creation form must include:
• category
• city/region
• business type
 
 
⸻
 
 
6) Advertisement System (M4 MUST include)
 
 
6.1 Ad Types
• Banner Ads
• Video Ads
 
 
6.2 Duration
• 7 / 14 / 30 days
 
 
6.3 Targeting
• country targeting
• city targeting
 
 
6.4 Approval Workflow (roles)
• Master platform ads: Master Admin / Staff approves
• Agent platform ads: Agent approves
(Staff can be assigned “Ad Approver” permission.)
 
 
6.5 Metrics (basic impressions)
 
 
Record at least:
• start time / end time
• impressions count (basic exposure)
• status: pending / approved / rejected / expired
 
 
⸻
 
 
7) Agent Stripe API Key Self-Connect (M4 MUST include)
 
 
7.1 Agent Payment Settings Page
 
 
Agent dashboard must include:
• Stripe Publishable Key
• Stripe Secret Key
• (optional) webhook secret
 
 
System uses agent’s keys to create checkout.
Result: merchant payments go directly to agent’s Stripe.
 
 
⸻
 
 
😎 Agent Wallet Deduction + Profit Rules (M4 MUST include)
 
 
8.1 Master Admin controls ALL base pricing
 
 
Agents cannot modify:
• annual merchant fee
• UI/BI package pricing
• temporary merchant UI pricing
 
 
Master Admin sets:
• base price per item/package
• agent profit / commission configuration
• platform cost to deduct from agent wallet
 
 
⸻
 
 
8.2 Annual Merchant revenue split
 
 
If merchant registers via agent site:
• merchant pays annual fee to agent Stripe
• system deducts platform cost from agent wallet
• agent keeps profit difference
 
 
Wallet must be prepaid:
• if agent wallet insufficient → activation must fail or remain pending until top-up.
 
 
⸻
 
 
8.3 Package purchase deduction (UI/BI/Temp UI)
 
 
When merchant buys a package via agent:
• merchant pays agent Stripe
• system deducts platform cost from agent wallet
• agent keeps profit
 
 
This ensures platform earns and agent needs prepaid wallet → strong cash flow model.
 
 
⸻



9) Monthly PDF Statements (M4 MUST include, with company name)
 
 
9.1 Auto-generate schedule

• Every month on day 1: auto-generate statements
 
 
9.2 Statement header must show company name

• Agent statement: show agent company name

• Merchant statement: show merchant company name

• Master statement: show master platform company name
 
 
9.3 Merchant Statement content (bank-style)
 
 
Must include:

Coupon:

• generated

• taken

• redeemed

• expired-not-taken refunded

WhatsApp:

• UI count (success/fail)

• BI count (success/fail)

• credits used

Credits:

• opening balance / closing balance for each credit type

• coupon credits, wa_ui credits, wa_bi credits

Ads:

• ad purchases, duration, targeting, amount
 
 
9.4 Agent Statement content

• new merchants

• annual fee income

• package income

• costs deducted from wallet

• net profit

• wallet opening/closing

• ledger lines
 
 
9.5 Master Admin Statement content

• total platform revenue

• total WhatsApp volume UI/BI

• ad revenue

• country distribution

• top agents metrics

• full ledger overview
 
 
⸻
 
 
10) Support Inbox + Ticket System + Staff Permissions (M4 MUST include)
 
 
10.1 Support separation

• Agent support: agent handles own merchants

• Master support:

• agent support inbox

• master merchant support inbox
 
 
10.2 Staff permission model (required)
 
 
Roles suggested:

1. Support Staff (reply tickets)

2. Ad Approver Staff (approve/reject ads)

3. Finance Viewer (view statements/ledger)

4. Super Admin (full control)
 
 
Staff must be able to approve ads (as you required).
 
 
⸻
 
 
11) Lucky Draw UI Clarification (M4 UI/UX fix)
 
 
Lucky draw wheel must display reward text on the wheel:

• reward labels visible (e.g., “RM5 Voucher”, “Free Drink”, “No Prize”)

• spin animation slightly slower for better engagement
 
 
⸻
 
 
12) M4 Acceptance Criteria (What “Done” means)
 
 
M4 is complete only if:

• coupon template upload (merchant) works

• master template library upload works

• UI/BI credits separated + correct deductions

• expiry refunds only for not-taken coupons

• ledger exists for every credit movement

• WhatsApp queue + logs + retry works

• agent stripe key connect works + payments go to agent stripe

• platform cost deducted from agent wallet automatically

• homepage coupon center works (no review required)

• banner/video ads + duration + targeting + approval works

• monthly PDFs generated with correct company names

• support inbox + staff permissions + ad approval works

• phone auto-recognition implemented (or minimum viable autofill)
 



System Overview (Important)
 
 
This is NOT a complex ticketing or helpdesk system.
 
 
The support system is only:
 
 
A backend inbox where messages are received and replied to manually.
 
 
No automation, no ticket workflow, no SLA logic.
 
 
⸻
 
 
2️⃣ Support Channels (Only 3 – No More)
 
 
1️⃣ Main Platform – Agent Support
 
 
Purpose

Used by White-Label Agents to contact the Main Platform.
 
 
Who sends messages

• White-Label Agents
 
 
Who replies

• Main Platform staff (Master Admin or authorized employees)
 
 
⸻
 
 
2️⃣ Main Platform – Merchant Support
 
 
Purpose

Used by merchants who registered directly on the main platform.
 
 
Includes:

• Annual merchants

• Temporary merchants
 
 
Who sends messages

• Main-platform Annual Merchants

• Main-platform Temporary Merchants
 
 
Who replies

• Main Platform staff
 
 
⸻
 
 
3️⃣ White-Label Agent Support (Agent-Owned)
 
 
Purpose

Used by merchants under a specific agent.
 
 
Includes:

• Agent’s Annual Merchants

• Agent’s Temporary Merchants
 
 
Who sends messages

• Agent’s merchants
 
 
Who replies

• The agent

• Agent’s own staff
 
 
📌 The main platform does not reply to agent merchants.
 
 
⸻
 
 
3️⃣ Core Support Functionality (Minimal & Required)
 
 
Each support inbox must support:

• Message list (Inbox)

• Display:

• Sender name

• Sender role (Agent / Merchant / Temporary Merchant)

• Timestamp

• Message view (conversation thread)

• Manual reply (text)

• Optional image attachment

• Read / Unread status
 
 
That’s all.
 
 
⸻
 
 
4️⃣ What Is NOT Required (Do NOT Build)
 
 
The following must NOT be implemented in M4:

• ❌ Ticket numbers

• ❌ Ticket priority

• ❌ SLA / response time rules

• ❌ Auto assignment

• ❌ Multi-stage ticket status

• ❌ Analytics dashboards for support
 
 
This is intentional to keep M4 focused and efficient.
 
 
⸻
 
 
5️⃣ Data Isolation Rules (Very Important)
 
 
Main Platform Support Staff Can See:

• Messages from White-Label Agents

• Messages from Main-Platform Merchants

• ❌ Cannot see agent merchant conversations
 
 
⸻
 
 
White-Label Agents Can See:

• Messages from their own merchants only

• ❌ Cannot see other agents

• ❌ Cannot see main-platform merchants
 
 
⸻
 
 
6️⃣ Role & Identity Binding (System Logic)
 
 
The system must automatically:

• Identify who sent the message

• Identify which platform or agent they belong to

• Route the message to the correct inbox
 
 
No manual routing is needed.
 
 
⸻
 
 
7️⃣ Permission Levels (Simple)
 
 
Main Platform Staff Permissions

• Reply to:

• Agent support messages

• Main-platform merchant messages

• Cannot access agent-owned merchant data
 
 
⸻
 
 
Agent Staff Permissions

• Reply only to:

• Their own merchants

• Cannot access:

• Other agents

• Main platform data
 
 
⸻
 
 
8️⃣ Summary for Developers (One Paragraph)
 
 
The support system is a simple inbox with manual replies.
 
 
No ticket workflow, no automation, no SLA.
 
 
Only 3 support channels with strict data isolation:

• Agent → Main Platform

• Main-platform Merchant → Main Platform

• Agent Merchant → Agent
 
 
⸻
 
 
9️⃣ Recommendation (From Business Side)
 
 
This design:

• Keeps M4 on schedule

• Avoids overengineering

• Reduces cost

• Allows future upgrade to a ticket system if needed
 

