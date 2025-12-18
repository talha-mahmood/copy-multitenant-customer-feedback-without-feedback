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

@Module({
  imports: [
    NestjsFormDataModule,
    DatabaseModule,
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
  providers: [AuthService, JwtStrategy, ...userProvider, IsUniqueConstraint, EncryptionHelper],
  exports: [AuthService, JwtModule, IsUniqueConstraint, EncryptionHelper],
})
export class AuthModule {}
