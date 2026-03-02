import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Approval } from './entities/approval.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { MerchantSetting } from '../merchant-settings/entities/merchant-setting.entity';

@Injectable()
export class ApprovalExpiryCronService {
  constructor(
    @Inject('APPROVAL_REPOSITORY')
    private approvalRepository: Repository<Approval>,
    @Inject('MERCHANT_REPOSITORY')
    private merchantRepository: Repository<Merchant>,
    @Inject('MERCHANT_SETTING_REPOSITORY')
    private merchantSettingRepository: Repository<MerchantSetting>,
  ) {}

  // Run every day at midnight to check for expired paid ads
  @Cron('0 0 * * *') // Run daily at midnight
  async expirePaidAds() {
    console.log('[ApprovalExpiryCron] Starting paid ads expiry check...');

    try {
      const currentDate = new Date();

      // Find all approved paid ads that have expired
      const expiredAds = await this.approvalRepository.find({
        where: {
          approval_type: 'paid_ad',
          approval_status: 'approved',
        },
      });

      // Filter ads that are actually expired
      const adsToExpire = expiredAds.filter(ad => {
        if (!ad.ad_expired_at) return false;
        return new Date(ad.ad_expired_at) <= currentDate;
      });

      if (adsToExpire.length === 0) {
        console.log('[ApprovalExpiryCron] No paid ads to expire');
        return;
      }

      console.log(`[ApprovalExpiryCron] Found ${adsToExpire.length} paid ads to expire`);

      // Update each expired ad
      for (const ad of adsToExpire) {
        console.log(`[ApprovalExpiryCron] Expiring ad ${ad.id} for merchant ${ad.merchant_id}`);
        
        // Update approval status to 'expired'
        await this.approvalRepository.update(ad.id, {
          approval_status: 'expired',
        });

        // Update merchant and merchant settings to disable paid_ads
        await this.merchantSettingRepository.update(
          { merchant_id: ad.merchant_id },
          { paid_ads: false }
        );

        await this.merchantRepository.update(
          { id: ad.merchant_id },
          { paid_ads: false }
        );

        console.log(`[ApprovalExpiryCron] Successfully expired ad ${ad.id}`);
      }

      console.log(`[ApprovalExpiryCron] Completed expiry check. Expired ${adsToExpire.length} ads`);
    } catch (error) {
      console.error('[ApprovalExpiryCron] Error during paid ads expiry check:', error);
    }
  }

  // Run every 10 minutes to remove ended homepage placements (coupon batches + ads)
  @Cron(CronExpression.EVERY_10_SECONDS)
  async expireHomepagePlacements() {
    console.log('[ApprovalExpiryCron] Starting homepage placements expiry check...');

    try {
      const currentDate = new Date();

      const expiredHomepagePlacements = await this.approvalRepository.find({
        where: [
          {
            approval_type: 'homepage_coupon_push',
            approval_status: 'payment_completed_active',
            payment_status: 'paid',
            ad_expired_at: LessThanOrEqual(currentDate),
          },
          {
            approval_type: 'homepage_ad_push',
            approval_status: 'payment_completed_active',
            payment_status: 'paid',
            ad_expired_at: LessThanOrEqual(currentDate),
          },
        ],
      });

      if (expiredHomepagePlacements.length === 0) {
        console.log('[ApprovalExpiryCron] No homepage placements to expire');
        return;
      }

      console.log(
        `[ApprovalExpiryCron] Found ${expiredHomepagePlacements.length} homepage placements to expire`,
      );

      for (const placement of expiredHomepagePlacements) {
        await this.approvalRepository.update(placement.id, {
          approval_status: 'expired',
        });
      }

      console.log(
        `[ApprovalExpiryCron] Completed homepage placement expiry. Expired ${expiredHomepagePlacements.length} records`,
      );
    } catch (error) {
      console.error('[ApprovalExpiryCron] Error during homepage placements expiry check:', error);
    }
  }
}
