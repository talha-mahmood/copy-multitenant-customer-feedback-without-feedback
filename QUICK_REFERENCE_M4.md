# Milestone 4 Extended - Quick Reference Guide

## 🚀 Quick Start

### What's New?
- **Credits Ledger**: Bank-style accounting for all credit movements
- **Monthly Statements**: Auto-generated PDF reports on 1st of each month
- **Expiry Refunds**: Automatic refund of unused coupon credits
- **WhatsApp Tracking**: Complete audit trail for UI/BI message costs

---

## 📝 Key Endpoints

### Credits Ledger
```bash
# Get ledger entries
GET /api/v1/credit-ledgers?owner_type=merchant&owner_id=5

# Get current balances
GET /api/v1/credit-ledgers/balances?owner_type=merchant&owner_id=5
```

### Monthly Statements
```bash
# Generate statement
POST /api/v1/monthly-statements/generate
Body: {"year": 2026, "month": 1, "owner_type": "merchant", "owner_id": 5}

# List statements
GET /api/v1/monthly-statements?owner_type=merchant&owner_id=5

# Download PDF
GET /api/v1/monthly-statements/:id/download
```

---

## 🔄 Credit Types

| Type | Code | Used For |
|------|------|----------|
| Coupon | `coupon` | Generating coupon batches |
| WhatsApp UI | `wa_ui` | User-initiated messages (feedback, homepage) |
| WhatsApp BI | `wa_bi` | Business-initiated (birthday, festivals) |
| Paid Ads | `paid_ads` | Advertisement campaigns |

---

## 📊 Ledger Actions

| Action | Amount | Description |
|--------|--------|-------------|
| `purchase` | +N | Credits bought via payment |
| `deduct` | -N | Credits used for operations |
| `refund` | +N | Credits returned (expired coupons) |
| `adjustment` | ±N | Manual admin corrections |

---

## ⏰ Automated Jobs

### Monthly Statement Generation
- **Schedule**: 1st of month at 1:00 AM
- **Action**: Generate statements for ALL merchants, agents, and master
- **Output**: PDF files in `uploads/statements/`

### Coupon Expiry Refund
- **Schedule**: Daily at 2:00 AM
- **Action**: Refund credits for expired batches with untaken coupons
- **Rule**: Only coupons with status='created' (never taken) are refunded

---

## 🔍 Quick Testing

### Test 1: Credit Purchase → Ledger
```bash
# 1. Purchase credits
POST /api/v1/wallets/merchant/purchase-credits

# 2. Check ledger
GET /api/v1/credit-ledgers?action=purchase
# ✅ Verify: action='purchase', amount > 0
```

### Test 2: Coupon Batch → Deduction
```bash
# 1. Generate batch
POST /api/v1/coupon-batches

# 2. Check ledger
GET /api/v1/credit-ledgers?action=deduct&credit_type=coupon
# ✅ Verify: action='deduct', amount < 0
```

### Test 3: WhatsApp Message → Tracking
```bash
# 1. Send feedback (triggers UI message)
POST /api/v1/feedbacks

# 2. Check ledger
GET /api/v1/credit-ledgers?credit_type=wa_ui
# ✅ Verify: credit_type='wa_ui', action='deduct'
```

### Test 4: Monthly Statement
```bash
# 1. Generate statement
POST /api/v1/monthly-statements/generate
Body: {"year": 2026, "month": 1}

# 2. Download PDF
GET /api/v1/monthly-statements/:id/download
# ✅ Verify: PDF includes company name, all sections present
```

---

## 🐛 Troubleshooting

### Issue: No ledger entry after credit operation
**Check:**
1. CreditLedgerService is properly injected
2. Ledger creation happens AFTER transaction commit
3. Check database for constraint violations

### Issue: Statement balances don't match
**Fix:**
1. Query ledger entries for the period
2. Manually calculate: opening + purchased - used + refunded = closing
3. Verify all transactions have ledger entries

### Issue: PDF not generated
**Check:**
1. `uploads/statements/` directory exists with write permissions
2. pdfkit package is installed
3. Check logs for PDF generation errors

### Issue: Cron jobs not running
**Verify:**
1. ScheduleModule imported in AppModule
2. Cron services registered in modules
3. Check PM2 logs: `pm2 logs | grep cron`

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [MILESTONE4_IMPLEMENTATION_SUMMARY.md](./MILESTONE4_IMPLEMENTATION_SUMMARY.md) | Complete implementation details |
| [POSTMAN_ENDPOINTS_MILESTONE4.md](./POSTMAN_ENDPOINTS_MILESTONE4.md) | API endpoint documentation |
| [TESTING_GUIDE_MILESTONE4.md](./TESTING_GUIDE_MILESTONE4.md) | Step-by-step testing procedures |
| [milestone4_extended.md](./src/milestone4_extended.md) | Original requirements |

---

## ✅ Pre-Deployment Checklist

- [x] Database migration executed
- [x] Build successful
- [x] All services integrated
- [ ] Postman collection updated
- [ ] Integration tests passed
- [ ] Cron jobs verified
- [ ] Production deployment

---

## 🎯 Next Steps

1. **Update Postman Collection**
   - Add 6 new endpoints
   - Test all scenarios
   - Export as version 45

2. **Run Integration Tests**
   - Follow TESTING_GUIDE_MILESTONE4.md
   - Verify all test suites pass
   - Document any issues found

3. **Monitor First Automated Runs**
   - Check statement generation on 1st
   - Verify expiry refunds daily
   - Review logs for errors

4. **User Training**
   - Show merchants how to view statements
   - Explain credit types and costs
   - Demonstrate PDF downloads

---

## 📞 Support

For questions or issues:
1. Check documentation files above
2. Review implementation code in modules
3. Check system logs for errors
4. Contact development team

---

**Last Updated:** January 30, 2026  
**Version:** 1.0.0  
**Status:** ✅ READY FOR TESTING
