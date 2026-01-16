import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { userProvider } from '../users/user.provider';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { IsUniqueConstraint } from '../../common/validators/is-unique.validator';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserHasRoleModule } from '../roles-permission-management/user-has-role/user-has-role.module';
import { EncryptionHelper } from '../../common/helpers/encryption-helper';
import { UserModule } from '../users/user.module';
import { superAdminProviders } from '../super-admins/super-admin.provider';
import { adminProviders } from '../admins/admin.provider';
import { merchantProviders } from '../merchants/merchant.provider';
import { customerProviders } from '../customers/customer.provider';
import { SystemLogModule } from '../system-logs/system-log.module';

@Module({
  imports: [
    NestjsFormDataModule,
    DatabaseModule,
    SystemLogModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('APP_KEY'),
        signOptions: { expiresIn: '10d' },
      }),
      inject: [ConfigService],
    }),
    UserHasRoleModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    ...userProvider,
    ...superAdminProviders,
    ...adminProviders,
    ...merchantProviders,
    ...customerProviders,
    ...walletProviders,
    IsUniqueConstraint,
    EncryptionHelper,
  ],
  exports: [AuthService, JwtModule, IsUniqueConstraint, EncryptionHelper],
})
export class AuthModule { }
