import {
  Inject,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dtos/register.dto';
import { UploadFileDto } from './dtos/upload-file.dto';
import { uploadFile } from 'src/common/helpers/file-upload.helper';
import { UserHasRoleService } from '../roles-permission-management/user-has-role/user-has-role.service';
import { EncryptionHelper } from 'src/common/helpers/encryption-helper';
import { Admin } from '../admins/entities/admin.entity';
import { SuperAdmin } from '../super-admins/entities/super-admin.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Customer } from '../customers/entities/customer.entity';
import { AdminWallet } from '../wallets/entities/admin-wallet.entity';
import { MerchantWallet } from '../wallets/entities/merchant-wallet.entity';
import { SystemLogService } from '../system-logs/system-log.service';
import { SystemLogAction } from 'src/common/enums/system-log.enum';





@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_REPOSITORY') private userRepository: Repository<User>,
    @Inject('ADMIN_REPOSITORY') private adminRepository: Repository<Admin>,
    @Inject('MERCHANT_REPOSITORY') private merchantRepository: Repository<Merchant>,
    @Inject('CUSTOMER_REPOSITORY') private customerRepository: Repository<Customer>,
    @Inject('ADMIN_WALLET_REPOSITORY') private adminWalletRepository: Repository<AdminWallet>,
    @Inject('MERCHANT_WALLET_REPOSITORY') private merchantWalletRepository: Repository<MerchantWallet>,
    @Inject('SUPER_ADMIN_REPOSITORY') private superAdminRepository: Repository<SuperAdmin>,
    private jwtService: JwtService,
    private userHasRoleService: UserHasRoleService,
    private encryptionHelper: EncryptionHelper,
    private systemLogService: SystemLogService,
  ) { }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { data: userHasRole } = await this.userHasRoleService.findByUserId(
      Number(user.id),
    );
    if (!userHasRole) {
      throw new UnprocessableEntityException('User has no roles assigned');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }


    let merchantId: number | null = null;
    let adminId: number | null = null;
    let superAdminId: number | null = null;
    let customerId: number | null = null;
    let adminWalletData: AdminWallet | null = null;
    let subscriptionExpiresAt: Date | null = null;
    console.log("i am checking this", userHasRole);

    const roleName = userHasRole.role.name;
    if (roleName === 'merchant') {
      const merchant = await this.merchantRepository.findOne({ where: { user_id: Number(user.id) } });
      if (merchant) {
        merchantId = merchant.id;
        // Check merchant subscription expiration
        const merchantWallet = await this.merchantWalletRepository.findOne({ where: { merchant_id: merchant.id } });
        if (
          merchantWallet &&
          merchantWallet.subscription_type === 'annual' &&
          merchantWallet.subscription_expires_at &&
          merchantWallet.subscription_expires_at < new Date()
        ) {
          // Auto-downgrade to temporary
          merchantWallet.subscription_type = 'temporary';
          merchant.merchant_type = 'temporary';

          await this.merchantWalletRepository.save(merchantWallet);
          await this.merchantRepository.save(merchant);
          console.log(`Merchant ${merchant.id} subscription downgraded to temporary due to expiration.`);
        } else {
          console.log('merchant plan is not expired');
        }
      }
    } else if (roleName === 'admin') {
      const admin = await this.adminRepository.findOne({ where: { user_id: Number(user.id) } });
      if (admin) {
        adminId = admin.id;

        // Check admin subscription expiration
        const adminWallet = await this.adminWalletRepository.findOne({ where: { admin_id: admin.id } });
        console.log("i am checking this ----> adminWallet", adminWallet);

        if (adminWallet) {
          let isExpired = false;

          // If subscription_expires_at is null or expired, mark as expired
          if (!adminWallet.subscription_expires_at) {
            isExpired = true;
            console.log('Admin subscription has expired - null subscription_expires_at');
          } else {
            subscriptionExpiresAt = adminWallet.subscription_expires_at;
            if (adminWallet.subscription_expires_at < new Date()) {
              isExpired = true;
              console.log('Admin subscription has expired - past date');
            } else {
              console.log('Admin still has access to the subscription plan');
            }
          }

          // Update is_subscription_expired if it doesn't match current state
          if (adminWallet.is_subscription_expired !== isExpired) {
            adminWallet.is_subscription_expired = isExpired;
            adminWalletData = await this.adminWalletRepository.save(adminWallet);
          } else {
            adminWalletData = adminWallet;
          }
        }
      }
    } else if (roleName === 'super_admin') {
      const superAdmin = await this.superAdminRepository.findOne({ where: { user_id: Number(user.id) } });
      if (superAdmin) {
        superAdminId = superAdmin.id;
      }
    }
    // Note: Customers don't have user accounts anymore
    const payload = {
      sub: user.id,
      email: user.email,
      role: roleName, // use string role name
      merchantId,
      adminId,
      superAdminId,
      customerId,
      isSubscriptionExpired: adminWalletData?.is_subscription_expired ?? false,
    };
    const response: any = {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        is_active: user.is_active,
        role: roleName, // use string role name
        merchantId,
        adminId,
        superAdminId,
        customerId,
        is_subscription_expired: adminWalletData?.is_subscription_expired ?? false,
        subscription_expires_at: subscriptionExpiresAt,
      },
    };

    // Fetch and include role-specific object
    if (roleName === 'admin') {
      const admin = await this.adminRepository.findOne({
        where: { user_id: Number(user.id) },
      });
      if (admin) {
        response.admin = admin;
      }
    } else if (roleName === 'merchant') {
      const merchant = await this.merchantRepository.findOne({
        where: { user_id: Number(user.id) },
      });
      if (merchant) {
        response.merchant = merchant;
      }
    }
    // Note: Customers don't have user accounts anymore

    // Log successful login
    await this.systemLogService.logAuth(
      SystemLogAction.LOGIN,
      user.id,
      roleName,
      `User ${user.email} logged in successfully`,
      {
        email: user.email,
        role: roleName,
        merchantId,
        adminId,

      },
    );

    return response;
  }

  async register(registerDto: RegisterDto) {
    const user = this.userRepository.create({
      ...registerDto,
      password: await bcrypt.hash(registerDto.password, 10),
    });
    const newUser = await this.userRepository.save(user);

    const payload = { sub: newUser.id, email: newUser.email };

    // Log successful registration
    await this.systemLogService.logAuth(
      SystemLogAction.REGISTER,
      newUser.id,
      'user',
      `New user ${newUser.email} registered`,
      {
        email: newUser.email,
      },
    );

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    };
  }

  async uploadFile(uploadFileDto: UploadFileDto) {
    const { file } = uploadFileDto;

    const uploaded = await uploadFile(file, 'auth');

    return {
      message: `Uploaded file ${uploaded.fileName} successfully`,
      file: uploaded.relativePath,
    };
  }
}
